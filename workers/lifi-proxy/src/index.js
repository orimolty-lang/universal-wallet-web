/**
 * Li.Fi API Proxy Worker
 * Hides API key from frontend, adds CORS headers
 */

const LIFI_API_BASE = "https://li.quest/v1";

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace("/lifi", ""); // e.g., /lifi/quote -> /quote
    
    // Build Li.Fi URL
    const lifiUrl = new URL(`${LIFI_API_BASE}${path}`);
    
    // Copy query params
    url.searchParams.forEach((value, key) => {
      lifiUrl.searchParams.set(key, value);
    });
    
    // Always add integrator
    lifiUrl.searchParams.set("integrator", "Omni");

    try {
      // Forward request to Li.Fi
      const lifiResponse = await fetch(lifiUrl.toString(), {
        method: request.method,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-lifi-api-key": env.LIFI_API_KEY,
        },
        body: request.method !== "GET" ? await request.text() : undefined,
      });

      const data = await lifiResponse.json();

      return new Response(JSON.stringify(data), {
        status: lifiResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
        },
      });
    }
  },
};
