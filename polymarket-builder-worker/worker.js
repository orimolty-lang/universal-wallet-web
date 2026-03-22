import { buildHmacSignature } from "@polymarket/builder-signing-sdk";

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

    if (url.pathname === "/health") {
      return json({ ok: true, service: "polymarket-builder-worker" });
    }

    // Remote builder signing endpoint for CLOB client BuilderConfig.remoteBuilderConfig
    if (url.pathname === "/builder/sign" && request.method === "POST") {
      try {
        const body = await request.json();
        const method = String(body?.method || "GET");
        const path = String(body?.path || "/");
        const reqBody = typeof body?.body === "string" ? body.body : JSON.stringify(body?.body || "");

        if (!env.POLY_BUILDER_API_KEY || !env.POLY_BUILDER_SECRET || !env.POLY_BUILDER_PASSPHRASE) {
          return json({ error: "Missing builder secrets" }, 500);
        }

        const ts = Date.now().toString();
        const signature = buildHmacSignature(
          env.POLY_BUILDER_SECRET,
          parseInt(ts, 10),
          method,
          path,
          reqBody,
        );

        return json({
          POLY_BUILDER_SIGNATURE: signature,
          POLY_BUILDER_TIMESTAMP: ts,
          POLY_BUILDER_API_KEY: env.POLY_BUILDER_API_KEY,
          POLY_BUILDER_PASSPHRASE: env.POLY_BUILDER_PASSPHRASE,
        });
      } catch (e) {
        return json({ error: "sign_failed", details: String(e) }, 500);
      }
    }

    return json({ error: "not_found", path: url.pathname }, 404);
  },
};
