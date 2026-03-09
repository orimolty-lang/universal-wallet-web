export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const qs = url.search || "";

    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "public, max-age=30",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    let target = null;
    if (path === "/markets") target = `https://gamma-api.polymarket.com/markets${qs}`;
    if (path === "/events") target = `https://gamma-api.polymarket.com/events${qs}`;

    if (!target) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    try {
      const res = await fetch(target, {
        headers: {
          "accept": "application/json",
          "user-agent": "ua-polymarket-proxy/1.0",
        },
      });
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          ...cors,
          "content-type": res.headers.get("content-type") || "application/json",
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Upstream fetch failed", details: String(e) }), {
        status: 502,
        headers: { ...cors, "content-type": "application/json" },
      });
    }
  },
};
