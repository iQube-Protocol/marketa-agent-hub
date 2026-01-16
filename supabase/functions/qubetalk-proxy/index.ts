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

const MAX_UPSTREAM_BODY_CHARS = 1200;

const bodyPreview = (text: string) =>
  text.length > MAX_UPSTREAM_BODY_CHARS ? `${text.slice(0, MAX_UPSTREAM_BODY_CHARS)}…` : text;

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

    const url = new URL(`${BASE_URL}${API_PREFIX}${endpoint}`);
    if (payload.query) {
      for (const [key, value] of Object.entries(payload.query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    console.log('QubeTalk proxy request', { method, url: url.toString() });

    const upstreamRes = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
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
