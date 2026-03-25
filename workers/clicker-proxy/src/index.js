/**
 * Clicker API Proxy Worker
 * Hides API key from frontend, adds CORS headers
 * Base URL: https://api.clicker.xyz
 */

const CLICKER_API_BASE = "https://api.clicker.xyz";

const corsHeaders = (env) => ({
  "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
  "Access-Control-Max-Age": "86400",
});

// Map our internal chain slugs to Clicker chain names
const CHAIN_MAP = {
  ethereum: "ethereum",
  base: "base",
  solana: "solana",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace("/clicker", "");
    const apiKey = env.CLICKER_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Clicker API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(env) },
      });
    }

    // Build the target URL
    const targetUrl = new URL(`${CLICKER_API_BASE}${path}`);
    url.searchParams.forEach((value, key) => {
      // Skip our custom query params
      if (key !== "chain" && key !== "tokenAddress") {
        targetUrl.searchParams.set(key, value);
      }
    });

    // Optional: inject chain filter as query param if provided
    const chainParam = url.searchParams.get("chain");
    if (chainParam && CHAIN_MAP[chainParam]) {
      targetUrl.searchParams.set("chain", CHAIN_MAP[chainParam]);
    }

    try {
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };

      // Forward webhook secret if present
      const webhookSecret = request.headers.get("X-Webhook-Secret");
      if (webhookSecret) {
        headers["X-Webhook-Secret"] = webhookSecret;
      }

      const fetchOptions = {
        method: request.method,
        headers,
      };

      if (request.method !== "GET" && request.method !== "HEAD") {
        fetchOptions.body = await request.text();
      }

      const response = await fetch(targetUrl.toString(), fetchOptions);
      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(env),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error?.message || "Proxy error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(env) },
      });
    }
  },
};
