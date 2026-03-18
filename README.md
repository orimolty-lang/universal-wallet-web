# Universal Accounts with Particle ConnectKit Demo

This demo showcases how to integrate Particle Network's Universal Accounts with ConnectKit to enable cross-chain transactions and smart contract interactions without requiring users to switch networks or bridge tokens.

> Find more details in the [official documentation](https://developers.particle.network/universal-accounts/cha/overview).

## Overview

The application demonstrates the power of Universal Accounts by allowing users to:

- **Connect** with Particle ConnectKit via social logins or traditional wallets.
- **View Account Details**, including the owner EOA, EVM Universal Account, and Solana Universal Account addresses.
- **Check Universal Balance**, an aggregated total of all primary assets across all supported chains.
- **View Transaction History** with detailed breakdowns of each transaction.
- **Deposit Assets** to the Universal Account from any chain.
- **Perform Cross-Chain Interactions**, such as minting an NFT on a different chain from where the funds are held.

## Quickstart

### Prerequisites

- Particle Network project credentials (Project ID, Client Key, App ID).

Find your credentials in the [Particle Network Dashboard](https://dashboard.particle.network/).

### Installation

1. Clone this repository.
2. Install dependencies with `yarn install`.
3. Create a `.env` file based on `.env.example` and add your Particle Network credentials.
4. Run the development server with `yarn dev`.
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Cloud agent setup and `gh-pages` deploy

From the repo root:

```bash
npm run setup:cloud
npm run deploy:gh-pages
```

This installs `ua-conneckit` dependencies, builds the static export, switches to `gh-pages`, commits, and pushes. Optional commit message:

```bash
npm run deploy:gh-pages -- "fix: your message"
```

## Code Structure: `ua-conneckit/app/page.tsx`

The `page.tsx` file is the heart of this demo, managing the entire lifecycle of the Universal Account. Here’s how it works:

### 1. Initialization

A `useEffect` hook listens for changes in the user's connection status (`isConnected` and `address`).

- **On Connect**: It creates a new `UniversalAccount` instance, passing the required project credentials and the owner's EOA address.
- **On Disconnect**: It resets the `universalAccountInstance` to `null`.

```javascript
// === Initialize UniversalAccount ===
useEffect(() => {
  if (isConnected && address) {
    const ua = new UniversalAccount({
      // ...config
    });
    setUniversalAccountInstance(ua);
  } else {
    setUniversalAccountInstance(null);
  }
}, [isConnected, address]);
```

### 2. Data Fetching

Once the `universalAccountInstance` is available, a series of `useEffect` hooks trigger to fetch essential data:

- **`getSmartAccountOptions()`**: Retrieves the EVM and Solana Universal Account addresses.
- **`getPrimaryAssets()`**: Fetches the aggregated balance of all primary assets across all chains.
- **`getTransactions()`**: Fetches the user's transaction history with pagination.

Each of these API calls is wrapped in its own `useEffect` for clarity and separation of concerns.

```javascript
// === Fetch Universal Account Addresses ===
useEffect(() => {
  if (!universalAccountInstance) return;
  // ...fetches addresses
}, [universalAccountInstance]);

// === Fetch Primary Assets ===
useEffect(() => {
  if (!universalAccountInstance) return;
  // ...fetches primary assets
}, [universalAccountInstance]);

// === Fetch Transaction History ===
useEffect(() => {
  if (!universalAccountInstance) return;
  // ...fetches transaction history
}, [universalAccountInstance]);
```

### 3. Transaction Handling

The demo includes several components that showcase different types of transactions:

- `ContractInteraction.tsx`: Mints an NFT on a different chain.
- `SendFunds.tsx`: Sends funds to an EOA address.
- `UsdcTransfer.tsx`: A universal transfer of USDC.
- `Convertions.tsx`: Converts assets to USDC.

The `universalAccountInstance` and the connected `walletClient` are passed as props to these components, which then use them to create and send transactions.

### 4. Transaction History and Details

- **`TxHistoryDialog.tsx`**: Displays a list of transactions. When a transaction is clicked, it calls the `handleTransactionClick` function.
- **`handleTransactionClick`**: This function, located in `page.tsx`, fetches the full details of the selected transaction using `universalAccountInstance.getTransaction(transactionId)`.
- **`TxDetailsDialog.tsx`**: A dialog that displays the comprehensive details of the fetched transaction, including token changes, fees, and user operations.

This structure ensures that the main `page.tsx` component acts as a central controller, managing the Universal Account instance and fetching data, while the child components are responsible for specific UI and transaction logic.
