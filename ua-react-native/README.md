# OMNI - Universal Wallet (React Native / iOS)

A React Native port of the OMNI Universal Wallet webapp (gh-pages branch), powered by **Particle Network Universal Accounts SDK** with native **Particle Connect** for social login authentication.

This is a 100% feature port of the Next.js webapp into a native iOS app using Expo and Particle's React Native SDKs.

## Features

### Core Wallet
- **Social Login**: Google, Apple, Twitter, GitHub, Discord, Email, Phone via Particle ConnectKit
- **Universal Balance**: Aggregated balance across all chains (EVM + Solana)
- **Receive/Deposit**: EVM and Solana UA addresses with supported chains
- **Send**: Cross-chain transfers (EVM + Solana) via UA SDK
- **Convert**: Cross-chain token conversion (USDC, USDT, ETH, SOL, BNB)
- **Real-time Updates**: WebSocket connection for live balance and transaction updates
- **External Tokens**: Mobula API integration for non-primary token balances

### Trading
- **Swap**: Token swaps via LiFi aggregator through UA
- **Perpetuals**: Long/Short trading with up to 150x leverage via Avantis on Base
  - Crypto pairs (BTC, ETH, SOL, DOGE, etc.)
  - Forex pairs (EUR/USD, GBP/USD, etc.)
  - Commodities (Gold, Silver, Oil)
  - Live prices via WebSocket
- **Polymarket**: Prediction market browsing and betting
- **Sell**: Token selling (reverse swap)

### DeFi
- **Earn**: Morpho vault deposits with APY display
  - Vault browser with TVL and APY sorting
  - Deposit and withdraw flows
  - User positions tracking

### Other
- **Token Search**: Mobula-powered token search with price, market cap, volume
- **Token Details**: Price, 24h change, market data, contracts, links
- **DApp Browser**: Quick access to UniversalX, Uniswap, Aave, OpenSea, Jupiter, Raydium
- **Activity**: Transaction history with details and explorer links
- **AI Agent**: Chat interface placeholder
- **Profile**: Customizable emoji, background color, display name
- **Settings**: Blind signing toggle, account security, app lock (PIN)
- **Points**: Rewards system placeholder
- **Splash Screen**: Animated OMNI branding

## Architecture

### Auth: Particle Connect (same as webapp)

Uses `@particle-network/rn-connect` with `connectWithConnectKitConfig()` providing the same social login UI natively:

| Webapp | React Native |
|--------|-------------|
| `@particle-network/connectkit` | `@particle-network/rn-connect` |
| `ConnectButton` | `connectWithConnectKitConfig()` |
| `useAccount().address` | `particleConnect.getAccounts()` |
| `walletClient.signMessage()` | `particleConnect.signMessage()` |

### Universal Accounts: Same SDK

The `@particle-network/universal-account-sdk` is a pure JS/TS package that works identically in React Native with polyfills.

### Signing

```
Web:  walletClient.signMessage({ message: { raw: rootHash } })
RN:   particleConnect.signMessage(WalletType.AuthCore, address, '0x' + hex(rootHash))
```

Both produce the same EIP-191 `personal_sign` signature.

## Project Structure

```
ua-react-native/
├── app/
│   ├── _layout.tsx              # Particle SDK init + providers
│   ├── index.tsx                # Auth check → redirect
│   ├── login.tsx                # OMNI login with ConnectKit
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (Home/Search/Browser/Points)
│       ├── index.tsx            # Home: balance, actions, tokens
│       ├── search.tsx           # Token search via Mobula
│       ├── browser.tsx          # DApp browser
│       ├── agent.tsx            # Agent tab
│       └── points.tsx           # Points/rewards
├── components/
│   ├── ReceiveModal.tsx         # Deposit addresses
│   ├── SendModal.tsx            # Cross-chain send
│   ├── ConvertModal.tsx         # Token conversion
│   ├── SwapModal.tsx            # LiFi swap
│   ├── PerpsModal.tsx           # Avantis perpetuals
│   ├── PolymarketModal.tsx      # Prediction markets
│   ├── EarnModal.tsx            # Morpho vaults
│   ├── TokenDetailModal.tsx     # Token info + chart
│   ├── ActivityModal.tsx        # Transaction history
│   ├── ProfilePickerModal.tsx   # Profile customization
│   ├── SettingsModal.tsx        # App settings
│   ├── AppLockModal.tsx         # PIN security
│   ├── AgentModal.tsx           # AI assistant
│   ├── BuyModal.tsx             # Buy crypto
│   ├── SellModal.tsx            # Sell crypto
│   ├── SplashScreen.tsx         # Animated splash
│   └── ...legacy components
├── context/
│   └── UniversalAccountContext.tsx  # Full app state
├── hooks/
│   └── useUniversalAccountWS.ts    # Real-time WebSocket
├── lib/
│   ├── chains.ts, tokens.ts       # Chain/token config
│   ├── contracts.ts, deposit.ts   # Contract helpers
│   ├── utils.ts                   # Formatting utilities
│   ├── swapService.ts             # LiFi swap integration
│   ├── earnService.ts             # Morpho vault integration
│   ├── earnConfig.ts              # Earn configuration
│   └── perpsConfig.ts             # Avantis ABIs + markets
├── types/
│   └── transaction-history.ts
├── plugins/
│   └── withParticleNetwork.js     # Expo config plugin
├── package.json
├── app.config.js
├── entrypoint.js                  # RN polyfills
└── tsconfig.json
```

## Setup

### Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS)
- CocoaPods

### Install & Run
```bash
cd ua-react-native
npm install
cp .env.example .env   # Same Particle credentials as webapp
npx expo prebuild --platform ios
npx expo run:ios
```

> Requires a development build (not Expo Go) due to native Particle SDK modules.
