# EIP-7702 Setup (Match Particle Example)

To match the [universal-accounts-7702](https://github.com/Particle-Network/universal-accounts-7702) example exactly:

## 1. Environment Variables

Copy from the example's `.env.example` and use the **same** credentials:

```bash
# Particle Network (from https://dashboard.particle.network)
NEXT_PUBLIC_PROJECT_ID="your-particle-project-id"
NEXT_PUBLIC_CLIENT_KEY="your-particle-client-key"
NEXT_PUBLIC_APP_ID="your-particle-app-id"

# Privy (from https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PUBLIC_PRIVY_CLIENT_ID="your-privy-client-id"
```

**Important:** If the example frontend (universal-accounts-7702.vercel.app) works with your login but our app doesn't, the example uses Particle's demo project. To test with the same setup:
- Deploy the example repo yourself with your `.env` – if that works, our app should work with the same credentials.
- Or contact Particle support to ensure your project has 7702 relay configured correctly.

## 2. Config Alignment

Our app now matches the example:
- **Privy**: `createOnLogin: "all-users"`, `clientId` when set
- **Convert**: `createBuyTransaction` for USDC Base → BNB BSC (same flow)
- **Signing**: Privy `signMessage` for rootHash, `handleEIP7702Authorizations` for 7702 auth

## 3. If AA24 Persists

AA24 = signature validation failure at the Particle relay. Possible causes:
1. **Different Particle project** – Example uses its project; ours uses yours. Relay config can differ.
2. **Different Privy app** – Different appId → different EOA → different UA identity.
3. **Particle project config** – Your project may need 7702 enabled. Contact Particle support with your project ID and the AA24 error.
