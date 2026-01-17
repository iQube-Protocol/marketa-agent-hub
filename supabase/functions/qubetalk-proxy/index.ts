// Supabase Edge Function: qubetalk-proxy
// Proxies QubeTalk requests server-side to avoid browser CORS issues.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AllowedEndpoint = '/channels' | '/messages' | '/transfers';

type ProxyRequest = {
  endpoint: AllowedEndpoint;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

const BASE_URL = Deno.env.get('QUBETALK_BASE_URL') ?? 'https://dev-beta.aigentz.me';
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
    const payload = (await req.json()) as ProxyRequest;

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
    url.searchParams.set('tenant_id', DEFAULT_TENANT_ID);
    if (payload.query) {
      for (const [key, value] of Object.entries(payload.query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    console.log('QubeTalk proxy request', { method, url: url.toString(), endpoint, apiPath });

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-persona-id': DEFAULT_PERSONA_ID,
      },
      body: method === 'GET' ? undefined : JSON.stringify(payload.body ?? {}),
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
