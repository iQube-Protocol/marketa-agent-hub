// Supabase Edge Function: qubetalk-proxy
// Proxies QubeTalk requests server-side to avoid browser CORS issues.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

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
// Default to 'metaproof' tenant for this deployment
const DEFAULT_TENANT_ID = Deno.env.get('QUBETALK_TENANT_ID') ?? 'metaproof';
// Default persona handle - will be resolved to CRM UUID
const DEFAULT_PERSONA_HANDLE = Deno.env.get('QUBETALK_PERSONA_HANDLE') ?? 'qriptiq@knyt';
const DEFAULT_PERSONA_ID = Deno.env.get('QUBETALK_PERSONA_ID') ?? '';
const IDENTITY_PERSONA_PATH_PREFIX = Deno.env.get('QUBETALK_IDENTITY_PERSONA_PATH_PREFIX') ?? '/api/identity/persona/';

const handleCache = new Map<string, { persona_id?: string; tenant_id?: string }>();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '';
// Supabase CLI disallows secrets starting with SUPABASE_, so accept SERVICE_ROLE_KEY.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const supabase =
  SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : null;

function isPersonaHandle(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.includes('@');
}

async function resolvePersonaHandle(handle: string): Promise<{ persona_id?: string; tenant_id?: string }> {
  const key = handle.trim();
  if (!key) return {};

  const cached = handleCache.get(key);
  if (cached) return cached;

  const url = `${BASE_URL}${IDENTITY_PERSONA_PATH_PREFIX}${encodeURIComponent(key)}`;
  const resp = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!resp.ok) return {};

  const raw = (await resp.json()) as any;
  const data = raw?.data ?? raw;

  const persona_id = data?.id || data?.persona_id || data?.persona?.id || data?.persona?.persona_id;
  const tenant_id = data?.tenant_id || data?.persona?.tenant_id || data?.tenant?.tenant_id;

  const resolved = {
    ...(persona_id ? { persona_id: String(persona_id) } : {}),
    ...(tenant_id ? { tenant_id: String(tenant_id) } : {}),
  };

  handleCache.set(key, resolved);
  return resolved;
}

async function resolveCrmPersonaId(input: { identityPersonaId: string; tenantId?: string }): Promise<{ crm_persona_id?: string; tenant_id?: string }> {
  if (!supabase) return {};
  const identityPersonaId = input.identityPersonaId.trim();
  if (!identityPersonaId) return {};

  let query = supabase
    .from('crm_personas')
    .select('id, tenant_id')
    .eq('identity_persona_id', identityPersonaId)
    .limit(1);

  if (input.tenantId) {
    query = query.eq('tenant_id', input.tenantId);
  }

  const { data, error } = await query.single();
  if (error || !data) return {};

  return { crm_persona_id: data.id, tenant_id: data.tenant_id };
}

async function resolveCrmPersonaFromHandle(input: { handle: string; tenantId?: string }): Promise<{ crm_persona_id?: string; tenant_id?: string }> {
  if (!supabase) return {};
  const handle = input.handle.trim();
  if (!handle) return {};

  // Prefer the join view if available: it contains fio_handle for identity mapping.
  // Use tenant_id filter when provided, but fall back to any tenant if not found.
  const base = supabase
    .from('crm_personas_with_identity')
    .select('id, tenant_id')
    .eq('fio_handle', handle)
    .limit(1);

  const preferred = input.tenantId ? base.eq('tenant_id', input.tenantId) : base;
  const preferredRes = await preferred.maybeSingle();
  if (!preferredRes.error && preferredRes.data?.id) {
    return { crm_persona_id: String(preferredRes.data.id), tenant_id: preferredRes.data.tenant_id ?? undefined };
  }

  const fallbackRes = await base.maybeSingle();
  if (!fallbackRes.error && fallbackRes.data?.id) {
    return { crm_persona_id: String(fallbackRes.data.id), tenant_id: fallbackRes.data.tenant_id ?? undefined };
  }

  return {};
}

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

    const inboundTenant = (req.headers.get('x-tenant-id') ?? '').trim();
    const inboundPersona = (req.headers.get('x-persona-id') ?? '').trim();

    let effectiveTenantId = inboundTenant || DEFAULT_TENANT_ID;
    // If no persona provided, use default handle (will be resolved below)
    let effectivePersonaId = inboundPersona || DEFAULT_PERSONA_HANDLE || DEFAULT_PERSONA_ID;

    // Always try to resolve if we have a handle (contains @)
    if (isPersonaHandle(effectivePersonaId)) {
      console.log('Resolving persona handle:', effectivePersonaId);
      
      // Step 0: if CRM has fio_handle mapping, use it directly.
      const crmFromHandle = await resolveCrmPersonaFromHandle({ handle: effectivePersonaId, tenantId: effectiveTenantId });
      if (crmFromHandle.crm_persona_id) {
        console.log('Resolved CRM persona from handle:', crmFromHandle.crm_persona_id);
        effectivePersonaId = crmFromHandle.crm_persona_id;
      }
      if (crmFromHandle.tenant_id) effectiveTenantId = crmFromHandle.tenant_id;

      // If not found via fio_handle, try identity API
      if (isPersonaHandle(effectivePersonaId)) {
        const resolved = await resolvePersonaHandle(effectivePersonaId);
        console.log('Identity API resolved:', resolved);
        
        // Step 1: resolve identity persona UUID from handle
        if (resolved.persona_id) {
          // Step 2: map identity persona UUID -> CRM persona UUID used by QubeTalk auth
          const crm = await resolveCrmPersonaId({ identityPersonaId: resolved.persona_id, tenantId: effectiveTenantId });
          if (crm.crm_persona_id) {
            console.log('CRM persona from identity:', crm.crm_persona_id);
            effectivePersonaId = crm.crm_persona_id;
          }
          if (crm.tenant_id) effectiveTenantId = crm.tenant_id;
        }
        // Only override tenant if identity resolver returns a tenant.
        if (resolved.tenant_id) effectiveTenantId = resolved.tenant_id;
      }
    }

    console.log('Effective IDs:', { effectiveTenantId, effectivePersonaId });

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
