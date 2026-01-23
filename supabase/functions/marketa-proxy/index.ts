/**
 * Marketa API Proxy Edge Function
 * 
 * Proxies requests to the Marketa Bridge API (dev-beta.aigentz.me)
 * to avoid CORS issues from the preview/production domain.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MARKETA_API_BASE = "https://dev-beta.aigentz.me";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id, x-persona-id, x-dev-override",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    const queryString = url.searchParams.toString().replace(/^path=[^&]*&?/, "");
    
    // Build target URL
    const targetUrl = `${MARKETA_API_BASE}${path}${queryString ? `?${queryString}` : ""}`;
    
    console.log(`[marketa-proxy] Proxying ${req.method} to ${targetUrl}`);

    // Forward headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward relevant headers from request
    const tenantId = req.headers.get("x-tenant-id");
    const personaId = req.headers.get("x-persona-id");
    const devOverride = req.headers.get("x-dev-override");

    if (tenantId) headers["x-tenant-id"] = tenantId;
    if (personaId) headers["x-persona-id"] = personaId;
    if (devOverride) headers["x-dev-override"] = devOverride;

    // Make request to target API
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      try {
        const body = await req.text();
        if (body) fetchOptions.body = body;
      } catch {
        // No body
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    console.log(`[marketa-proxy] Response status: ${response.status}`);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[marketa-proxy] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Proxy error" 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
