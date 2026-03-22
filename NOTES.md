# OMNI Wallet Development Notes

## Project Structure
- **Web app:** `/projects/universal-wallet-web/ua-conneckit/` (Next.js)
- **iOS hybrid:** `/projects/universal-wallet-hybrid/ios/` (SwiftUI + WKWebView)
- **Deployed:** https://orimolty-lang.github.io/universal-wallet-web/

---

## 2026-03-04 - Late Night Session

### 1. Lock Screen ↔ Splash Screen Parity

**Files:**
- `universal-wallet-hybrid/ios/UniversalWallet/LockScreenView.swift`
- `universal-wallet-hybrid/ios/UniversalWallet/Assets.xcassets/omni-logo.imageset/`

**Changes:**
- Background: dark #0a0a0a (was blue gradient)
- Logo: omni-logo.png image (was 🍊 emoji)
- Glow: purple/cyan animated rings
- Animations: breathing logo, pulsing orb, text fade-in
- Button: purple gradient (matches theme)

---

### 2. App Lock Security

**Files:**
- `universal-wallet-hybrid/ios/UniversalWallet/BiometricManager.swift`
- `universal-wallet-hybrid/ios/UniversalWallet/ContentView.swift`

**Change:** `disable()` now requires Face ID auth before turning off biometrics.

---

### 3. External Token Contracts (Sell Fix)

**Problem:** "Token address not found" when selling from Home page.

**Files:**
- `ua-conneckit/app/page.tsx` - combinedAssets memo, HomeTab click handler
- `ua-conneckit/app/components/SwapModal.tsx` - getTokenAddressAndChain

**Contract extraction chain:**
1. `asset.contracts` + `asset.blockchains` (Mobula format)
2. `cross_chain_balances` → address/chainId
3. `token.chainBreakdown` (HomeTab fallback)
4. `primaryAssets.chainAggregation` (SwapModal fallback)

**Status:** Works from Search page. Home page still needs verification.

---

### 4. Swap Completion Polling

**File:** `ua-conneckit/app/lib/swapService.ts`

**pollTransactionDetails improvements:**
- 20 attempts @ 2s (was 10 @ 3s)
- Checks: completed/success/confirmed/done
- Hash fields: targetTxHash, destinationTxHash, txHash, hash, transactions[].hash
- Returns explorerUrl for Basescan/Etherscan

**SwapModal UI:**
- Pending: pulsing hourglass
- Complete: bouncing checkmark
- Links: "View on Base" button (primary), "View on UniversalX" (secondary)

---

### 5. USDC Duplicate Issue

**Problem:** USDC shows twice (UA primary + Mobula external).

**Current approach:** Case-insensitive symbol check in `combinedAssets` filter.

**TODO:** Investigate why Mobula returns USDC separately when UA already has it.

---

## Known Issues / TODO

- [ ] **CRITICAL: Swap stuck on "Pending"** — Polling doesn't detect completion
  - Transaction executes successfully (visible on UniversalX)
  - `pollTransactionDetails` not finding completed status or tx hash
  - Need to log actual `ua.getTransaction(id)` response to see field names
  - No Basescan link appearing (explorerUrl not being set)
  
- [ ] USDC dupe needs cleaner fix
- [ ] Verify Home → Sell flow with new contract extraction  
- [ ] Test lock screen on physical device

## Next Up
- [ ] Hyperliquid integration (perps)
- [ ] Avantis integration (perps on Base)

---

## Deployment

**Web (GitHub Pages):**
```bash
cd /workspace
npm run setup:cloud
npm run build:gh-pages
git add -A && git commit -m "message" && git push
```

**iOS (to device):**
```bash
cd /Users/garysingh/clawd/projects/universal-wallet-hybrid/ios
xcodebuild -scheme UniversalWallet -configuration Debug -destination 'generic/platform=iOS' build
ios-deploy --bundle /Users/garysingh/Library/Developer/Xcode/DerivedData/UniversalWallet-fhzkokgxnafezchawcqzulbitrls/Build/Products/Debug-iphoneos/UniversalWallet.app --no-wifi
```

---

## Architecture Notes

### Token Data Flow
```
UA SDK (primaryAssets) ──┐
                         ├──► combinedAssets ──► HomeTab ──► TokenDetailModal ──► SwapModal
Mobula API (external)  ──┘
```

### Mobula Asset Structure
```typescript
{
  asset: { symbol, name, logo, contracts[], blockchains[] },
  token_balance: number,
  price: number,
  estimated_balance: number,
  cross_chain_balances: { [key]: { address, balance, chainId } }
}
```

### UA Asset Structure
```typescript
{
  symbol, name, amount, amountInUSD, price, logo,
  chainAggregation: [{ token: { chainId, address }, amount, amountInUSD }]
}
```
