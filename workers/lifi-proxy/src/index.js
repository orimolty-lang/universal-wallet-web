/**
 * Li.Fi API Proxy Worker
 * Hides API key from frontend, adds CORS headers
 */

const LIFI_API_BASE = "https://li.quest/v1";
const ZEROX_API_BASE = "https://api.0x.org";
const MOBULA_API_BASE = "https://api.mobula.io/api/1";
const PYTH_TV_BASE = "https://benchmarks.pyth.network/v1/shims/tradingview";

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

      // Pyth TradingView shim proxy path: /pyth-tv/*
      if (url.pathname.startsWith("/pyth-tv/")) {
        const pythPath = url.pathname.replace("/pyth-tv", "");
        const pythUrl = new URL(`${PYTH_TV_BASE}${pythPath}`);
        url.searchParams.forEach((value, key) => {
          pythUrl.searchParams.set(key, value);
        });

        const pythResponse = await fetch(pythUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
          },
          body: request.method !== "GET" ? await request.text() : undefined,
        });

        const text = await pythResponse.text();
        return new Response(text, {
          status: pythResponse.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders(env),
          },
        });
      }

      // 0x proxy path: /0x/*
      if (url.pathname.startsWith("/0x/")) {
        const zeroXPath = url.pathname.replace("/0x", "");
        const zeroXUrl = new URL(`${ZEROX_API_BASE}${zeroXPath}`);
        url.searchParams.forEach((value, key) => {
          zeroXUrl.searchParams.set(key, value);
        });

        const zeroXResponse = await fetch(zeroXUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "0x-api-key": env.ZEROX_API_KEY,
            "0x-version": "v2",
          },
          body: request.method !== "GET" ? await request.text() : undefined,
        });

        const text = await zeroXResponse.text();
        return new Response(text, {
          status: zeroXResponse.status,
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
