# Universal Wallet - React Native (iOS)

A React Native port of the Universal Wallet webapp, powered by **Particle Network Universal Accounts SDK** with native **Particle Connect** for social login authentication.

This is a 100% feature port of the Next.js webapp (`ua-conneckit/`) into a native iOS app using Expo and Particle's React Native SDKs.

## Architecture

### Auth: Particle Connect (same as webapp)

The webapp uses `@particle-network/connectkit` for social logins. The React Native app uses `@particle-network/rn-connect` which provides the **identical ConnectKit experience** natively:

- Social logins: Google, Apple, Twitter, GitHub, Facebook, Microsoft, LinkedIn, Discord, Twitch
- Email and phone login
- External wallets: MetaMask (via WalletConnect)

### Universal Accounts: Same SDK

Both the webapp and this RN app use the exact same `@particle-network/universal-account-sdk` JavaScript package. The UA SDK is a pure JS/TS library that works in React Native with polyfills (confirmed by Particle Network's dev team).

### Signing Flow

| Step | Webapp | React Native |
|------|--------|-------------|
| **Auth** | `@particle-network/connectkit` | `@particle-network/rn-connect` |
| **Get address** | `useAccount().address` | `particleConnect.getAccounts()` |
| **Init UA** | `new UniversalAccount(config)` | `new UniversalAccount(config)` (identical) |
| **Sign message** | `walletClient.signMessage({ message: { raw: rootHash } })` | `particleConnect.signMessage(WalletType.AuthCore, address, hexMessage)` |
| **Send tx** | `universalAccount.sendTransaction(tx, sig)` | `universalAccount.sendTransaction(tx, sig)` (identical) |

## Features Ported

- Login screen with Particle ConnectKit (social + wallet)
- Home tab: Universal balance, Receive, Send, EVM & Solana UA addresses, asset list
- Search tab (placeholder)
- Agent tab (placeholder)
- Activity tab (placeholder)
- Deposit modal with supported chains and copy-to-clipboard
- Asset breakdown modal (by asset / by chain) with expandable chain distribution
- SendFunds: USDC transfer on Arbitrum via `createTransferTransaction`
- UniversalTransfer: USDC to EOA via `createUniversalTransaction`
- SendSolana: Native SOL transfer via `createUniversalTransaction` + `serializeInstruction`
- UniversalTransferSolana: USDC transfer on Solana via SPL token instructions
- ContractInteraction: NFT mint on Polygon via `createUniversalTransaction`
- Conversions: Cross-chain conversion to USDC via `createConvertTransaction`
- TxHistoryModal and TxDetailsModal for transaction history display

## Project Structure

```
ua-react-native/
├── app/
│   ├── _layout.tsx              # Root layout: Particle init + providers
│   ├── index.tsx                # Auth check → redirect
│   ├── login.tsx                # Login screen with ConnectKit
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab navigator
│       ├── index.tsx            # Home tab
│       ├── search.tsx           # Search tab
│       ├── agent.tsx            # Agent tab
│       └── activity.tsx         # Activity tab
├── components/
│   ├── DepositModal.tsx         # Deposit addresses & chains
│   ├── AssetBreakdownModal.tsx  # Asset/chain breakdown
│   ├── SendFunds.tsx            # USDC transfer (Arbitrum)
│   ├── SendSolana.tsx           # SOL transfer (Solana)
│   ├── UniversalTransfer.tsx    # USDC to EOA
│   ├── UniversalTransferSolana.tsx  # USDC on Solana
│   ├── ContractInteraction.tsx  # NFT mint (Polygon)
│   ├── Conversions.tsx          # Cross-chain conversion
│   ├── TxHistoryModal.tsx       # Transaction history list
│   └── TxDetailsModal.tsx       # Transaction details view
├── context/
│   └── UniversalAccountContext.tsx  # UA state management
├── lib/
│   ├── chains.ts                # Supported chains
│   ├── contracts.ts             # Contract interaction helpers
│   ├── deposit.ts               # Deposit helpers
│   ├── tokens.ts                # Token metadata
│   └── utils.ts                 # Formatting utilities
├── types/
│   └── transaction-history.ts   # TX history types
├── plugins/
│   └── withParticleNetwork.js   # Expo config plugin for Particle iOS setup
├── package.json
├── app.config.js
├── entrypoint.js                # Polyfills for RN
├── babel.config.js
└── tsconfig.json
```

## Setup

### Prerequisites

- Node.js 18+
- Xcode 15+ (for iOS builds)
- CocoaPods
- Particle Network dashboard credentials (same as webapp)

### 1. Install dependencies

```bash
cd ua-react-native
npm install
```

### 2. Configure environment

Create a `.env` file from the example (uses the **same credentials** as the webapp):

```bash
cp .env.example .env
```

Edit `.env` with your Particle Network project credentials:

```
NEXT_PUBLIC_PROJECT_ID=your_project_id
NEXT_PUBLIC_CLIENT_KEY=your_client_key
NEXT_PUBLIC_APP_ID=your_app_id
```

### 3. Generate native iOS project

```bash
npx expo prebuild --platform ios
```

### 4. Run on iOS

```bash
npx expo run:ios
```

> **Note**: This app requires a development build (not Expo Go) because it uses native Particle SDK modules.

## How the UA SDK Works in React Native

The `@particle-network/universal-account-sdk` is a pure JavaScript/TypeScript package. It communicates with Particle's backend APIs over HTTP and doesn't depend on any browser-specific APIs. With the polyfills in `entrypoint.js` (`crypto`, `Buffer`, `TextEncoder`, `URL`), it works identically in React Native.

The only platform-specific part is **message signing**. The webapp uses viem's `walletClient.signMessage()`, while the RN app uses Particle's native `signMessage()` from `@particle-network/rn-connect`. Both produce the same `personal_sign` EIP-191 signature that the UA SDK requires.
