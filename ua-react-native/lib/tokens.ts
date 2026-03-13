export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  currentPriceUsd?: number;
  description?: string;
}

export const dummyTokens: Token[] = [
  {
    id: "usdt",
    name: "Tether",
    symbol: "USDT",
    icon: "https://assets.kraken.com/marketing/web/icons-uni-webp/s_usdt.webp",
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    icon: "https://cdn-icons-png.flaticon.com/512/14446/14446285.png",
  },
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    icon: "https://icons.iconarchive.com/icons/cjdowner/cryptocurrency-flat/512/Ethereum-ETH-icon.png",
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    icon: "https://static.particle.network/token-list/bsc/native.png",
  },
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    icon: "https://images.seeklogo.com/logo-png/42/2/solana-sol-logo-png_seeklogo-423095.png",
  },
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "https://cdn-icons-png.freepik.com/256/5968/5968260.png",
  },
];
