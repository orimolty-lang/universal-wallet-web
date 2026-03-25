# Clicker Proxy Worker — Deployment Guide

Deploys a Cloudflare Workers proxy that:
- Hides your Clicker API key from the frontend
- Adds CORS headers for browser requests
- Proxies requests to `https://api.clicker.xyz`

## Deploy (one-time)

```bash
cd workers/clicker-proxy

# Login to Cloudflare (if not already)
npx wrangler login

# Deploy with your API key
npx wrangler secret put CLICKER_API_KEY
# Paste: berpetuals_b7731fbd9c914c8ba824b42f2b815484

# Deploy
npx wrangler deploy
```

Your worker will get a URL like:
`https://clicker-proxy.<username>.workers.dev`

## Update your frontend env

In `ua-conneckit/.env` (create from `.env.example`):

```bash
NEXT_PUBLIC_CLICKER_PROXY_URL=https://clicker-proxy.<username>.workers.dev
```

Then rebuild and push to `gh-pages`.

## Test the proxy

```bash
curl "https://clicker-proxy.<username>.workers.dev/v2/leaderboard?chain=base&limit=3"
```

Should return JSON with the Clicker leaderboard.

## Endpoints proxied

| Frontend path | Clicker path |
|---|---|
| `/clicker/v1/tokens/{addr}/positions` | `/v1/tokens/{addr}/positions` |
| `/clicker/v1/swap-comments` | `/v1/swap-comments` |
| `/clicker/v1/swap-comment/{id}/copyswap` | `/v1/swap-comment/{id}/copyswap` (POST) |
| `/clicker/v1/addresses/{id}/profile` | `/v1/addresses/{id}/profile` |
| `/clicker/v2/leaderboard` | `/v2/leaderboard` |
| `/clicker/v1/search` | `/v1/search` |
| `/clicker/v1/addresses/{id}/follow` | `/v1/addresses/{id}/follow` (PUT/DELETE) |
| `/clicker/v1/webhooks/feed` | `/v1/webhooks/feed` |

## Supported chains

- `base`
- `ethereum`
- `solana`

The worker validates chain names server-side. Requests for unsupported chains return an empty result gracefully (no crash).
