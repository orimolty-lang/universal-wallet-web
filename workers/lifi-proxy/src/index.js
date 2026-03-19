/**
 * Li.Fi API Proxy Worker
 * Hides API key from frontend, adds CORS headers
 */

const LIFI_API_BASE = "https://li.quest/v1";
const MOBULA_API_BASE = "https://api.mobula.io/api/1";

const corsHeaders = (env) => ({
  "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
});

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    try {
      // Mobula proxy path: /mobula/api/1/*
      if (url.pathname.startsWith("/mobula/api/1/")) {
        const mobulaPath = url.pathname.replace("/mobula/api/1", "");
        const mobulaUrl = new URL(`${MOBULA_API_BASE}${mobulaPath}`);
        url.searchParams.forEach((value, key) => {
          mobulaUrl.searchParams.set(key, value);
        });

        const mobulaResponse = await fetch(mobulaUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: env.MOBULA_API_KEY,
          },
          body: request.method !== "GET" ? await request.text() : undefined,
        });

        const text = await mobulaResponse.text();
        return new Response(text, {
          status: mobulaResponse.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(env),
          },
        });
      }

      // LiFi proxy path (default): /lifi/* or /*
      const path = url.pathname.startsWith("/lifi")
        ? url.pathname.replace("/lifi", "")
        : url.pathname;

      const lifiUrl = new URL(`${LIFI_API_BASE}${path}`);
      url.searchParams.forEach((value, key) => {
        lifiUrl.searchParams.set(key, value);
      });
      lifiUrl.searchParams.set("integrator", "Omni");

      const lifiResponse = await fetch(lifiUrl.toString(), {
        method: request.method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-lifi-api-key": env.LIFI_API_KEY,
        },
        body: request.method !== "GET" ? await request.text() : undefined,
      });

      const text = await lifiResponse.text();
      return new Response(text, {
        status: lifiResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(env),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error?.message || "Proxy error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(env),
        },
      });
    }
  },
};
