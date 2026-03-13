# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

OMNI is a Web3 Universal Wallet dApp built with Next.js 14 (static export). The main application code lives in `ua-conneckit/`. The repo root (`gh-pages` branch) also contains the static build output for GitHub Pages deployment.

### Running the application

- **Dev server:** `npm run dev` from `ua-conneckit/` — serves at `http://localhost:3000/universal-wallet-web/` (note the basePath).
- **Lint:** `npm run lint` from `ua-conneckit/`.
- **Build:** `npm run build` from `ua-conneckit/` (static export to `ua-conneckit/out/`).
- **Full GH-Pages build** (from repo root): `npm run build:gh-pages` — installs deps if missing, builds, and copies output to repo root.

### Environment variables

The app requires Particle Network credentials. Default public credentials are embedded in `scripts/build-gh-pages.sh` and work for development. To configure locally, copy `ua-conneckit/.env.example` to `ua-conneckit/.env.local` and fill in:

```
NEXT_PUBLIC_PROJECT_ID=c0cb9e74-192b-4bdc-ba62-852775c6e7fd
NEXT_PUBLIC_CLIENT_KEY=caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK
NEXT_PUBLIC_APP_ID=e5be9376-1d3a-4882-b4a5-c5c0ce1b5182
```

### Gotchas

- The Next.js config uses `basePath: '/universal-wallet-web'`, so the dev server URL is `http://localhost:3000/universal-wallet-web/`, not `http://localhost:3000/`.
- The project uses `output: 'export'` (static site generation). There is no server-side runtime.
- `ua-conneckit/package.json` has `resolutions` for `@coinbase/wallet-sdk`; if using yarn, these are respected automatically. With npm, peer dependency overrides may produce warnings (safe to ignore).
- Three optional Cloudflare Workers exist (`polymarket-proxy/`, `polymarket-builder-worker/`, `workers/lifi-proxy/`) for proxying external APIs. These are deployed separately and not needed for local development.
- No database, Docker, or backend server is required — the app is fully client-side.
