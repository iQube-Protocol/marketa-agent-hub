// Supabase Edge Function: qubetalk-proxy
// Proxies QubeTalk requests server-side to avoid browser CORS issues.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-id, x-persona-id, x-dev-override',
};

type AllowedEndpoint = '/channels' | '/messages' | '/transfers';

type ProxyRequest = {
  endpoint: AllowedEndpoint;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

const BASE_URL = Deno.env.get('QUBETALK_BASE_URL') ?? Deno.env.get('AIGENTZ_BASE_URL') ?? 'https://dev-beta.aigentz.me';
const API_PREFIX = Deno.env.get('QUBETALK_API_PREFIX') ?? '/api/marketa/qubetalk';
const DEFAULT_TENANT_ID = Deno.env.get('QUBETALK_TENANT_ID') ?? 'demo-tenant';
const DEFAULT_PERSONA_ID = Deno.env.get('QUBETALK_PERSONA_ID') ?? '5ffe87a0-bd7f-49ba-aa11-d45bc2f6a009';

// Map endpoints to actual API paths
// /messages goes to root /api/marketa/qubetalk (no suffix)
// /channels goes to /api/marketa/qubetalk/channels
// /transfers goes to /api/marketa/qubetalk/transfers
const getApiPath = (endpoint: AllowedEndpoint): string => {
  if (endpoint === '/messages') {
    return ''; // Messages use root path
  }
  return endpoint; // /channels and /transfers keep their suffix
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BASE_URL) {
      return new Response(JSON.stringify({ error: 'QUBETALK_BASE_URL not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as ProxyRequest;

    const effectiveTenantId = req.headers.get('x-tenant-id') ?? DEFAULT_TENANT_ID;
    const effectivePersonaId = req.headers.get('x-persona-id') ?? DEFAULT_PERSONA_ID;

    const endpoint = payload?.endpoint;
    if (!endpoint || !['/channels', '/messages', '/transfers'].includes(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = payload.method ?? 'GET';
    const apiPath = getApiPath(endpoint);

    const url = new URL(`${BASE_URL}${API_PREFIX}${apiPath}`);
    // Always include tenant_id
    url.searchParams.set('tenant_id', effectiveTenantId);
    if (payload.query) {
      for (const [key, value] of Object.entries(payload.query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    console.log('QubeTalk proxy request', { method, url: url.toString(), endpoint, apiPath });

    const forwardAuth = req.headers.get('authorization') ?? undefined;
    const forwardApiKey = req.headers.get('apikey') ?? undefined;
    const forwardClientInfo = req.headers.get('x-client-info') ?? undefined;
    const forwardDevOverride = req.headers.get('x-dev-override') ?? undefined;

    // Build request body - inject tenant_id for POST requests
    let requestBody: unknown = undefined;
    if (method !== 'GET') {
      const baseBody = (payload.body ?? {}) as Record<string, unknown>;
      // Always inject tenant_id into body for POST/PUT/PATCH
      const enrichedBody: Record<string, unknown> = {
        ...baseBody,
        tenant_id: effectiveTenantId,
      };
      
      // For messages endpoint, map 'content' to 'message' if needed
      if (endpoint === '/messages' && enrichedBody.content && !enrichedBody.message) {
        enrichedBody.message = enrichedBody.content;
      }
      
      requestBody = enrichedBody;
    }

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-persona-id': effectivePersonaId,
        'x-tenant-id': effectiveTenantId,
        // Helps bypass ngrok's interstitial warning page on free tunnels.
        'ngrok-skip-browser-warning': 'true',
        ...(forwardDevOverride ? { 'x-dev-override': forwardDevOverride } : {}),
        ...(forwardAuth ? { authorization: forwardAuth } : {}),
        ...(forwardApiKey ? { apikey: forwardApiKey } : {}),
        ...(forwardClientInfo ? { 'x-client-info': forwardClientInfo } : {}),
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    const text = await upstreamRes.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    console.log('QubeTalk upstream response', { status: upstreamRes.status, bodyPreview: text.slice(0, 500) });

    return new Response(JSON.stringify(data), {
      status: upstreamRes.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('QubeTalk proxy error', error);
    return new Response(JSON.stringify({ error: 'Proxy failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
