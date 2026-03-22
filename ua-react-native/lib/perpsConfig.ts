export type PerpsMarketGroup =
  | "crypto"
  | "forex"
  | "commodities"
  | "equity"
  | "other";

export interface PerpsMarket {
  index: number;
  symbol: string;
  name: string;
  maxLeverage: number;
  logo: string;
  color: string;
  group: PerpsMarketGroup;
  pairName: string;
}

export interface PairLeverageLimits {
  pairIndex?: number;
  standardMin: number;
  standardMax: number;
  zfpMin: number;
  zfpMax: number;
  pairOI: number;
  pairMaxOI: number;
  feedId?: string;
  socketSymbol?: string;
  group?: PerpsMarketGroup;
  fromSymbol?: string;
  toSymbol?: string;
  displayName?: string;
}

export interface OpenPerpsPosition {
  id: string;
  pairName: string;
  symbol: string;
  pairIndex: number;
  positionIndex: number;
  isLong: boolean;
  collateralUsd: number;
  sizeUsd: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  pnlPercent: number;
  liquidationPrice: number;
  beingMarketClosed: boolean;
  tpPrice: number;
  slPrice: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// ABIs
// ---------------------------------------------------------------------------

export const AVANTIS_TRADING_ABI = [
  {
    name: "openTrade",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "t",
        type: "tuple",
        components: [
          { name: "trader", type: "address" },
          { name: "pairIndex", type: "uint256" },
          { name: "index", type: "uint256" },
          { name: "initialPosToken", type: "uint256" },
          { name: "positionSizeUSDC", type: "uint256" },
          { name: "openPrice", type: "uint256" },
          { name: "buy", type: "bool" },
          { name: "leverage", type: "uint256" },
          { name: "tp", type: "uint256" },
          { name: "sl", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
      { name: "orderType", type: "uint8" },
      { name: "slippageP", type: "uint256" },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
  },
  {
    name: "closeTradeMarket",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_pairIndex", type: "uint256" },
      { name: "_index", type: "uint256" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [{ name: "orderId", type: "uint256" }],
  },
  {
    name: "updateTpAndSl",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_pairIndex", type: "uint256" },
      { name: "_index", type: "uint256" },
      { name: "_newSl", type: "uint256" },
      { name: "_newTP", type: "uint256" },
      { name: "priceUpdateData", type: "bytes[]" },
    ],
    outputs: [],
  },
  {
    name: "delegatedAction",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "trader", type: "address" },
      { name: "call_data", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;

export const AVANTIS_TRADING_STORAGE_ABI = [
  {
    name: "openTradesCount",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_trader", type: "address" },
      { name: "_pairIndex", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "openTrades",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_trader", type: "address" },
      { name: "_pairIndex", type: "uint256" },
      { name: "_index", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "trader", type: "address" },
          { name: "pairIndex", type: "uint256" },
          { name: "index", type: "uint256" },
          { name: "initialPosToken", type: "uint256" },
          { name: "positionSizeUSDC", type: "uint256" },
          { name: "openPrice", type: "uint256" },
          { name: "buy", type: "bool" },
          { name: "leverage", type: "uint256" },
          { name: "tp", type: "uint256" },
          { name: "sl", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "openTradesInfo",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_trader", type: "address" },
      { name: "_pairIndex", type: "uint256" },
      { name: "_index", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "openInterestUSDC", type: "uint256" },
          { name: "tpLastUpdated", type: "uint256" },
          { name: "slLastUpdated", type: "uint256" },
          { name: "beingMarketClosed", type: "bool" },
          { name: "lossProtection", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export const ERC20_APPROVE_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const ERC20_ALLOWANCE_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "amount", type: "uint256" }],
  },
] as const;

export const MULTICALL3_ABI = [
  {
    name: "aggregate3Value",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "allowFailure", type: "bool" },
          { name: "value", type: "uint256" },
          { name: "callData", type: "bytes" },
        ],
      },
    ],
    outputs: [
      {
        name: "returnData",
        type: "tuple[]",
        components: [
          { name: "success", type: "bool" },
          { name: "returnData", type: "bytes" },
        ],
      },
    ],
  },
] as const;

export const PYTH_ABI = [
  {
    name: "getUpdateFee",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "updateDataSize", type: "uint256" }],
    outputs: [{ name: "feeAmount", type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Contract Addresses (Base mainnet)
// ---------------------------------------------------------------------------

export const AVANTIS_TRADING_ADDRESS =
  "0x44914408af82bC9983bbb330e3578E1105e11d4e";
export const AVANTIS_TRADING_STORAGE_ADDRESS =
  "0x8a311D7048c35985aa31C131B9A13e03a5f7422d";
export const BASE_USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const MULTICALL3_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11";
export const PYTH_CONTRACT_ADDRESS =
  "0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a";

export const AVANTIS_APPROVAL_CAP_USDC = BigInt(10_000 * 1_000_000);

// ---------------------------------------------------------------------------
// Decimal conventions (from Avantis SDK docs)
// - USDC amounts: 6 decimals  (100n * 10n**6n = 100 USDC)
// - Prices: 10 decimals       (50000n * 10n**10n = $50,000)
// - Leverage: 10 decimals     (10n * 10n**10n = 10x)
// - Slippage: 10 decimals     (10n**8n = 1%)
// - Execution fees: 18 decimals wei
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

const BASE_PERPS_MARKETS: Omit<PerpsMarket, "pairName">[] = [
  // Crypto
  {
    index: 0,
    symbol: "BTC",
    name: "Bitcoin",
    maxLeverage: 100,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
    color: "#F7931A",
    group: "crypto",
  },
  {
    index: 1,
    symbol: "ETH",
    name: "Ethereum",
    maxLeverage: 100,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
    color: "#627EEA",
    group: "crypto",
  },
  {
    index: 2,
    symbol: "SOL",
    name: "Solana",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
    color: "#9945FF",
    group: "crypto",
  },
  {
    index: 3,
    symbol: "LINK",
    name: "Chainlink",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
    color: "#375BD2",
    group: "crypto",
  },
  {
    index: 4,
    symbol: "DOGE",
    name: "Dogecoin",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png",
    color: "#C2A633",
    group: "crypto",
  },
  {
    index: 5,
    symbol: "XRP",
    name: "Ripple",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xrp/info/logo.png",
    color: "#23292F",
    group: "crypto",
  },
  {
    index: 6,
    symbol: "BNB",
    name: "BNB",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
    color: "#F3BA2F",
    group: "crypto",
  },
  {
    index: 7,
    symbol: "ADA",
    name: "Cardano",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png",
    color: "#0033AD",
    group: "crypto",
  },
  {
    index: 8,
    symbol: "AVAX",
    name: "Avalanche",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
    color: "#E84142",
    group: "crypto",
  },
  {
    index: 9,
    symbol: "MATIC",
    name: "Polygon",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
    color: "#8247E5",
    group: "crypto",
  },
  {
    index: 10,
    symbol: "ARB",
    name: "Arbitrum",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    color: "#28A0F0",
    group: "crypto",
  },
  {
    index: 11,
    symbol: "OP",
    name: "Optimism",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    color: "#FF0420",
    group: "crypto",
  },
  {
    index: 12,
    symbol: "NEAR",
    name: "NEAR",
    maxLeverage: 50,
    logo: "https://cryptologos.cc/logos/near-protocol-near-logo.png",
    color: "#00C08B",
    group: "crypto",
  },
  {
    index: 13,
    symbol: "AAVE",
    name: "Aave",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
    color: "#B6509E",
    group: "crypto",
  },
  {
    index: 14,
    symbol: "UNI",
    name: "Uniswap",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
    color: "#FF007A",
    group: "crypto",
  },
  {
    index: 15,
    symbol: "PEPE",
    name: "Pepe",
    maxLeverage: 25,
    logo: "https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg",
    color: "#479F53",
    group: "crypto",
  },
  {
    index: 16,
    symbol: "WIF",
    name: "dogwifhat",
    maxLeverage: 25,
    logo: "https://assets.coingecko.com/coins/images/33566/small/wif.png",
    color: "#D4A96D",
    group: "crypto",
  },
  {
    index: 17,
    symbol: "SUI",
    name: "Sui",
    maxLeverage: 50,
    logo: "https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg",
    color: "#6FBCF0",
    group: "crypto",
  },
  {
    index: 18,
    symbol: "TRX",
    name: "Tron",
    maxLeverage: 50,
    logo: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png",
    color: "#FF0013",
    group: "crypto",
  },
  // Forex
  {
    index: 30,
    symbol: "EUR",
    name: "Euro",
    maxLeverage: 500,
    logo: "https://flagcdn.com/w80/eu.png",
    color: "#003399",
    group: "forex",
  },
  {
    index: 31,
    symbol: "GBP",
    name: "British Pound",
    maxLeverage: 500,
    logo: "https://flagcdn.com/w80/gb.png",
    color: "#012169",
    group: "forex",
  },
  {
    index: 32,
    symbol: "JPY",
    name: "Japanese Yen",
    maxLeverage: 500,
    logo: "https://flagcdn.com/w80/jp.png",
    color: "#BC002D",
    group: "forex",
  },
  // Commodities
  {
    index: 20,
    symbol: "XAU",
    name: "Gold",
    maxLeverage: 50,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5176.png",
    color: "#FFD700",
    group: "commodities",
  },
  {
    index: 21,
    symbol: "XAG",
    name: "Silver",
    maxLeverage: 50,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5180.png",
    color: "#C0C0C0",
    group: "commodities",
  },
];

export const PERPS_MARKETS: PerpsMarket[] = BASE_PERPS_MARKETS.map((m) => ({
  ...m,
  pairName: `${m.symbol}/USD`,
}));

export const AVANTIS_PAIRS = PERPS_MARKETS.map((m) => ({
  index: m.index,
  name: m.pairName,
  maxLeverage: m.maxLeverage,
}));

export const PERPS_MARKET_SYMBOL_META: Record<string, PerpsMarket> =
  PERPS_MARKETS.reduce(
    (acc, market) => {
      acc[market.symbol] = market;
      return acc;
    },
    {} as Record<string, PerpsMarket>
  );

export const DEFAULT_PERPS_MARKET_LOGO = "";

// ---------------------------------------------------------------------------
// Avantis Socket API (live leverage limits + price feeds)
// ---------------------------------------------------------------------------

export const AVANTIS_SOCKET_API_URL =
  "https://socket-api-pub.avantisfi.com/socket-api/v1/data";

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export const parsePairNameFromSocketSymbol = (symbol: string): string => {
  const dotIndex = symbol.indexOf(".");
  const normalized =
    dotIndex >= 0
      ? symbol.slice(dotIndex + 1).toUpperCase()
      : symbol.toUpperCase();
  if (normalized === "USD/JPY") return "JPY/USD";
  return normalized;
};

export const buildPairName = (
  from?: string,
  to?: string,
  socketSymbol?: string
): string => {
  const fromNorm = (from || "").toUpperCase().trim();
  const toNorm = (to || "").toUpperCase().trim();
  if (fromNorm && toNorm) {
    if (fromNorm === "USD" && toNorm === "JPY") return "JPY/USD";
    return `${fromNorm}/${toNorm}`;
  }
  return parsePairNameFromSocketSymbol(socketSymbol || "");
};

export const inferPerpsGroupFromSocketSymbol = (
  socketSymbol?: string
): PerpsMarketGroup => {
  const prefix = socketSymbol?.split(".", 1)?.[0]?.toUpperCase() || "";
  if (prefix === "CRYPTO") return "crypto";
  if (prefix === "FX") return "forex";
  if (prefix === "METAL" || prefix === "COMMODITIES") return "commodities";
  if (prefix === "EQUITY") return "equity";
  return "other";
};

// ---------------------------------------------------------------------------
// Market name aliases & logo overrides
// ---------------------------------------------------------------------------

export const MARKET_NAME_ALIASES: Record<string, string> = {
  AVNT: "Avantis",
};

export const MARKET_LOGO_OVERRIDES: Record<string, string> = {
  AVNT: "https://coin-images.coingecko.com/coins/images/68972/large/avnt-token.png",
  SPY: "https://coin-images.coingecko.com/coins/images/68655/large/spyon_160x160.png",
  QQQ: "https://coin-images.coingecko.com/coins/images/68654/large/qqqon_160x160.png",
  COIN: "https://coin-images.coingecko.com/coins/images/68612/large/coinon_160x160.png",
  NVDA: "https://coin-images.coingecko.com/coins/images/68623/large/nvdaon_160x160.png",
  AAPL: "https://coin-images.coingecko.com/coins/images/68616/large/aaplon_160x160.png",
  AMZN: "https://coin-images.coingecko.com/coins/images/68604/large/amznon_160x160.png",
  MSFT: "https://coin-images.coingecko.com/coins/images/68625/large/msfton_160x160.png",
  META: "https://coin-images.coingecko.com/coins/images/68645/large/metaon_160x160.png",
  TSLA: "https://coin-images.coingecko.com/coins/images/68628/large/tslaon_160x160.png",
  GOOG: "https://coin-images.coingecko.com/coins/images/68606/large/googlon_160x160.png",
  HOOD: "https://coin-images.coingecko.com/coins/images/68581/large/hoodon_160x160.png",
  HYPE: "https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg",
  PUMP: "https://coin-images.coingecko.com/coins/images/67164/large/pump.jpg",
  AERO: "https://coin-images.coingecko.com/coins/images/31745/large/token.png",
  SHIB: "https://coin-images.coingecko.com/coins/images/11939/large/shiba.png",
  LIT: "https://coin-images.coingecko.com/coins/images/13825/large/logo_200x200.png",
  ZRO: "https://coin-images.coingecko.com/coins/images/28206/large/ftxG9_TJ_400x400.jpeg",
  ASTER:
    "https://coin-images.coingecko.com/coins/images/69040/large/_ASTER.png",
  XMR: "https://coin-images.coingecko.com/coins/images/69/large/monero_logo.png",
  VIRTUAL:
    "https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png",
  ZEC: "https://coin-images.coingecko.com/coins/images/486/large/circle-zcash-color.png",
  ONDO: "https://coin-images.coingecko.com/coins/images/26580/large/ONDO.png",
  BONK: "https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg",
  POL: "https://coin-images.coingecko.com/coins/images/32440/large/pol.png",
  MON: "https://coin-images.coingecko.com/coins/images/38927/large/mon.png",
  RENDER:
    "https://coin-images.coingecko.com/coins/images/11636/large/rndr.png",
  JUP: "https://coin-images.coingecko.com/coins/images/34188/large/jup.png",
  PENDLE:
    "https://coin-images.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png",
  XAU: "https://img.icons8.com/color/96/gold-bars.png",
  XAG: "https://img.icons8.com/color/96/silver-bars.png",
  USOILSPOT: "https://img.icons8.com/color/96/oil-industry.png",
};

export const FOREX_FLAG_BY_SYMBOL: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  CHF: "ch",
  CAD: "ca",
  AUD: "au",
  NZD: "nz",
  CNY: "cn",
  HKD: "hk",
};

export const resolveMarketLogo = ({
  symbol,
  group,
  staticLogo,
  fromSymbol,
  dynamicLogo,
}: {
  symbol: string;
  group: PerpsMarketGroup;
  staticLogo?: string;
  fromSymbol?: string;
  dynamicLogo?: string;
}): string => {
  if (staticLogo) return staticLogo;
  const baseSymbol = (fromSymbol || symbol || "").toUpperCase();
  if (dynamicLogo) return dynamicLogo;
  const logoOverride = MARKET_LOGO_OVERRIDES[baseSymbol];
  if (logoOverride) return logoOverride;
  if (group === "forex") {
    const cc = FOREX_FLAG_BY_SYMBOL[baseSymbol];
    if (cc) return `https://flagcdn.com/w80/${cc}.png`;
  }
  if (group === "crypto") {
    return `https://cryptoicons.org/api/icon/${baseSymbol.toLowerCase()}/200`;
  }
  return "";
};

export const formatCompactUsd = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
};

export const BASE_RPC_URL = "https://mainnet.base.org";
