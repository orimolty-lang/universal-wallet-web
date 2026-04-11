/**
 * Li.Fi API Proxy Worker
 * Hides API key from frontend, adds CORS headers
 */

const LIFI_API_BASE = "https://li.quest/v1";
const ZEROX_API_BASE = "https://api.0x.org";
const MOBULA_API_BASE = "https://api.mobula.io/api/1";
const PYTH_TV_BASE = "https://benchmarks.pyth.network/v1/shims/tradingview";
const ZERION_API_BASE = "https://api.zerion.io/v1";

// Mobula API key rotation: prefer the new key first, then env keys as fallbacks.
const MOBULA_PRIMARY_API_KEY = "1055ae87-773e-4286-8fc0-c7d83f4d3a50";

const ZEROX_CHAIN_ALIAS_TO_ID = {
  monad: 10143,
};

const ZEROX_CHAIN_ID_MAP = {
  // UA uses Monad as 143; 0x expects 10143.
  "143": 10143,
};

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

        const isGet = request.method === "GET";
        const cache = caches.default;
        const cacheKey = new Request(mobulaUrl.toString(), { method: "GET" });
        const cacheEligible =
          isGet && (
            mobulaPath.startsWith("/search") ||
            mobulaPath.startsWith("/metadata") ||
            mobulaPath.startsWith("/wallet/portfolio")
          );

        if (cacheEligible) {
          const hit = await cache.match(cacheKey);
          if (hit) {
            return new Response(await hit.text(), {
              status: hit.status,
              headers: {
                "Content-Type": hit.headers.get("Content-Type") || "application/json",
                "Cache-Control": hit.headers.get("Cache-Control") || "public, s-maxage=30, max-age=15",
                "X-Proxy-Cache": "HIT",
                ...corsHeaders(env),
              },
            });
          }
        }

        const mobulaKeys = Array.from(new Set([
          MOBULA_PRIMARY_API_KEY,
          env.MOBULA_API_KEY,
          env.MOBULA_API_KEY_BACKUP,
        ].filter(Boolean)));

        const requestBody = isGet ? undefined : await request.text();

        const fetchMobulaWithKey = async (apiKey) => fetch(mobulaUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: apiKey,
          },
          body: requestBody,
        });

        let mobulaResponse = null;

        // Try keys in order. Fail over on likely quota/auth/rate-limit/transient statuses.
        for (const key of mobulaKeys) {
          mobulaResponse = await fetchMobulaWithKey(key);
          if (mobulaResponse.status < 400) break;
          const shouldFailover = [401, 402, 403, 429].includes(mobulaResponse.status) || mobulaResponse.status >= 500;
          if (!shouldFailover) break;
        }

        // One short retry for transient upstream failures using the same rotation order.
        if (isGet && mobulaResponse && (mobulaResponse.status === 429 || mobulaResponse.status >= 500)) {
          await new Promise((r) => setTimeout(r, 250));
          for (const key of mobulaKeys) {
            mobulaResponse = await fetchMobulaWithKey(key);
            if (mobulaResponse.status < 400) break;
            const shouldFailover = [401, 402, 403, 429].includes(mobulaResponse.status) || mobulaResponse.status >= 500;
            if (!shouldFailover) break;
          }
        }

        // If still rate-limited and we have cached content, serve stale cache.
        if (cacheEligible && mobulaResponse.status === 429) {
          const stale = await cache.match(cacheKey);
          if (stale) {
            return new Response(await stale.text(), {
              status: 200,
              headers: {
                "Content-Type": stale.headers.get("Content-Type") || "application/json",
                "Cache-Control": stale.headers.get("Cache-Control") || "public, s-maxage=30, max-age=15",
                "X-Proxy-Cache": "STALE-429",
                ...corsHeaders(env),
              },
            });
          }
        }

        const text = await mobulaResponse.text();
        const out = new Response(text, {
          status: mobulaResponse.status,
          headers: {
            "Content-Type": mobulaResponse.headers.get("Content-Type") || "application/json",
            "Cache-Control": cacheEligible ? "public, s-maxage=30, max-age=15" : "no-store",
            "X-Proxy-Cache": "MISS",
            ...corsHeaders(env),
          },
        });

        if (cacheEligible && mobulaResponse.status === 200) {
          await cache.put(cacheKey, out.clone());
        }

        return out;
      }

      // Pyth TradingView shim proxy path: /pyth-tv/* (with edge cache to avoid upstream 429)
      if (url.pathname.startsWith("/pyth-tv/")) {
        const pythPath = url.pathname.replace("/pyth-tv", "");
        const pythUrl = new URL(`${PYTH_TV_BASE}${pythPath}`);
        url.searchParams.forEach((value, key) => {
          pythUrl.searchParams.set(key, value);
        });

        const isGet = request.method === "GET";
        const cache = caches.default;
        const cacheKey = new Request(pythUrl.toString(), { method: "GET" });

        if (isGet) {
          const hit = await cache.match(cacheKey);
          if (hit) {
            return new Response(await hit.text(), {
              status: hit.status,
              headers: {
                "Content-Type": hit.headers.get("Content-Type") || "application/json",
                ...corsHeaders(env),
              },
            });
          }
        }

        const pythResponse = await fetch(pythUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
          },
          body: isGet ? undefined : await request.text(),
        });

        const text = await pythResponse.text();
        const out = new Response(text, {
          status: pythResponse.status,
          headers: {
            "Content-Type": pythResponse.headers.get("Content-Type") || "application/json",
            "Cache-Control": "public, s-maxage=30, max-age=15",
            ...corsHeaders(env),
          },
        });

        if (isGet && pythResponse.status === 200) {
          await cache.put(cacheKey, out.clone());
        }

        return out;
      }

      // Image proxy path: /img?url=<encoded-image-url>
      if (url.pathname === "/img") {
        const src = url.searchParams.get("url");
        if (!src) {
          return new Response(JSON.stringify({ error: "Missing url param" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(env),
            },
          });
        }

        let parsed;
        try {
          parsed = new URL(src);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid image url" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(env),
            },
          });
        }

        if (!(parsed.protocol === "https:" || parsed.protocol === "http:")) {
          return new Response(JSON.stringify({ error: "Unsupported protocol" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders(env),
            },
          });
        }

        const imgResp = await fetch(parsed.toString(), {
          method: "GET",
          headers: {
            Accept: "image/*,*/*;q=0.8",
          },
        });

        const buf = await imgResp.arrayBuffer();
        return new Response(buf, {
          status: imgResp.status,
          headers: {
            "Content-Type": imgResp.headers.get("Content-Type") || "image/png",
            "Cache-Control": "public, s-maxage=3600, max-age=600",
            ...corsHeaders(env),
          },
        });
      }

      // Zerion proxy path: /zerion/*
      if (url.pathname.startsWith("/zerion/")) {
        const zerionPath = url.pathname.replace("/zerion", "");
        const zerionUrl = new URL(`${ZERION_API_BASE}${zerionPath}`);
        url.searchParams.forEach((value, key) => {
          zerionUrl.searchParams.set(key, value);
        });

        const key = env.ZERION_API_KEY || "";
        const basic = `Basic ${btoa(`${key}:`)}`;
        const zerionResponse = await fetch(zerionUrl.toString(), {
          method: request.method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: basic,
          },
          body: request.method !== "GET" ? await request.text() : undefined,
        });

        const text = await zerionResponse.text();
        return new Response(text, {
          status: zerionResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": request.method === "GET" ? "public, s-maxage=20, max-age=10" : "no-store",
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

        // Convenience alias support, e.g. /0x/...?...&chain=monad
        // 0x expects numeric chainId.
        const chainAlias = (zeroXUrl.searchParams.get("chain") || "").toLowerCase();
        if (chainAlias && !zeroXUrl.searchParams.get("chainId")) {
          const mapped = ZEROX_CHAIN_ALIAS_TO_ID[chainAlias];
          if (mapped) {
            zeroXUrl.searchParams.set("chainId", String(mapped));
          }
        }

        // Normalize known app chain IDs to 0x chain IDs.
        const requestedChainId = zeroXUrl.searchParams.get("chainId");
        if (requestedChainId && ZEROX_CHAIN_ID_MAP[requestedChainId]) {
          zeroXUrl.searchParams.set("chainId", String(ZEROX_CHAIN_ID_MAP[requestedChainId]));
        }

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
