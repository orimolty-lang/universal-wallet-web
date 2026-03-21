/* eslint-disable @next/next/no-img-element */
"use client";
import {
  ConnectButton,
  useAccount,
  useWallets,
  useDisconnect,
  useSign7702AuthorizationCompat,
  useExportWalletCompat,
} from "@/app/lib/connectkit-compat";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  SUPPORTED_TOKEN_TYPE,
  CHAIN_ID,
  type IAssetsResponse,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import DepositDialog from "./components/DepositDialog";
import AssetBreakdownDialog from "./components/AssetBreakdownDialog";
import TokenDetailModal from "./components/TokenDetailModal";
import SwapModal from "./components/SwapModal";
import PolymarketModal from "./components/PolymarketModal";
import EarnModal from "./components/EarnModal";
import BottomSheet from "../components/BottomSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { HermesClient } from "@pythnetwork/hermes-client";
import { decodeFunctionResult, encodeFunctionData, formatEther, parseEther } from "viem";
import { toBeHex, formatUnits } from "ethers";
import { useUniversalAccountWS } from "./hooks/useUniversalAccountWS";
import { getEIP7702Deployments, build7702Authorizations } from "../lib/eip7702";
import { fetchParticleExternalAssets } from "../lib/particle-balances";

// Mobula: proxied via Cloudflare worker (no frontend API key)
const MOBULA_PROXY_BASE = process.env.NEXT_PUBLIC_LIFI_PROXY_URL || "https://lifi-proxy.orimolty.workers.dev";

// Mobula wallet balance response type
interface MobulaAsset {
  asset: {
    name: string;
    symbol: string;
    logo?: string;
    contracts?: string[];
    blockchains?: string[];
  };
  token_balance: number;
  price: number;
  price_change_24h?: number;
  estimated_balance: number;
  cross_chain_balances?: Record<string, { 
    address: string; 
    balance: number; 
    balanceRaw: string;
    chainId: number;
  }>;
}

// Fetch wallet balances from Mobula API
async function fetchMobulaWalletBalances(address: string): Promise<MobulaAsset[]> {
  console.log("[Mobula] Fetching wallet balances for:", address);
  
  if (!address) {
    console.error("[Mobula] No wallet address provided");
    return [];
  }
  
  try {
    // Use our proxy for Mobula API (handles CORS)
    const url = `${MOBULA_PROXY_BASE}/mobula/api/1/wallet/portfolio?wallet=${address}&blockchains=base,ethereum,arbitrum,polygon,solana,optimism,bnb`;
    console.log("[Mobula] URL (via proxy):", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Mobula] Wallet fetch failed:", response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    console.log("[Mobula] Wallet response:", JSON.stringify(data).slice(0, 500));
    
    // Standard portfolio returns { data: { assets: [...] } }
    const assets = data.data?.assets || [];
    
    console.log("[Mobula] Found assets:", assets.length);
    return assets;
  } catch (error) {
    console.error("[Mobula] Error fetching wallet:", error);
    return [];
  }
}

// Splash Screen - shows briefly on app start
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000); // Show for 2 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[100]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(34,211,238,0.2) 50%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            filter: 'blur(80px)',
            animation: 'splashPulse 2s ease-in-out infinite',
          }}
        />
      </div>
      
      {/* Logo */}
      <div className="relative flex flex-col items-center">
        <div className="relative mb-6">
          <img 
            src="/universal-wallet-web/omni-logo.png" 
            alt="Omni" 
            className="w-32 h-32 rounded-2xl"
            style={{
              animation: 'splashBreathe 12s linear infinite',
            }}
          />
          {/* Glow rings */}
          <div 
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/50 via-cyan-400/50 to-purple-500/50 blur-2xl -z-10"
            style={{ animation: 'splashGlow 2s ease-in-out infinite' }}
          />
          <div 
            className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-cyan-400/30 blur-3xl -z-20"
            style={{ animation: 'splashGlow 2s ease-in-out infinite reverse' }}
          />
        </div>
        
        {/* Text fades in */}
        <div 
          className="text-white text-4xl font-bold tracking-widest"
          style={{ animation: 'splashFadeIn 0.8s ease-out 0.3s forwards', opacity: 0 }}
        >
          OMNI
        </div>
      </div>
      
      <style jsx>{`
        /* SAVED: Original breathing animation
        @keyframes splashBreatheOriginal {
          0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1) saturate(1); }
          50% { transform: scale(1.15) rotate(5deg); filter: brightness(1.4) saturate(1.3); }
        }
        */
        /* Slow circular rotation - clean and smooth */
        @keyframes splashBreathe {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes splashGlow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }
        @keyframes splashPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.5;
          }
        }
        @keyframes splashFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Trade menu logos (same as main page modals)
const TRADE_MENU_LOGOS = {
  perps: "https://1312337203-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F76vAZHPcNKY10NzuKsC4%2Fuploads%2FfM44ZIUWnrYhajk68ioy%2FAvantis%20White%20Logo%20-%20Iconmark.png?alt=media",
  polymarket: "https://polymarket.com/favicon.ico",
};

// Types
type TabType = "home" | "search" | "trade" | "points";

interface AccountInfo {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

interface TokenResult {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  price_change_24h?: number;
  market_cap?: number;
  contracts?: Array<{ address: string; blockchain: string }>;
  // Extended Mobula data
  liquidity?: number;
  volume?: number;
  twitter?: string;
  website?: string;
  totalSupply?: number;
  circulatingSupply?: number;
}

interface ProfileSettings {
  emoji: string;
  customImage: string | null;
  displayName: string;
  backgroundColor: string;
  blindSigningEnabled: boolean;
}

interface PairLeverageLimits {
  pairIndex?: number;
  standardMin: number;
  standardMax: number;
  zfpMin: number;
  zfpMax: number;
  pairOI?: number;
  pairMaxOI?: number;
  feedId?: string;
  /** When true, use `pro.priceUpdateData` + PriceSourcing.PRO on-chain (matches Avantis SDK). */
  lazerProEnabled?: boolean;
  socketSymbol?: string;
  group?: PerpsMarketGroup;
  fromSymbol?: string;
  toSymbol?: string;
  displayName?: string;
}

type PerpsMarketGroup = 'crypto' | 'forex' | 'commodities' | 'equity' | 'other';

interface PerpsMarket {
  index: number;
  symbol: string;
  name: string;
  maxLeverage: number;
  logo: string;
  color: string;
  group: PerpsMarketGroup;
  pairName: string;
}

interface OpenPerpsPosition {
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

// Common emojis for profile selection
const PROFILE_EMOJIS = [
  "🍊", "😀", "😎", "🤠", "👻", "👽", "🤖", "👾", "🦊", "🐶", "🐱", "🦁",
  "🐯", "🐻", "🐼", "🐨", "🐸", "🐵", "🦄", "🐲", "🔥", "⚡", "🌟", "💎",
  "🚀", "🎮", "🎨", "🎵", "💰", "🏆", "👑", "🌈", "🌙", "☀️", "🪐", "🌊",
];

// Background colors for emoji
const BACKGROUND_COLORS = [
  "#f97316", "#ef4444", "#ec4899", "#a855f7", "#8b5cf6", "#6366f1", 
  "#3b82f6", "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16", "#eab308",
  "#78716c", "#6b7280", "#64748b", "#1e293b", "#0f172a", "#000000",
];

// Apply dynamic accent color theme based on selected color
function applyAccentTheme(hexColor: string) {
  if (typeof document === 'undefined') return;
  
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Generate lighter variant (mix with white)
  const lighterR = Math.min(255, r + 40);
  const lighterG = Math.min(255, g + 40);
  const lighterB = Math.min(255, b + 40);
  
  // Generate darker variant
  const darkerR = Math.max(0, r - 30);
  const darkerG = Math.max(0, g - 30);
  const darkerB = Math.max(0, b - 30);
  
  const root = document.documentElement;
  root.style.setProperty('--accent-color', hexColor);
  root.style.setProperty('--accent-color-light', `rgb(${lighterR}, ${lighterG}, ${lighterB})`);
  root.style.setProperty('--accent-color-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`);
  root.style.setProperty('--accent-color-10', `rgba(${r}, ${g}, ${b}, 0.1)`);
  root.style.setProperty('--accent-color-20', `rgba(${r}, ${g}, ${b}, 0.2)`);
  root.style.setProperty('--accent-color-30', `rgba(${r}, ${g}, ${b}, 0.3)`);
  
  console.log('[Theme] Applied accent color:', hexColor);
}

type WalletClientLike = {
  account?: { address?: `0x${string}` };
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  signMessage?: (args: { message: string | { raw: `0x${string}` } }) => Promise<unknown>;
};

const signUniversalRootHash = async ({
  walletClient,
  rootHash,
  signerAddress,
  blindSigningEnabled,
  addDebug,
}: {
  walletClient: WalletClientLike;
  rootHash: `0x${string}`;
  signerAddress?: `0x${string}`;
  blindSigningEnabled: boolean;
  addDebug?: (msg: string) => void;
}): Promise<string> => {
  const signer = signerAddress || walletClient.account?.address;
  if (!signer) {
    throw new Error('Signer address unavailable for UA signature');
  }

  void blindSigningEnabled;

  // Particle demo uses signMessage (personal_sign) for rootHash - NOT secp256k1_sign.
  // Relay expects personal_sign format. Use signMessage first.
  if (walletClient.signMessage) {
    try {
      const signature = await walletClient.signMessage({ message: { raw: rootHash } });
      if (typeof signature === 'string' && signature.startsWith('0x')) {
        addDebug?.(`[7702] rootHash signed via signMessage (personal_sign)`);
        return signature;
      }
    } catch {
      // Fall through
    }
  }

  try {
    const signature = await walletClient.request({
      method: 'personal_sign',
      params: [rootHash, signer],
    });
    if (typeof signature === 'string') return signature;
  } catch {
    // Fallback
  }

  const signatureFallback = await walletClient.request({
    method: 'personal_sign',
    params: [signer, rootHash],
  });
  if (typeof signatureFallback !== 'string') {
    throw new Error('Invalid signature response from wallet');
  }
  return signatureFallback;
};

// Token icon mapping
const TOKEN_ICONS: Record<string, string> = {
  ETH: "⟠", WETH: "⟠", 
  BTC: "₿", WBTC: "₿",
  SOL: "◎", 
  USDC: "💵", USDT: "💵",
  ARB: "🔵", OP: "🔴", MATIC: "💜",
  LINK: "⬡", UNI: "🦄", AAVE: "👻",
};

const getTokenIcon = (symbol: string) => TOKEN_ICONS[symbol?.toUpperCase()] || "•";

const normalizeBlockchain = (blockchain?: string): string => {
  if (!blockchain) return "";
  const raw = blockchain.trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("sol")) return "solana";
  if (raw.includes("arb")) return "arbitrum";
  if (raw.includes("optim")) return "optimism";
  if (raw.includes("polygon") || raw === "matic") return "polygon";
  if (raw.includes("avax") || raw.includes("avalanche")) return "avalanche";
  if (raw.includes("bnb") || raw.includes("bsc") || raw.includes("binance")) return "bsc";
  if (raw.includes("eth") || raw.includes("erc20")) return "ethereum";
  if (raw.includes("base")) return "base";
  return raw;
};

const BLOCKCHAIN_TO_CHAIN_NAME: Record<string, string> = {
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  bsc: "BNB Chain",
  solana: "Solana",
  avalanche: "Avalanche",
};

const BLOCKCHAIN_TO_DEX_CHAIN: Record<string, string> = {
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum",
  optimism: "optimism",
  polygon: "polygon",
  bsc: "bsc",
  solana: "solana",
  avalanche: "avalanche",
};

const getChainLogoForBlockchain = (blockchain?: string): string | undefined => {
  const normalized = normalizeBlockchain(blockchain);
  const chainName = BLOCKCHAIN_TO_CHAIN_NAME[normalized];
  return chainName ? CHAIN_LOGOS[chainName] : undefined;
};

// Helper functions
const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(10).replace(/\.?0+$/, "")}`;
  if (price < 0.01) return `$${price.toFixed(8).replace(/\.?0+$/, "")}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatMarketCap = (mc: number): string => {
  if (!mc) return "N/A";
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(2)}K`;
  return `$${mc.toFixed(2)}`;
};

// Animated Login Screen - Omni branding
const LoginScreen = () => {
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden relative" style={{ maxHeight: '100dvh' }}>
      {/* Animated gradient orb background - purple/cyan theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(34,211,238,0.2) 40%, transparent 70%)',
            top: '15%',
            left: '-10%',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(168,85,247,0.1) 40%, transparent 60%)',
            bottom: '20%',
            right: '-15%',
            filter: 'blur(80px)',
          }}
        />
        {/* Flowing curved line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
              <stop offset="30%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -50 150 Q 100 200 80 350 Q 60 500 200 550 Q 340 600 300 750"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Content wrapper - centered vertically */}
      <div className="flex-1 flex flex-col justify-center px-8">
        {/* Logo - Slow rotation matching splash screen */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-1">
            <div className="relative">
              <img 
                src="/universal-wallet-web/omni-logo.png" 
                alt="O" 
                className="w-14 h-14 rounded-xl"
                style={{ animation: 'slowRotate 12s linear infinite' }}
              />
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-purple-500/40 via-cyan-400/40 to-purple-500/40 blur-xl animate-glow-pulse -z-10" />
            </div>
            <span className="text-white text-3xl font-bold tracking-wider">MNI</span>
          </div>
        </div>

        {/* Taglines */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 animate-fadeInLeft" style={{ animationDelay: '0.1s' }}>
            <span className="px-4 py-2 rounded-lg border-2 border-purple-500 text-purple-400 text-xl font-bold bg-purple-500/10">One</span>
            <span className="text-white text-2xl font-light">Balance</span>
          </div>
          <div className="flex items-center gap-4 ml-6 animate-fadeInLeft" style={{ animationDelay: '0.2s' }}>
            <span className="px-4 py-2 rounded-lg border-2 border-accent-dynamic text-accent-dynamic text-xl font-bold bg-accent-dynamic-10">Any</span>
            <span className="text-white text-2xl font-light">Chain</span>
          </div>
          <div className="flex items-center gap-4 animate-fadeInLeft" style={{ animationDelay: '0.3s' }}>
            <span className="px-4 py-2 rounded-lg border-2 border-purple-500 text-purple-400 text-xl font-bold bg-purple-500/10">Trade</span>
            <span className="text-white text-2xl font-light">Tokens & Perps</span>
          </div>
          <div className="flex items-center gap-4 ml-6 animate-fadeInLeft" style={{ animationDelay: '0.4s' }}>
            <span className="px-4 py-2 rounded-lg border-2 border-accent-dynamic text-accent-dynamic text-xl font-bold bg-accent-dynamic-10">Call</span>
            <span className="text-white text-2xl font-light">Contracts</span>
          </div>
        </div>
        
        {/* Chain logos */}
        <div className="flex items-center gap-3 mt-8 ml-1">
          {[CHAIN_LOGOS["Ethereum"], CHAIN_LOGOS["Base"], CHAIN_LOGOS["Solana"], CHAIN_LOGOS["Arbitrum"], CHAIN_LOGOS["BNB Chain"]].map((logo, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-800/80 border border-gray-700/50 p-1">
              <img src={logo} alt="" className="w-full h-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section - CTA */}
      <div className="px-6 pb-8" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
        <ConnectButton label="Get Started" />
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInLeft {
          animation: fadeInLeft 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes breatheStrong {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: brightness(1) saturate(1);
          }
          25% {
            transform: scale(1.15) rotate(-5deg);
            filter: brightness(1.3) saturate(1.2);
          }
          50% {
            transform: scale(1.2) rotate(0deg);
            filter: brightness(1.4) saturate(1.3);
          }
          75% {
            transform: scale(1.15) rotate(5deg);
            filter: brightness(1.3) saturate(1.2);
          }
        }
        @keyframes breatheGlow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.4);
          }
        }
        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2) rotate(180deg);
          }
        }
        .animate-breathe-strong {
          animation: breatheStrong 2.5s ease-in-out infinite;
        }
        .animate-breathe-glow {
          animation: breatheGlow 2.5s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glowPulse 4s ease-in-out infinite;
        }
        @keyframes slowRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Chain name mapping
// Chain ID to name mapping (including Solana)
const CHAIN_NAMES: Record<number | string, string> = {
  1: "Ethereum",
  10: "Optimism", 
  56: "BNB Chain",
  137: "Polygon",
  8453: "Base",
  42161: "Arbitrum",
  43114: "Avalanche",
  101: "Solana",
  // String variants for Particle UA
  "solana:mainnet": "Solana",
  "evm:1": "Ethereum",
  "evm:10": "Optimism",
  "evm:56": "BNB Chain",
  "evm:137": "Polygon",
  "evm:8453": "Base",
  "evm:42161": "Arbitrum",
};

// Chain logo URLs (actual images)
const CHAIN_LOGOS: Record<string, string> = {
  "Ethereum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "Optimism": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  "BNB Chain": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  "Polygon": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  "Base": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  "Arbitrum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  "Avalanche": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  "Solana": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

// Fallback chain icons (emojis)
const CHAIN_ICONS: Record<string, string> = {
  "Ethereum": "⟠",
  "Optimism": "🔴",
  "BNB Chain": "💛",
  "Polygon": "💜",
  "Base": "🔵",
  "Arbitrum": "🔷",
  "Avalanche": "🔺",
  "Solana": "◎",
};

// Known token logos (cache)
const TOKEN_LOGOS: Record<string, string> = {
  "ETH": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  "USDC": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  "USDT": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  "SOL": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  "BTC": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  "WBTC": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
  "DAI": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeCB5BE3830/logo.png",
  "MATIC": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  "BNB": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  "AVAX": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  "ARB": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  "OP": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
  "AVNT": "https://coin-images.coingecko.com/coins/images/68972/large/avnt-token.png",
};

const getChainName = (chainId: number | string) => {
  if (typeof chainId === 'string') {
    return CHAIN_NAMES[chainId] || chainId;
  }
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

const getChainIcon = (chainName: string) => CHAIN_ICONS[chainName] || "•";

// Token Logo component with fallback
const TokenLogo = ({ symbol, size = 40 }: { symbol: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = TOKEN_LOGOS[symbol.toUpperCase()];
  
  if (!logoUrl || imgError) {
    return (
      <div 
        className="rounded-full bg-gray-800 flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {getTokenIcon(symbol)}
      </div>
    );
  }
  
  return (
    <img 
      src={logoUrl}
      alt={symbol}
      className="rounded-full bg-gray-800"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

// Chain Logo component with fallback  
const ChainLogo = ({ chainName, size = 16 }: { chainName: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = CHAIN_LOGOS[chainName];
  
  if (!logoUrl || imgError) {
    return <span style={{ fontSize: size }}>{getChainIcon(chainName)}</span>;
  }
  
  return (
    <img 
      src={logoUrl}
      alt={chainName}
      className="rounded-full"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
};

// Profile Emoji Picker Modal
const ProfilePickerModal = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileSettings;
  onUpdateProfile: (p: ProfileSettings) => void;
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedColor, setSelectedColor] = useState(profile.backgroundColor || "#f97316");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName);
      setSelectedColor(profile.backgroundColor || "#f97316");
    }
  }, [isOpen, profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ ...profile, customImage: reader.result as string, emoji: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8">
        <h2 className="text-white text-xl font-bold mb-6 text-center">Customize Profile</h2>
        
        {/* Display Name */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter a custom name..."
            className="w-full bg-gray-800 rounded-xl px-3 py-2 text-white outline-none"
            maxLength={20}
          />
        </div>

        {/* Current Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl overflow-hidden"
            style={{ backgroundColor: profile.customImage ? undefined : selectedColor }}
          >
            {profile.customImage ? (
              <img src={profile.customImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile.emoji
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Background Color Picker */}
        {!profile.customImage && (
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Background Color</label>
            <div className="grid grid-cols-9 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Emoji Grid */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Pick an emoji</label>
          <div className="grid grid-cols-8 gap-2">
            {PROFILE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onUpdateProfile({ ...profile, emoji, customImage: null, backgroundColor: selectedColor })}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                  profile.emoji === emoji && !profile.customImage ? "bg-gray-600" : "bg-gray-800"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={() => {
            onUpdateProfile({ ...profile, displayName, backgroundColor: selectedColor });
            onClose();
          }}
          className="w-full bg-accent-dynamic text-black font-bold py-3 rounded-xl"
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
};

// Receive/Deposit Modal - consolidated EVM (single address) + Solana
const ReceiveModal = ({
  isOpen,
  onClose,
  evmAddress,
  solanaAddress,
}: {
  isOpen: boolean;
  onClose: () => void;
  evmAddress: string;
  solanaAddress: string;
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [qrAddress, setQrAddress] = useState<{ chain: string; address: string } | null>(null);

  const handleCopy = (addr: string, type: string) => {
    copyToClipboard(addr);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const EVM_CHAINS = [
    { name: "Ethereum", logo: CHAIN_LOGOS["Ethereum"] },
    { name: "Base", logo: CHAIN_LOGOS["Base"] },
    { name: "BNB Chain", logo: CHAIN_LOGOS["BNB Chain"] },
    { name: "Arbitrum", logo: CHAIN_LOGOS["Arbitrum"] },
    { name: "Polygon", logo: CHAIN_LOGOS["Polygon"] },
    { name: "Optimism", logo: CHAIN_LOGOS["Optimism"] },
    { name: "Avalanche", logo: CHAIN_LOGOS["Avalanche"] },
  ];

  const rows = [
    { id: "evm", label: "EVM", address: evmAddress, logos: EVM_CHAINS, centerLogo: false },
    { id: "solana", label: "Solana", address: solanaAddress, logos: [{ name: "Solana", logo: CHAIN_LOGOS["Solana"] }], centerLogo: true },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8 min-h-[400px]">
        <h2 className="text-white text-xl font-bold mb-2">Receive</h2>
        
        <p className="text-gray-400 text-sm mb-3">
          Deposit any token on supported networks. You may use the following tokens for trading/gas:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {["USDC", "USDT", "ETH", "SOL", "BNB"].map((sym) => (
            <div key={sym} className="flex items-center gap-1.5 bg-zinc-800/80 rounded-lg px-2 py-1">
              <img src={TOKEN_LOGOS[sym] || TOKEN_LOGOS.ETH} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-white text-xs font-medium">{sym}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">Your receive address</p>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="bg-[#252525] rounded-xl px-3 py-3">
              <div className="flex items-start gap-3">
                {/* Logo area - same width for both; EVM shows all chains, Solana centers its logo */}
                <div className={`flex-shrink-0 w-[88px] flex items-center min-h-[52px] ${row.centerLogo ? "justify-center" : "justify-start"}`}>
                  {row.logos.length > 1 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.logos.map((c) => (
                        <img key={c.name} src={c.logo} alt={c.name} className="w-6 h-6 rounded-full border-2 border-[#252525]" title={c.name} />
                      ))}
                    </div>
                  ) : (
                    <img src={row.logos[0].logo} alt={row.label} className="w-8 h-8 rounded-full" />
                  )}
                </div>
                {/* Label + address + actions */}
                <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium">{row.label}</div>
                    <p className="text-gray-400 text-xs font-mono break-all mt-0.5">{row.address}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(row.address, row.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy address"
                  >
                    {copied === row.id ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setQrAddress({ chain: row.label, address: row.address })}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Show QR code"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4v4H4V4zm0 12h4v4H4v-4zm12-12h4v4h-4V4zm0 12h4v4h-4v-4zm-6-6h4v4h-4v-4z" />
                    </svg>
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Modal */}
        {qrAddress && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => setQrAddress(null)}>
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-white text-lg font-bold mb-4 text-center">{qrAddress.chain}</h3>
              <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrAddress.address}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-gray-400 text-xs font-mono text-center break-all mb-4">{qrAddress.address}</p>
              <button
                onClick={() => setQrAddress(null)}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

const CHAIN_ID_TO_NAME_SEND: Record<number, string> = {
  1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism",
  137: "Polygon", 56: "BNB Chain", 101: "Solana", 43114: "Avalanche",
};

// Map numeric chainId to UA SDK CHAIN_ID
const CHAIN_ID_MAP: Record<number, number> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  101: CHAIN_ID.SOLANA_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
};

// Detect if address is EVM (0x...) or Solana (base58)
function isEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}
function isSolanaAddress(addr: string): boolean {
  const a = addr.trim();
  return a.length >= 32 && a.length <= 44 && !a.startsWith("0x");
}

// Send Modal - wired transfer for UA primary assets
const SendModal = ({
  isOpen,
  onClose,
  assets,
  universalAccount,
  blindSigningEnabled,
  sign7702,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
  sign7702: ((p: { contractAddress: `0x${string}`; chainId: number; nonce: number }, o: { address: string }) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>) | null;
  onSuccess?: () => void;
}) => {
  const [primaryWallet] = useWallets();
  const { address } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [sendTokenOpen, setSendTokenOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string } | null>(null);

  // Flatten assets to (symbol, chainId, address, balance) for transfer
  const transferOptions = useMemo(() => {
    if (!assets?.assets) return [];
    const out: Array<{ key: string; symbol: string; chainId: number; address: string; balance: number }> = [];
    for (const a of assets.assets) {
      const asset = a as { tokenType?: string; chainAggregation?: Array<{ token?: { chainId?: number; address?: string }; amount?: number }> };
      const chainAgg = asset.chainAggregation;
      if (!chainAgg?.length) continue;
      for (const c of chainAgg) {
        const chainId = Number(c.token?.chainId);
        const tokenAddr = c.token?.address || "";
        const bal = Number(c.amount || 0);
        if (bal < 0.0001 || !chainId) continue;
        const key = `${asset.tokenType}-${chainId}`;
        out.push({
          key,
          symbol: asset.tokenType?.toUpperCase() || "?",
          chainId,
          address: tokenAddr,
          balance: bal,
        });
      }
    }
    return out;
  }, [assets]);

  // Default to highest UA balance when modal opens
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && transferOptions.length > 0) {
      const best = transferOptions.reduce((a, b) => (a.balance >= b.balance ? a : b));
      setSelectedOption(best.key);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, transferOptions]);

  const selected = transferOptions.find((o) => o.key === selectedOption);
  const canSend = selected && recipient.trim() && amount && parseFloat(amount) > 0 && parseFloat(amount) <= (selected?.balance ?? 0);

  const handleSend = async () => {
    if (!universalAccount || !primaryWallet || !address || !selected || !canSend) return;
    setError(null);
    setIsLoading(true);
    try {
      const rec = recipient.trim();
      const isEVM = isEvmAddress(rec);
      const isSOL = isSolanaAddress(rec);
      if (!isEVM && !isSOL) {
        setError("Invalid address. Use 0x... for EVM or base58 for Solana.");
        return;
      }
      if (selected.chainId === 101 && !isSOL) {
        setError("Solana asset must be sent to a Solana address.");
        return;
      }
      if (selected.chainId !== 101 && !isEVM) {
        setError("EVM asset must be sent to an EVM (0x...) address.");
        return;
      }

      const uaChainId = CHAIN_ID_MAP[selected.chainId] ?? selected.chainId;
      // Native tokens on EVM use 0xEee...; use token address from chainAggregation when present
      const tokenAddr = selected.address || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

      const tx = await universalAccount.createTransferTransaction({
        token: { chainId: uaChainId, address: tokenAddr },
        amount: amount,
        receiver: rec,
      });

      const walletClient = primaryWallet.getWalletClient();
      const wc = walletClient as unknown as WalletClientLike;

      // Privy flow: avoid explicit eth_send7702Transaction pre-delegation.
      // We rely on per-userOp authorizations passed into sendTransaction.

      const signature = await signUniversalRootHash({
        walletClient: wc,
        rootHash: tx.rootHash as `0x${string}`,
        signerAddress: wc?.account?.address as `0x${string}` | undefined,
        blindSigningEnabled,
      });
      if (!signature) throw new Error("Failed to sign");

      if (!sign7702 || !address) throw new Error("Wallet signing not available");
      const authorizations = await build7702Authorizations(tx, sign7702, address);
      const result = await universalAccount.sendTransaction(tx, signature as string, authorizations);
      setTxResult({ txId: result.transactionId });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTxResult(null);
    setRecipient("");
    setAmount("");
    setSelectedOption("");
    setError(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8 min-h-[400px]">
        <h2 className="text-white text-xl font-bold mb-5">Send</h2>

        {txResult ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 text-center">
              <p className="text-green-400 font-medium">Transfer sent!</p>
              <a
                href={`https://universalx.app/activity/details?id=${txResult.txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-dynamic text-sm underline mt-2 block"
              >
                View transaction
              </a>
            </div>
            <button onClick={resetForm} className="w-full bg-zinc-700 text-white py-3 rounded-full">
              Send another
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-3 bg-red-900/30 border border-red-500/50 rounded-lg p-2 text-red-300 text-xs">
                {error}
              </div>
            )}

            {/* Token + Chain Selection */}
            <div className="mb-3">
              <label className="text-gray-400 text-sm mb-2 block">You are sending</label>
              <div className="relative">
                <button
                  onClick={() => setSendTokenOpen(!sendTokenOpen)}
                  className="w-full bg-zinc-950 rounded-lg px-3 py-2.5 text-white text-left flex items-center justify-between border border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    {selected ? (
                      <>
                        <div className="relative">
                          <img src={TOKEN_LOGOS[selected.symbol] || TOKEN_LOGOS.ETH} alt="" className="w-6 h-6 rounded-full" />
                          <img
                            src={CHAIN_LOGOS[CHAIN_ID_TO_NAME_SEND[selected.chainId]] || CHAIN_LOGOS.Ethereum}
                            alt=""
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-950"
                          />
                        </div>
                        <span className="text-sm font-medium">{selected.symbol}</span>
                        <span className="text-gray-500 text-xs">— {selected.balance.toFixed(4)}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Select token</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">▼</span>
                </button>
                {sendTokenOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20 max-h-48 overflow-y-auto">
                    {transferOptions.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => { setSelectedOption(o.key); setSendTokenOpen(false); }}
                        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-zinc-800 text-left"
                      >
                        <div className="relative">
                          <img src={TOKEN_LOGOS[o.symbol] || TOKEN_LOGOS.ETH} alt="" className="w-6 h-6 rounded-full" />
                          <img
                            src={CHAIN_LOGOS[CHAIN_ID_TO_NAME_SEND[o.chainId]] || CHAIN_LOGOS.Ethereum}
                            alt=""
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm">{o.symbol}</div>
                          <div className="text-gray-500 text-xs">{o.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="text-gray-400 text-sm mb-2 block">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder=""
                className="w-full bg-zinc-950 rounded-xl px-3 py-2 text-white outline-none border border-zinc-800"
              />
            </div>

            <div className="mb-6">
              <label className="text-gray-400 text-sm mb-2 block">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-950 rounded-xl px-3 py-2 text-white outline-none border border-zinc-800"
              />
              {selected && (
                <button
                  type="button"
                  onClick={() => setAmount(selected.balance.toString())}
                  className="text-accent-dynamic text-xs mt-1"
                >
                  Max
                </button>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend || isLoading}
              className="w-full bg-accent-dynamic text-white font-bold py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

// UA Primary Assets with chain support
const UA_PRIMARY_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', chains: [8453, 1, 42161, 10, 137, 43114, 101] }, // Base, ETH, Arb, OP, Polygon, Avalanche, Solana
  { symbol: 'USDT', name: 'Tether USD', chains: [8453, 1, 42161, 10, 137, 43114, 56, 101] }, // + BSC, Solana
  { symbol: 'ETH', name: 'Ethereum', chains: [8453, 1, 42161, 10, 137, 43114] }, // EVM chains only
  { symbol: 'SOL', name: 'Solana', chains: [101] }, // Solana only
  { symbol: 'BNB', name: 'BNB', chains: [56] }, // BSC only
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CHAIN_INFO: Record<number, { name: string; logo: string }> = {
  1: { name: 'Ethereum', logo: '⟠' },
  8453: { name: 'Base', logo: '🔵' },
  42161: { name: 'Arbitrum', logo: '🔷' },
  10: { name: 'Optimism', logo: '🔴' },
  137: { name: 'Polygon', logo: '🟣' },
  43114: { name: 'Avalanche', logo: '🔺' },
  56: { name: 'BSC', logo: '🟡' },
  101: { name: 'Solana', logo: '◎' },
};

// Convert Modal - UA Cross-Chain Convert
const ConvertModal = ({
  isOpen,
  onClose,
  assets,
  universalAccount,
  blindSigningEnabled,
  signMessage,
  onTransactionCreated,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
  signMessage?: ((p: { message: string }, o: { uiOptions?: { title?: string }; address: string }) => Promise<{ signature: string }>) | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTransactionCreated?: (tx: any) => void;
  onSuccess?: () => void; // Callback to refresh balances
}) => {
  const [primaryWallet] = useWallets();
  const sign7702 = useSign7702AuthorizationCompat();
  const [fromAsset, setFromAsset] = useState<string>('');
  const [fromChain, setFromChain] = useState<number | null>(null);
  const [toAsset, setToAsset] = useState<string>('');
  const [toChain, setToChain] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [txResult, setTxResult] = useState<{ txId: string; status: string } | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addDebug = useCallback((msg: string) => {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setDebugLogs(prev => [...prev.slice(-79), line]);
    console.log('[ConvertDebug]', msg);
  }, []);
  
  useEffect(() => {
    if (isOpen && universalAccount) {
      setDebugLogs([]);
      addDebug('Convert modal opened');
      getEIP7702Deployments(universalAccount).then((d) => {
        if (d) addDebug(`7702 deployments: ${JSON.stringify(d).slice(0, 120)}...`);
      });
    }
  }, [isOpen, addDebug, universalAccount]);

  // Auto-clear txResult after success animation and close modal
  useEffect(() => {
    if (txResult?.status === 'complete') {
      const timer = setTimeout(() => {
        setTxResult(null);
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [txResult?.status, onClose]);
  
  // Dropdown visibility states
  const [fromAssetOpen, setFromAssetOpen] = useState(false);
  const [fromChainOpen, setFromChainOpen] = useState(false);
  const [toAssetOpen, setToAssetOpen] = useState(false);
  const [toChainOpen, setToChainOpen] = useState(false);
  
  // Map chainId to chain name for logo lookup
  const CHAIN_ID_TO_NAME: Record<number, string> = {
    1: "Ethereum", 8453: "Base", 42161: "Arbitrum", 10: "Optimism",
    137: "Polygon", 56: "BNB Chain", 101: "Solana", 43114: "Avalanche",
  };

  // Get UA primary assets with balance (using correct SDK structure)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uaAssets = useMemo(() => {
    if (!assets?.assets) {
      console.log('[Convert] No assets.assets');
      return [];
    }
    // UA SDK uses tokenType (e.g., "eth", "usdt", "sol") and amount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log('[Convert] UA assets:', assets.assets.map((a: any) => ({ 
      tokenType: a.tokenType, 
      amount: a.amount,
      amountInUSD: a.amountInUSD 
    })));
    
    // Filter for primary assets with balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = assets.assets.filter((a: any) => {
      const hasBalance = a.amount > 0.0001;
      console.log('[Convert] Asset:', a.tokenType, 'amount:', a.amount, 'USD:', a.amountInUSD);
      return hasBalance;
    });
    console.log('[Convert] Filtered:', filtered.length);
    return filtered;
  }, [assets]);

  // Get available chains for selected from asset (where user has balance)
  const fromChains = useMemo(() => {
    if (!fromAsset) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asset = uaAssets.find((a: any) => a.tokenType === fromAsset);
    if (!asset?.chainAggregation) return [];
    // Use SDK structure: chainAggregation[].token.chainId, amount, amountInUSD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return asset.chainAggregation.filter((c: any) => c.amount > 0.0001).map((c: any) => ({
      chainId: c.token?.chainId,
      address: c.token?.address,
      balance: c.amount,
      balanceUSD: c.amountInUSD,
    }));
  }, [fromAsset, uaAssets]);

  // Get available chains for selected to asset
  const toChains = useMemo(() => {
    if (!toAsset) return [];
    // Match by tokenType (lowercase) to UA_PRIMARY_ASSETS symbol
    const uaPrimary = UA_PRIMARY_ASSETS.find(p => p.symbol.toLowerCase() === toAsset.toLowerCase());
    return uaPrimary?.chains || [];
  }, [toAsset]);

  // Get balance for selected from chain
  const selectedFromBalance = useMemo(() => {
    if (!fromChain || !fromChains.length) return null;
    return fromChains.find((c: { chainId: number }) => c.chainId === fromChain);
  }, [fromChain, fromChains]);

  // Reset chain when asset changes
  useEffect(() => {
    setFromChain(null);
  }, [fromAsset]);

  useEffect(() => {
    setToChain(null);
  }, [toAsset]);

  // Estimate output (simplified - same amount for stablecoins, rough rate for others)
  useEffect(() => {
    if (!amount || !fromAsset || !toAsset) {
      setEstimatedOutput(null);
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum)) {
      setEstimatedOutput(null);
      return;
    }
    // For simplicity, use USD value - in production, get actual quote from UA SDK
    if (selectedFromBalance?.balanceUSD && amtNum > 0) {
      const pricePerUnit = selectedFromBalance.balanceUSD / selectedFromBalance.balance;
      const usdValue = amtNum * pricePerUnit;
      // Rough conversion - in production, call getTokenPair for actual rates
      if (['USDC', 'USDT'].includes(toAsset)) {
        setEstimatedOutput(`~${usdValue.toFixed(2)} ${toAsset}`);
      } else if (toAsset === 'ETH') {
        setEstimatedOutput(`~${(usdValue / 3500).toFixed(6)} ${toAsset}`); // Rough ETH price
      } else if (toAsset === 'SOL') {
        setEstimatedOutput(`~${(usdValue / 150).toFixed(4)} ${toAsset}`); // Rough SOL price
      } else if (toAsset === 'BNB') {
        setEstimatedOutput(`~${(usdValue / 600).toFixed(4)} ${toAsset}`); // Rough BNB price
      } else {
        setEstimatedOutput(`~$${usdValue.toFixed(2)} worth`);
      }
    }
  }, [amount, fromAsset, toAsset, selectedFromBalance]);

  const handleConvert = async () => {
    if (!universalAccount || !fromAsset || !fromChain || !toAsset || !toChain || !amount) {
      setError('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    addDebug(`Input from=${fromAsset}@${fromChain} to=${toAsset}@${toChain} amount=${amount}`);

    try {
      // Calculate the amount in the target token
      // For simplicity, use USD value and estimate
      const amtNum = parseFloat(amount);
      if (isNaN(amtNum) || amtNum <= 0) {
        throw new Error('Invalid amount');
      }
      if (selectedFromBalance?.balance && amtNum > selectedFromBalance.balance + 1e-10) {
        throw new Error('Amount exceeds available source balance.');
      }

      // Refresh primary assets right before conversion to avoid stale MAX quotes.
      let freshAssets: IAssetsResponse | null = null;
      try {
        freshAssets = await universalAccount.getPrimaryAssets();
      } catch {
        // Fallback to in-memory balances if refresh fails.
      }

      // Get latest source asset metrics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const freshFromAsset = freshAssets?.assets?.find((a: any) => a.tokenType === fromAsset) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const freshFromChain = freshFromAsset?.chainAggregation?.find((c: any) => Number(c.token?.chainId) === Number(fromChain)) as any;
      const sourcePrice = Number(freshFromAsset?.price || 0);
      const sourceBalance = Number(freshFromChain?.amount ?? selectedFromBalance?.balance ?? 0);
      const sourceBalanceUSD = Number(freshFromChain?.amountInUSD ?? selectedFromBalance?.balanceUSD ?? 0);

      if (sourceBalance > 0 && amtNum > sourceBalance + 1e-10) {
        throw new Error('Amount exceeds latest source balance.');
      }

      const usdValue =
        sourcePrice > 0
          ? amtNum * sourcePrice
          : (sourceBalance > 0 ? (amtNum * (sourceBalanceUSD / sourceBalance)) : 0);
      if (!Number.isFinite(usdValue) || usdValue <= 0) {
        throw new Error('Could not compute conversion quote value. Please try again.');
      }

      // Map to SUPPORTED_TOKEN_TYPE enum
      const tokenTypeMap: Record<string, SUPPORTED_TOKEN_TYPE> = {
        'USDC': SUPPORTED_TOKEN_TYPE.USDC,
        'USDT': SUPPORTED_TOKEN_TYPE.USDT,
        'ETH': SUPPORTED_TOKEN_TYPE.ETH,
        'SOL': SUPPORTED_TOKEN_TYPE.SOL,
        'BNB': SUPPORTED_TOKEN_TYPE.BNB,
        'BTC': SUPPORTED_TOKEN_TYPE.BTC,
      };
      
      const targetTokenType = tokenTypeMap[toAsset];
      if (!targetTokenType) {
        throw new Error(`Unsupported token type: ${toAsset}`);
      }

      // Estimate output amount based on target asset
      // Use latest source/target prices from UA assets where possible.
      let outputAmount: number;
      
      if ([SUPPORTED_TOKEN_TYPE.USDC, SUPPORTED_TOKEN_TYPE.USDT].includes(targetTokenType)) {
        outputAmount = usdValue; // Stablecoins ~= USD
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const freshToAsset = freshAssets?.assets?.find((a: any) => a.tokenType === toAsset.toLowerCase()) as any;
        const targetPrice = Number(freshToAsset?.price || 0);
        if (targetPrice > 0) {
          outputAmount = usdValue / targetPrice;
        } else if (targetTokenType === SUPPORTED_TOKEN_TYPE.ETH) {
          outputAmount = usdValue / 3500;
        } else if (targetTokenType === SUPPORTED_TOKEN_TYPE.SOL) {
          outputAmount = usdValue / 150;
        } else if (targetTokenType === SUPPORTED_TOKEN_TYPE.BNB) {
          outputAmount = usdValue / 600;
        } else if (targetTokenType === SUPPORTED_TOKEN_TYPE.BTC) {
          outputAmount = usdValue / 95000;
        } else {
          outputAmount = usdValue;
        }
      }
      if (!Number.isFinite(outputAmount) || outputAmount <= 0) {
        throw new Error('Invalid output quote generated. Please retry.');
      }

      const sourceTokenType = tokenTypeMap[fromAsset.toUpperCase()];
      // Constrain conversion sourcing to selected "from" primary token for closer MAX behavior.
      const tradeConfig = sourceTokenType
        ? { usePrimaryTokens: [sourceTokenType] }
        : undefined;

      // Create convert transaction via UA SDK
      // chainId = destination chain, expectToken = what we want to receive
      setLoadingStatus('Creating transaction...');
      const tx = await universalAccount.createConvertTransaction({
        chainId: toChain,
        expectToken: {
          type: targetTokenType,
          amount: outputAmount.toFixed(8), // Amount in target token units
        },
      }, tradeConfig);

      console.log('[Convert] Transaction created:', tx);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userOps = (tx as any)?.userOps || [];
      addDebug(`UA tx created: userOps=${userOps.length}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userOps.forEach((u: any, i: number) => addDebug(`userOp[${i}] chain=${u?.chainId} delegated=${!!u?.eip7702Delegated} hasAuth=${!!u?.eip7702Auth} nonce=${u?.eip7702Auth?.nonce}`));
      
      // Extract and display fees from transaction (prefer feeQuotes breakdown)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feeQuote = (tx as any)?.feeQuotes?.[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totals = feeQuote?.fees?.totals as any;
      if (totals) {
        const total = Number(formatUnits(BigInt(totals.feeTokenAmountInUSD || '0'), 18));
        const gas = Number(formatUnits(BigInt(totals.gasFeeTokenAmountInUSD || '0'), 18));
        const service = Number(formatUnits(BigInt(totals.transactionServiceFeeTokenAmountInUSD || '0'), 18));
        const lp = Number(formatUnits(BigInt(totals.transactionLPFeeTokenAmountInUSD || '0'), 18));
        setEstimatedFee(
          `Total ~$${total.toFixed(2)} (Gas ~$${gas.toFixed(2)} · Service ~$${service.toFixed(2)} · LP ~$${lp.toFixed(2)})`
        );
      } else {
        // Backward compatibility fallback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txFees = (tx as any).transactionFees;
        if (txFees) {
          const serviceFee = parseFloat(txFees.transactionServiceFeeAmountInUSD || '0');
          const lpFee = parseFloat(txFees.transactionLPFeeAmountInUSD || '0');
          const totalFee = serviceFee + lpFee;
          if (totalFee > 0) {
            setEstimatedFee(`~$${totalFee.toFixed(2)}`);
          } else if (txFees.freeGasFee && txFees.freeServiceFee) {
            setEstimatedFee('Free');
          }
        }
      }
      
      if (onTransactionCreated) {
        onTransactionCreated(tx);
      }
      
      // Sign and send transaction (same flow as Perps)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((tx as any).rootHash) {
        if (!primaryWallet) {
          throw new Error('Please connect wallet first');
        }

        const walletClient = primaryWallet.getWalletClient();
        const wc = walletClient as unknown as WalletClientLike;
        const ownerAddr = wc?.account?.address as string | undefined;
        if (!ownerAddr) throw new Error('Wallet address unavailable');

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const rawOps = (tx as any)?.userOps ?? (tx as any)?.feeQuotes?.[0]?.userOps ?? [];
        const afterFilter = rawOps.filter((op: { eip7702Auth?: unknown; eip7702Delegated?: unknown }) =>
          op?.eip7702Auth && !op?.eip7702Delegated
        );
        const afterMap = afterFilter.map((op: { eip7702Auth?: { chainId?: unknown }; chainId?: unknown }) => {
          const c = op.chainId ?? op.eip7702Auth?.chainId;
          return typeof c === "number" ? c : typeof c === "string" ? parseInt(c, 10) : Number(c);
        });
        const chainsNeeding = afterMap.filter((c: number) => !Number.isNaN(c) && c > 0 && c !== 101) as number[];
        const chainsNeedingUnique: number[] = Array.from(new Set(chainsNeeding));
        addDebug(`chainsNeeding=[${chainsNeedingUnique.join(",")}] len=${chainsNeedingUnique.length}`);
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // Particle example: sign root hash + all 7702 auth, send in one shot. No pre-delegation.
        // Sign the tx root hash - Particle demo uses Privy signMessage (personal_sign)
        setLoadingStatus('Waiting for signature...');
        const rootHash = (tx as { rootHash?: string })?.rootHash as string | undefined;
        const signature = signMessage && rootHash
          ? (await signMessage(
              { message: rootHash },
              { uiOptions: { title: 'Sign conversion' }, address: ownerAddr }
            )).signature
          : await signUniversalRootHash({
              walletClient: wc,
              rootHash: rootHash as `0x${string}`,
              signerAddress: wc.account?.address as `0x${string}` | undefined,
              blindSigningEnabled,
              addDebug,
            });

        // Send transaction
        setLoadingStatus('Sending transaction...');
        if (!sign7702) throw new Error('Wallet signing not available');
        const authorizations = await build7702Authorizations(tx, sign7702, ownerAddr);
        addDebug(`Signature ready. authList=${authorizations?.length || 0}`);
        const sendResult = await universalAccount.sendTransaction(tx, signature as string, authorizations);
        
        if (sendResult?.transactionId) {
          console.log('[Convert] Transaction sent:', sendResult.transactionId);
          setTxResult({
            txId: sendResult.transactionId,
            status: 'pending',
          });
          setLoadingStatus('Waiting for confirmation...');
          
          // Wait for balance refresh to confirm conversion
          if (onSuccess) {
            // Poll balance until it updates (max 30 seconds)
            let attempts = 0;
            const maxAttempts = 15;
            
            const checkBalance = async () => {
              attempts++;
              await onSuccess();
              
              // After refresh, mark as complete
              // In production, we'd compare before/after balances
              // For now, trust the refresh after a few attempts
              if (attempts >= 3) {
                setTxResult({
                  txId: sendResult.transactionId,
                  status: 'complete',
                });
                setLoadingStatus('');
                
                // Reset form
                setFromAsset('');
                setFromChain(null);
                setToAsset('');
                setToChain(null);
                setAmount('');
              } else if (attempts < maxAttempts) {
                setTimeout(checkBalance, 2000);
              }
            };
            
            setTimeout(checkBalance, 2000);
          }
        }
      } else {
        throw new Error('Transaction requires signature but rootHash not found');
      }
    } catch (err) {
      console.error('[Convert] Error:', err);
      addDebug(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setError(err instanceof Error ? err.message : 'Failed to convert');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleMax = () => {
    if (selectedFromBalance) {
      setAmount(selectedFromBalance.balance.toString());
    }
  };

  const canConvert = fromAsset && fromChain && toAsset && toChain && amount && parseFloat(amount) > 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8 min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Convert</h2>
          <button
            onClick={() => setDebugOpen(true)}
            className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-300 hover:bg-zinc-700"
          >
            Debug
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-2 mb-2 text-red-300 text-xs">
            {error}
          </div>
        )}

        {fromChain === 101 && toChain && toChain !== 101 && (
          <div className="bg-amber-900/20 border border-amber-600/50 rounded-lg p-2 mb-2 text-amber-200 text-xs">
            Solana→EVM: Delegate the destination chain in Settings first for best results.
          </div>
        )}

        {/* From Section - Compact */}
        <div className="mb-1">
          <div className="text-gray-400 text-xs mb-1">From</div>
          
          <div className="flex gap-2 mb-1">
            {/* Asset Dropdown - Compact */}
            <div className="flex-1 relative">
              <button
                onClick={() => { setFromAssetOpen(!fromAssetOpen); setFromChainOpen(false); }}
                className="w-full bg-zinc-950 rounded-lg px-2 py-1.5 text-white text-left flex items-center justify-between border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  {fromAsset ? (
                    <>
                      <img src={TOKEN_LOGOS[fromAsset.toUpperCase()] || TOKEN_LOGOS['ETH']} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-sm font-medium">{fromAsset.toUpperCase()}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Asset</span>
                  )}
                </div>
                <span className="text-gray-400 text-xs">▼</span>
              </button>
              {fromAssetOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20 max-h-40 overflow-y-auto">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {uaAssets.map((a: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => { setFromAsset(a.tokenType); setFromAssetOpen(false); }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                    >
                      <img src={TOKEN_LOGOS[a.tokenType?.toUpperCase()] || TOKEN_LOGOS['ETH']} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-white text-sm">{a.tokenType?.toUpperCase()}</span>
                      <span className="text-gray-400 text-xs ml-auto">${a.amountInUSD?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Chain Dropdown - Compact */}
            <div className="w-28 relative">
              <button
                onClick={() => { if (fromAsset) { setFromChainOpen(!fromChainOpen); setFromAssetOpen(false); }}}
                className={`w-full bg-zinc-950 rounded-lg px-2 py-1.5 text-left flex items-center justify-between border border-zinc-800 ${!fromAsset ? 'opacity-50' : ''}`}
                disabled={!fromAsset}
              >
                <div className="flex items-center gap-1">
                  {fromChain ? (
                    <>
                      <img src={CHAIN_LOGOS[CHAIN_ID_TO_NAME[fromChain]] || CHAIN_LOGOS['Ethereum']} alt="" className="w-4 h-4 rounded-full" />
                      <span className="text-white text-xs">{CHAIN_ID_TO_NAME[fromChain]}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">Chain</span>
                  )}
                </div>
                <span className="text-gray-400 text-[10px]">▼</span>
              </button>
              {fromChainOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20 max-h-40 overflow-y-auto">
                  {fromChains.map((c: { chainId: number; balance: number; balanceUSD: number }) => (
                    <button
                      key={c.chainId}
                      onClick={() => { setFromChain(c.chainId); setFromChainOpen(false); }}
                      className="w-full px-2 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                    >
                      <img src={CHAIN_LOGOS[CHAIN_ID_TO_NAME[c.chainId]] || CHAIN_LOGOS['Ethereum']} alt="" className="w-4 h-4 rounded-full" />
                      <div>
                        <div className="text-white text-xs">{CHAIN_ID_TO_NAME[c.chainId]}</div>
                        <div className="text-gray-400 text-[10px]">{c.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

            <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-zinc-950 rounded-lg px-2 py-1.5 text-white outline-none border border-zinc-800"
            />
            <button 
              onClick={handleMax}
              className="bg-zinc-950 px-2 py-1.5 rounded-lg text-accent-dynamic text-xs hover:bg-zinc-800 border border-zinc-800"
            >
              MAX
            </button>
            {selectedFromBalance && (
              <span className="text-gray-500 text-[10px]">${selectedFromBalance.balanceUSD.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-1 relative z-10">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400">
            ↓
          </div>
        </div>

        {/* To Section - Compact */}
        <div className="mb-2">
          <div className="text-gray-400 text-xs mb-1">To</div>
          
          <div className="flex gap-2">
            {/* To Asset Dropdown - Compact */}
            <div className="flex-1 relative">
              <button
                onClick={() => { setToAssetOpen(!toAssetOpen); setToChainOpen(false); }}
                className="w-full bg-zinc-950 rounded-lg px-2 py-1.5 text-white text-left flex items-center justify-between border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  {toAsset ? (
                    <>
                      <img src={TOKEN_LOGOS[toAsset.toUpperCase()] || TOKEN_LOGOS['ETH']} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-sm font-medium">{toAsset.toUpperCase()}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">Asset</span>
                  )}
                </div>
                <span className="text-gray-400 text-xs">▼</span>
              </button>
              {toAssetOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20 max-h-40 overflow-y-auto">
                  {UA_PRIMARY_ASSETS.map((a) => (
                    <button
                      key={a.symbol}
                      onClick={() => { setToAsset(a.symbol); setToAssetOpen(false); }}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                    >
                      <img src={TOKEN_LOGOS[a.symbol] || TOKEN_LOGOS['ETH']} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-white text-sm">{a.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* To Chain Dropdown - Opens UPWARD */}
            <div className="w-28 relative">
              <button
                onClick={() => { if (toAsset) { setToChainOpen(!toChainOpen); setToAssetOpen(false); }}}
                className={`w-full bg-zinc-950 rounded-lg px-2 py-1.5 text-left flex items-center justify-between border border-zinc-800 ${!toAsset ? 'opacity-50' : ''}`}
                disabled={!toAsset}
              >
                <div className="flex items-center gap-1">
                  {toChain ? (
                    <>
                      <img src={CHAIN_LOGOS[CHAIN_ID_TO_NAME[toChain]] || CHAIN_LOGOS['Ethereum']} alt="" className="w-4 h-4 rounded-full" />
                      <span className="text-white text-xs">{CHAIN_ID_TO_NAME[toChain]}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">Chain</span>
                  )}
                </div>
                <span className="text-gray-400 text-[10px]">▼</span>
              </button>
              {toChainOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden z-20 max-h-40 overflow-y-auto">
                  {toChains.map((chainId: number) => (
                    <button
                      key={chainId}
                      onClick={() => { setToChain(chainId); setToChainOpen(false); }}
                      className="w-full px-2 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                    >
                      <img src={CHAIN_LOGOS[CHAIN_ID_TO_NAME[chainId]] || CHAIN_LOGOS['Ethereum']} alt="" className="w-4 h-4 rounded-full" />
                      <span className="text-white text-xs">{CHAIN_ID_TO_NAME[chainId]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Estimated Output Box */}
          {estimatedOutput && (
            <div className="mt-3 bg-zinc-950 rounded-xl p-3 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Est. Receive</span>
                <span className="text-white font-medium">{estimatedOutput}</span>
              </div>
            </div>
          )}
        </div>

        {/* Fee Display */}
        {estimatedFee && (
          <div className="flex justify-between items-center text-xs mb-2 px-1">
            <span className="text-gray-500">Total fee</span>
            <span className="text-gray-400">{estimatedFee}</span>
          </div>
        )}

        <button 
          onClick={handleConvert}
          disabled={!canConvert || isLoading}
          className={`w-full font-bold py-4 rounded-full transition-colors ${
            canConvert && !isLoading
              ? 'bg-accent-dynamic text-white hover:brightness-90'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (loadingStatus || 'Processing...') : 'Convert'}
        </button>

        {debugOpen && (
          <div className="fixed inset-0 z-[120] bg-black/70 flex items-end" onClick={() => setDebugOpen(false)}>
            <div className="w-full max-h-[75vh] rounded-t-2xl bg-zinc-950 border-t border-zinc-800 p-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">Convert Debug</div>
                <button onClick={() => setDebugOpen(false)} className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-300">Close</button>
              </div>
              <div className="text-[11px] text-gray-400 mb-2">Suggested chain ids: Base 8453, OP 10, Arbitrum 42161, Solana 101 (UI) / Relay 792703809</div>
              <div className="bg-black/40 border border-zinc-800 rounded p-2 h-[52vh] overflow-auto text-[11px] text-gray-300 space-y-1">
                {debugLogs.length === 0 ? <div className="text-gray-500">No logs yet.</div> : debugLogs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          </div>
        )}
        
        {/* Transaction Result - Spinner/Checkmark Animation */}
        {txResult && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
            <div 
              className="flex flex-col items-center"
              style={{
                animation: txResult.status === 'complete' ? 'fadeOut 0.5s ease-out 2s forwards' : 'none'
              }}
            >
              {txResult.status === 'pending' ? (
                <div className="w-16 h-16 border-4 border-accent-dynamic border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                  <span className="text-white text-3xl">✓</span>
                </div>
              )}
              <p className="text-white mt-4 text-sm">
                {txResult.status === 'pending' ? 'Converting...' : 'Complete!'}
              </p>
            </div>
            <style jsx>{`
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; pointer-events: none; }
              }
            `}</style>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

// Avantis Trading Contract ABI (openTrade + approve)
// Verified from Basescan and official SDK docs
const AVANTIS_TRADING_ABI = [
  {
    name: 'openTrade',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 't',
        type: 'tuple',
        components: [
          { name: 'trader', type: 'address' },
          { name: 'pairIndex', type: 'uint256' },
          { name: 'index', type: 'uint256' },
          { name: 'initialPosToken', type: 'uint256' },
          { name: 'positionSizeUSDC', type: 'uint256' },
          { name: 'openPrice', type: 'uint256' },
          { name: 'buy', type: 'bool' },
          { name: 'leverage', type: 'uint256' },
          { name: 'tp', type: 'uint256' },
          { name: 'sl', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      { name: 'orderType', type: 'uint8' },
      { name: 'slippageP', type: 'uint256' },
    ],
    outputs: [{ name: 'orderId', type: 'uint256' }],
  },
  {
    name: 'closeTradeMarket',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_pairIndex', type: 'uint256' },
      { name: '_index', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [{ name: 'orderId', type: 'uint256' }],
  },
  {
    name: 'updateTpAndSl',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_pairIndex', type: 'uint256' },
      { name: '_index', type: 'uint256' },
      { name: '_newSl', type: 'uint256' },
      { name: '_newTP', type: 'uint256' },
      { name: 'priceUpdateData', type: 'bytes[]' },
      { name: '_priceSourcing', type: 'uint8' },
    ],
    outputs: [],
  },
  // delegatedAction allows smart wallets to execute trades
  // This is how Base App smart wallet works with Avantis
  {
    name: 'delegatedAction',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'trader', type: 'address' },
      { name: 'call_data', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
] as const;

const AVANTIS_TRADING_STORAGE_ABI = [
  {
    name: 'openTradesCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_trader', type: 'address' },
      { name: '_pairIndex', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'openTrades',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_trader', type: 'address' },
      { name: '_pairIndex', type: 'uint256' },
      { name: '_index', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'trader', type: 'address' },
          { name: 'pairIndex', type: 'uint256' },
          { name: 'index', type: 'uint256' },
          { name: 'initialPosToken', type: 'uint256' },
          { name: 'positionSizeUSDC', type: 'uint256' },
          { name: 'openPrice', type: 'uint256' },
          { name: 'buy', type: 'bool' },
          { name: 'leverage', type: 'uint256' },
          { name: 'tp', type: 'uint256' },
          { name: 'sl', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'openTradesInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_trader', type: 'address' },
      { name: '_pairIndex', type: 'uint256' },
      { name: '_index', type: 'uint256' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'openInterestUSDC', type: 'uint256' },
          { name: 'tpLastUpdated', type: 'uint256' },
          { name: 'slLastUpdated', type: 'uint256' },
          { name: 'beingMarketClosed', type: 'bool' },
          { name: 'lossProtection', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

// ERC20 approve ABI for USDC approval
const ERC20_APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Avantis Trading contract on Base mainnet (verified on Basescan)
const AVANTIS_TRADING_ADDRESS = '0x44914408af82bC9983bbb330e3578E1105e11d4e';
const AVANTIS_TRADING_STORAGE_ADDRESS = '0x8a311D7048c35985aa31C131B9A13e03a5f7422d';
// USDC on Base
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
// Cap allowance to 10,000 USDC (6 decimals), never unlimited.
const AVANTIS_APPROVAL_CAP_USDC = BigInt(10_000 * 1_000_000);

/** Alchemy first (higher limits); public Base fallback — browser CORS often blocks private RPCs on gh-pages. */
const DEFAULT_ALCHEMY_BASE_RPC = 'https://base-mainnet.g.alchemy.com/v2/v3bdP1lrHsi275voe1icZ';
const PUBLIC_BASE_RPC = 'https://mainnet.base.org';

function baseRpcEndpoints(): string[] {
  const env = process.env.NEXT_PUBLIC_BASE_RPC_URL;
  if (typeof env === 'string' && env.startsWith('http')) {
    if (env === PUBLIC_BASE_RPC) return [PUBLIC_BASE_RPC];
    return [env, PUBLIC_BASE_RPC];
  }
  return [DEFAULT_ALCHEMY_BASE_RPC, PUBLIC_BASE_RPC];
}

async function callBaseRpc(method: string, params: unknown[]): Promise<{ result?: string; error?: unknown }> {
  let lastErr: unknown = 'all RPC endpoints failed';
  for (const url of baseRpcEndpoints()) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      });
      const j = (await r.json()) as { result?: string; error?: unknown };
      if (typeof j.result === 'string' && j.result.length > 0) return j;
      lastErr = j.error ?? `no result from ${url.split('/').slice(0, 3).join('/')}`;
    } catch (e) {
      lastErr = e;
    }
  }
  return { error: lastErr };
}

// Multicall3 on Base (standard address across all chains)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MULTICALL3_ABI = [
  {
    name: 'aggregate3Value',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'value', type: 'uint256' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      {
        name: 'returnData',
        type: 'tuple[]',
        components: [
          { name: 'success', type: 'bool' },
          { name: 'returnData', type: 'bytes' },
        ],
      },
    ],
  },
] as const;

// On Base, Avantis trade execution (open/close/update) pays the oracle update fee read from this contract.
const AVANTIS_TRADE_FEE_PYTH_ADDRESS = '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a';
const AVANTIS_TRADE_FEE_ABI = [
  {
    name: 'getUpdateFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'updateData', type: 'bytes[]' }],
    outputs: [{ name: 'feeAmount', type: 'uint256' }],
  },
] as const;

// Decimal conventions from Avantis SDK docs:
// - USDC amounts: 6 decimals (100n * 10n**6n = 100 USDC)
// - Prices: 10 decimals (50000n * 10n**10n = $50,000)
// - Leverage: 10 decimals (10n * 10n**10n = 10x)
// - Slippage: 10 decimals (10n**8n = 1%)
// - ETH sent as trade tx `value` (execution / gas for the bundle on Base), 18-decimal wei

// ALL Avantis Perps Markets (from SDK docs)
const BASE_PERPS_MARKETS: Omit<PerpsMarket, 'pairName'>[] = [
  // Crypto (Group 0 & 1)
  { index: 0, symbol: 'BTC', name: 'Bitcoin', maxLeverage: 100, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png', color: '#F7931A', group: 'crypto' },
  { index: 1, symbol: 'ETH', name: 'Ethereum', maxLeverage: 100, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png', color: '#627EEA', group: 'crypto' },
  { index: 2, symbol: 'SOL', name: 'Solana', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png', color: '#9945FF', group: 'crypto' },
  { index: 3, symbol: 'LINK', name: 'Chainlink', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png', color: '#375BD2', group: 'crypto' },
  { index: 4, symbol: 'DOGE', name: 'Dogecoin', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/doge/info/logo.png', color: '#C2A633', group: 'crypto' },
  { index: 5, symbol: 'XRP', name: 'Ripple', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/xrp/info/logo.png', color: '#23292F', group: 'crypto' },
  { index: 6, symbol: 'BNB', name: 'BNB', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png', color: '#F3BA2F', group: 'crypto' },
  { index: 7, symbol: 'ADA', name: 'Cardano', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/cardano/info/logo.png', color: '#0033AD', group: 'crypto' },
  { index: 8, symbol: 'AVAX', name: 'Avalanche', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png', color: '#E84142', group: 'crypto' },
  { index: 9, symbol: 'MATIC', name: 'Polygon', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', color: '#8247E5', group: 'crypto' },
  { index: 10, symbol: 'ARB', name: 'Arbitrum', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', color: '#28A0F0', group: 'crypto' },
  { index: 11, symbol: 'OP', name: 'Optimism', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png', color: '#FF0420', group: 'crypto' },
  { index: 12, symbol: 'NEAR', name: 'NEAR', maxLeverage: 50, logo: 'https://cryptologos.cc/logos/near-protocol-near-logo.png', color: '#00C08B', group: 'crypto' },
  { index: 13, symbol: 'AAVE', name: 'Aave', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png', color: '#B6509E', group: 'crypto' },
  { index: 14, symbol: 'UNI', name: 'Uniswap', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png', color: '#FF007A', group: 'crypto' },
  { index: 15, symbol: 'PEPE', name: 'Pepe', maxLeverage: 25, logo: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg', color: '#479F53', group: 'crypto' },
  { index: 16, symbol: 'WIF', name: 'dogwifhat', maxLeverage: 25, logo: 'https://assets.coingecko.com/coins/images/33566/small/wif.png', color: '#D4A96D', group: 'crypto' },
  { index: 17, symbol: 'SUI', name: 'Sui', maxLeverage: 50, logo: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg', color: '#6FBCF0', group: 'crypto' },
  { index: 18, symbol: 'TRX', name: 'Tron', maxLeverage: 50, logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/info/logo.png', color: '#FF0013', group: 'crypto' },
  // Forex (Group 2)
  { index: 30, symbol: 'EUR', name: 'Euro', maxLeverage: 500, logo: 'https://flagcdn.com/w80/eu.png', color: '#003399', group: 'forex' },
  { index: 31, symbol: 'GBP', name: 'British Pound', maxLeverage: 500, logo: 'https://flagcdn.com/w80/gb.png', color: '#012169', group: 'forex' },
  { index: 32, symbol: 'JPY', name: 'Japanese Yen', maxLeverage: 500, logo: 'https://flagcdn.com/w80/jp.png', color: '#BC002D', group: 'forex' },
  // Commodities (Group 3)
  { index: 20, symbol: 'XAU', name: 'Gold', maxLeverage: 50, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5176.png', color: '#FFD700', group: 'commodities' },
  { index: 21, symbol: 'XAG', name: 'Silver', maxLeverage: 50, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5180.png', color: '#C0C0C0', group: 'commodities' },
];
const PERPS_MARKETS: PerpsMarket[] = BASE_PERPS_MARKETS.map((m) => ({ ...m, pairName: `${m.symbol}/USD` }));

// Legacy format for compatibility
const AVANTIS_PAIRS = PERPS_MARKETS.map(m => ({ 
  index: m.index, 
  name: m.pairName, 
  maxLeverage: m.maxLeverage 
}));
const PERPS_MARKET_SYMBOL_META: Record<string, PerpsMarket> = PERPS_MARKETS.reduce((acc, market) => {
  acc[market.symbol] = market;
  return acc;
}, {} as Record<string, PerpsMarket>);
const DEFAULT_PERPS_MARKET_LOGO = '';

const AVANTIS_SOCKET_API_URL = 'https://socket-api-pub.avantisfi.com/socket-api/v1/data';
/** Same endpoint the official Avantis Trader SDK uses for `priceUpdateData` bytes (core Hermes vs pro Lazer). */
const AVANTIS_FEED_V3_URL = 'https://feed-v3.avantisfi.com';

/** Pyth `getUpdateFee` / ABI encoding expects `0x`-prefixed bytes; Hermes `binary.data` often omits it and the call reverts. */
function normalizeOracleUpdateHex(hex: string): `0x${string}` {
  const t = hex.trim();
  if (t.startsWith('0x') || t.startsWith('0X')) return t as `0x${string}`;
  if (!/^[0-9a-fA-F]+$/.test(t)) throw new Error('Invalid oracle update hex string');
  return `0x${t}` as `0x${string}`;
}
// Leverage/ZFP data source: Avantis Socket API (pairInfos[].leverages).
// Override map for pairs where API returns incorrect values (e.g. AVNT: 10x non-ZFP only per Avantis).
const LEVERAGE_OVERRIDES: Record<string, { standardMax: number; zfpMax: number }> = {
  'AVNT/USD': { standardMax: 10, zfpMax: 0 },
};

const parsePairNameFromSocketSymbol = (symbol: string): string => {
  // Socket symbols are usually "Crypto.ETH/USD", "FX.EUR/USD", etc.
  const dotIndex = symbol.indexOf('.');
  const normalized = dotIndex >= 0 ? symbol.slice(dotIndex + 1).toUpperCase() : symbol.toUpperCase();
  if (normalized === 'USD/JPY') return 'JPY/USD';
  return normalized;
};

const buildPairName = (from?: string, to?: string, socketSymbol?: string): string => {
  const fromNorm = (from || '').toUpperCase().trim();
  const toNorm = (to || '').toUpperCase().trim();
  if (fromNorm && toNorm) {
    if (fromNorm === 'USD' && toNorm === 'JPY') return 'JPY/USD';
    return `${fromNorm}/${toNorm}`;
  }
  return parsePairNameFromSocketSymbol(socketSymbol || '');
};

const inferPerpsGroupFromSocketSymbol = (socketSymbol?: string): PerpsMarketGroup => {
  const prefix = socketSymbol?.split('.', 1)?.[0]?.toUpperCase() || '';
  if (prefix === 'CRYPTO') return 'crypto';
  if (prefix === 'FX') return 'forex';
  if (prefix === 'METAL' || prefix === 'COMMODITIES') return 'commodities';
  if (prefix === 'EQUITY') return 'equity';
  return 'other';
};

const MARKET_NAME_ALIASES: Record<string, string> = {
  AVNT: 'Avantis',
};
const MARKET_LOGO_OVERRIDES: Record<string, string> = {
  AVNT: 'https://coin-images.coingecko.com/coins/images/68972/large/avnt-token.png',
  SPY: 'https://coin-images.coingecko.com/coins/images/68655/large/spyon_160x160.png',
  QQQ: 'https://coin-images.coingecko.com/coins/images/68654/large/qqqon_160x160.png',
  COIN: 'https://coin-images.coingecko.com/coins/images/68612/large/coinon_160x160.png',
  NVDA: 'https://coin-images.coingecko.com/coins/images/68623/large/nvdaon_160x160.png',
  AAPL: 'https://coin-images.coingecko.com/coins/images/68616/large/aaplon_160x160.png',
  AMZN: 'https://coin-images.coingecko.com/coins/images/68604/large/amznon_160x160.png',
  MSFT: 'https://coin-images.coingecko.com/coins/images/68625/large/msfton_160x160.png',
  META: 'https://coin-images.coingecko.com/coins/images/68645/large/metaon_160x160.png',
  TSLA: 'https://coin-images.coingecko.com/coins/images/68628/large/tslaon_160x160.png',
  GOOG: 'https://coin-images.coingecko.com/coins/images/68606/large/googlon_160x160.png',
  HOOD: 'https://coin-images.coingecko.com/coins/images/68581/large/hoodon_160x160.png',
  HYPE: 'https://coin-images.coingecko.com/coins/images/50882/large/hyperliquid.jpg',
  PUMP: 'https://coin-images.coingecko.com/coins/images/67164/large/pump.jpg',
  AERO: 'https://coin-images.coingecko.com/coins/images/31745/large/token.png',
  SHIB: 'https://coin-images.coingecko.com/coins/images/11939/large/shiba.png',
  LIT: 'https://coin-images.coingecko.com/coins/images/13825/large/logo_200x200.png',
  ZRO: 'https://coin-images.coingecko.com/coins/images/28206/large/ftxG9_TJ_400x400.jpeg',
  ASTER: 'https://coin-images.coingecko.com/coins/images/69040/large/_ASTER.png',
  XMR: 'https://coin-images.coingecko.com/coins/images/69/large/monero_logo.png',
  VIRTUAL: 'https://coin-images.coingecko.com/coins/images/34057/large/LOGOMARK.png',
  ZEC: 'https://coin-images.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  ONDO: 'https://coin-images.coingecko.com/coins/images/26580/large/ONDO.png',
  BONK: 'https://coin-images.coingecko.com/coins/images/28600/large/bonk.jpg',
  POL: 'https://coin-images.coingecko.com/coins/images/32440/large/pol.png',
  MON: 'https://coin-images.coingecko.com/coins/images/38927/large/mon.png',
  RENDER: 'https://coin-images.coingecko.com/coins/images/11636/large/rndr.png',
  JUP: 'https://coin-images.coingecko.com/coins/images/34188/large/jup.png',
  PENDLE: 'https://coin-images.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png',
  XAU: 'https://img.icons8.com/color/96/gold-bars.png',
  XAG: 'https://img.icons8.com/color/96/silver-bars.png',
  USOILSPOT: 'https://img.icons8.com/color/96/oil-industry.png',
};
const FOREX_FLAG_BY_SYMBOL: Record<string, string> = {
  USD: 'us',
  EUR: 'eu',
  GBP: 'gb',
  JPY: 'jp',
  CHF: 'ch',
  CAD: 'ca',
  AUD: 'au',
  NZD: 'nz',
  CNY: 'cn',
  HKD: 'hk',
};
const buildTickerLogoDataUri = (symbol: string, color = '#374151') => {
  const safeSymbol = (symbol || '?').toUpperCase().slice(0, 4);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${color}"/>
      <text x="64" y="72" font-family="Arial, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#e5e7eb">${safeSymbol}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const resolveMarketLogo = ({
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
}) => {
  if (staticLogo) return staticLogo;
  const baseSymbol = (fromSymbol || symbol || '').toUpperCase();
  if (dynamicLogo) return dynamicLogo;
  const logoOverride = MARKET_LOGO_OVERRIDES[baseSymbol];
  if (logoOverride) return logoOverride;
  const cachedTokenLogo = TOKEN_LOGOS[baseSymbol];
  if (cachedTokenLogo) return cachedTokenLogo;
  if (group === 'forex') {
    const cc = FOREX_FLAG_BY_SYMBOL[baseSymbol];
    if (cc) return `https://flagcdn.com/w80/${cc}.png`;
  }
  if (group === 'crypto') {
    return `https://cryptoicons.org/api/icon/${baseSymbol.toLowerCase()}/200`;
  }
  return buildTickerLogoDataUri(baseSymbol);
};

const PerpsModal = ({
  isOpen,
  onClose,
  assets,
  universalAccount,
  blindSigningEnabled,
  smartAccountAddress,
  sign7702,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
  smartAccountAddress?: string;
  sign7702: ((p: { contractAddress: `0x${string}`; chainId: number; nonce: number }, o: { address: string }) => Promise<{ r: string; s: string; v?: bigint; yParity: number }>) | null;
  onSuccess?: () => void;
}) => {
  const [primaryWallet] = useWallets();
  const [view, setView] = useState<'markets' | 'trade' | 'deposit' | 'withdraw'>('markets');
  const [selectedMarket, setSelectedMarket] = useState(PERPS_MARKETS[0]);
  const [selectedPair, setSelectedPair] = useState(AVANTIS_PAIRS[0]);
  const [isLong, setIsLong] = useState(true);
  const [leverage, setLeverage] = useState(10);
  const [collateral, setCollateral] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [marketPrices, setMarketPrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [depositMode, setDepositMode] = useState<'usdc_gas' | 'usdc_only' | 'gas_only'>('usdc_gas');
  const [depositStage, setDepositStage] = useState<'idle' | 'usdc' | 'gas'>('idle');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [gasTopUpAmount, setGasTopUpAmount] = useState('0.0007');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [ownerEOA, setOwnerEOA] = useState<string>("");
  const [eoaUsdcBalance, setEoaUsdcBalance] = useState<number>(0);
  const [eoaEthBalance, setEoaEthBalance] = useState<number>(0);
  const [isZeroFeeMode, setIsZeroFeeMode] = useState(false);
  const [pairLeverageLimits, setPairLeverageLimits] = useState<Record<string, PairLeverageLimits>>({});
  const [marketSearch, setMarketSearch] = useState('');
  const [marketGroupFilter, setMarketGroupFilter] = useState<'all' | PerpsMarketGroup | 'zfp'>('all');
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  useEffect(() => {
    setShowAllMarkets(false);
  }, [marketGroupFilter]);
  const [showTpSlInputs, setShowTpSlInputs] = useState(false);
  const [displayOpenPositions, setDisplayOpenPositions] = useState<OpenPerpsPosition[]>([]);
  const [, setPositionsLoading] = useState(false);
  const [dynamicMarketLogos, setDynamicMarketLogos] = useState<Record<string, string>>({});
  const [positionEdits, setPositionEdits] = useState<Record<string, { tp: string; sl: string }>>({});
  const [perpsActivity, setPerpsActivity] = useState<Array<{
    id: string;
    action: string;
    pairName: string;
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  }>>([]);
  const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const AVANTIS_HEADER_LOGO_URL = 'https://1312337203-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F76vAZHPcNKY10NzuKsC4%2Fuploads%2FfM44ZIUWnrYhajk68ioy%2FAvantis%20White%20Logo%20-%20Iconmark.png?alt=media';
  const marketPricesRef = useRef<Record<string, { price: number; change24h: number }>>({});
  const hermesSseSourcesRef = useRef<EventSource[]>([]);
  const previousPositionIdsRef = useRef<Set<string>>(new Set());
  const [showPerpsHistoryModal, setShowPerpsHistoryModal] = useState(false);
  const [showPerpsExplainerModal, setShowPerpsExplainerModal] = useState(false);
  const [perpsExplainerStep, setPerpsExplainerStep] = useState(0);

  const lastDebugAtRef = useRef<Record<string, number>>({});
  // Helper to add debug messages (throttled to keep logs readable)
  const addDebug = (msg: string, throttleMs = 2500) => {
    const now = Date.now();
    const key = msg.slice(0, 120);
    const lastAt = lastDebugAtRef.current[key] || 0;
    if (now - lastAt < throttleMs) return;
    lastDebugAtRef.current[key] = now;
    console.log('[Perps Debug]', msg);
    setDebugLog(prev => [...prev.slice(-30), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };
  const [txResult, setTxResult] = useState<{ txId: string; status: 'pending' | 'complete'; action: 'open' | 'close' | 'update' } | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change'>('volume');
  const selectedPairConfig = pairLeverageLimits[selectedPair.name];
  const executionPairIndex = selectedPairConfig?.pairIndex ?? selectedPair.index;
  const activeLeverageLimits = useMemo(() => {
    const limits = selectedPairConfig;
    const standardMin = limits ? Math.max(2, Math.floor(limits.standardMin)) : 2;
    const standardMax = limits ? Math.max(standardMin, Math.floor(limits.standardMax)) : selectedPair.maxLeverage;
    const zfpMin = limits ? Math.max(2, Math.floor(limits.zfpMin)) : standardMin;
    const zfpMax = limits ? Math.max(zfpMin, Math.floor(limits.zfpMax)) : standardMax;
    return { standardMin, standardMax, zfpMin, zfpMax };
  }, [selectedPairConfig, selectedPair]);
  const zfpAvailable = activeLeverageLimits.zfpMax > 0;
  const leverageMin = isZeroFeeMode ? activeLeverageLimits.zfpMin : activeLeverageLimits.standardMin;
  const leverageMax = isZeroFeeMode ? activeLeverageLimits.zfpMax : activeLeverageLimits.standardMax;
  const formatCompactUsd = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(2);
  };
  const availableMarkets = useMemo<PerpsMarket[]>(() => {
    const dynamicMarkets: PerpsMarket[] = Object.entries(pairLeverageLimits).map(([pairName, limits], idx) => {
      const symbol = (limits.fromSymbol || pairName.split('/')[0] || pairName).toUpperCase();
      const staticMeta = PERPS_MARKET_SYMBOL_META[symbol];
      return {
        index: Number.isFinite(Number(limits.pairIndex)) ? Number(limits.pairIndex) : 1000 + idx,
        symbol,
        name: staticMeta?.name || MARKET_NAME_ALIASES[symbol] || symbol,
        maxLeverage: Math.max(2, Math.floor(limits.standardMax || staticMeta?.maxLeverage || 100)),
        logo: resolveMarketLogo({
          symbol,
          group: limits.group || staticMeta?.group || 'other',
          staticLogo: staticMeta?.logo || DEFAULT_PERPS_MARKET_LOGO,
          fromSymbol: limits.fromSymbol,
          dynamicLogo: dynamicMarketLogos[symbol],
        }),
        color: staticMeta?.color || '#6b7280',
        group: limits.group || staticMeta?.group || 'other',
        pairName,
      };
    });
    return dynamicMarkets.sort((a, b) => {
      if (a.index !== b.index) return a.index - b.index;
      return a.pairName.localeCompare(b.pairName);
    });
  }, [pairLeverageLimits, dynamicMarketLogos]);
  useEffect(() => {
    marketPricesRef.current = marketPrices;
  }, [marketPrices]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('perps_activity_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPerpsActivity(parsed.slice(0, 25));
      }
    } catch {
      // ignore storage parsing issues
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('perps_activity_v1', JSON.stringify(perpsActivity.slice(0, 25)));
    } catch {
      // ignore storage quota issues
    }
  }, [perpsActivity]);
  useEffect(() => {
    if (!isOpen) {
      setShowPerpsHistoryModal(false);
      setShowPerpsExplainerModal(false);
      setPerpsExplainerStep(0);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('perps_market_logo_cache_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed && typeof parsed === 'object') {
        setDynamicMarketLogos(parsed);
      }
    } catch {
      // ignore logo cache parse errors
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const symbolsToFetch = Array.from(new Set(
      availableMarkets
        .filter((m) => m.group === 'crypto')
        .map((m) => m.symbol.toUpperCase())
        .filter((symbol) => !MARKET_LOGO_OVERRIDES[symbol] && !TOKEN_LOGOS[symbol] && !dynamicMarketLogos[symbol])
    ));
    if (symbolsToFetch.length === 0) return;
    let cancelled = false;
    const fetchLogoForSymbol = async (symbol: string) => {
      try {
        const res = await fetch(`${MOBULA_PROXY_BASE}/mobula/api/1/search?input=${encodeURIComponent(symbol)}`);
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const exact = list.find((x: { symbol?: string; logo?: string }) => String(x?.symbol || '').toUpperCase() === symbol);
        const candidate = exact || list[0];
        const logo = typeof candidate?.logo === 'string' ? candidate.logo : '';
        if (!logo || cancelled) return;
        setDynamicMarketLogos((prev) => {
          if (prev[symbol] === logo) return prev;
          const next = { ...prev, [symbol]: logo };
          try {
            localStorage.setItem('perps_market_logo_cache_v1', JSON.stringify(next));
          } catch {
            // ignore storage issues
          }
          return next;
        });
      } catch {
        // ignore individual symbol lookup failures
      }
    };
    (async () => {
      for (let i = 0; i < symbolsToFetch.length; i += 4) {
        await Promise.all(symbolsToFetch.slice(i, i + 4).map(fetchLogoForSymbol));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, availableMarkets, dynamicMarketLogos]);
  useEffect(() => {
    if (!ownerEOA) return;
    try {
      const raw = localStorage.getItem(`perps_positions_v1:${ownerEOA.toLowerCase()}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as OpenPerpsPosition[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDisplayOpenPositions(parsed);
        previousPositionIdsRef.current = new Set(parsed.map((p) => p.id));
      }
    } catch {
      // ignore storage parsing issues
    }
  }, [ownerEOA]);
  useEffect(() => {
    if (!ownerEOA) return;
    try {
      localStorage.setItem(`perps_positions_v1:${ownerEOA.toLowerCase()}`, JSON.stringify(displayOpenPositions));
    } catch {
      // ignore storage quota issues
    }
  }, [ownerEOA, displayOpenPositions]);

  /** Prefer summing per-asset USD so we keep cents when `totalAmountInUSD` is rounded to a whole dollar. */
  const unifiedUaBalance = useMemo(() => {
    const list = (assets?.assets || []) as Array<{ amountInUSD?: number | string }>;
    if (list.length > 0) {
      let sum = 0;
      for (const a of list) {
        const raw = a.amountInUSD;
        const v = typeof raw === 'string' ? parseFloat(raw) : Number(raw || 0);
        if (Number.isFinite(v)) sum += v;
      }
      return sum;
    }
    const t = assets?.totalAmountInUSD as number | string | undefined;
    if (t === undefined || t === null) return 0;
    const n = typeof t === 'string' ? parseFloat(t) : Number(t);
    return Number.isFinite(n) ? n : 0;
  }, [assets]);

  // Available USDC already present on Base inside UA
  const uaBaseUsdcAvailable = useMemo(() => {
    const assetList = (assets?.assets || []) as Array<{
      tokenType?: string;
      symbol?: string;
      amount?: number | string;
      chainAggregation?: Array<{
        amount?: number | string;
        token?: { chainId?: number | string };
      }>;
    }>;

    const usdcAsset = assetList.find((a) => {
      const tokenType = a.tokenType?.toUpperCase();
      const symbol = a.symbol?.toUpperCase();
      return tokenType === "USDC" || symbol === "USDC";
    });
    if (!usdcAsset) return 0;

    const baseEntry = usdcAsset.chainAggregation?.find(
      (c) => Number(c.token?.chainId) === CHAIN_ID.BASE_MAINNET
    );
    if (!baseEntry) return 0;
    const baseAmount =
      typeof baseEntry.amount === "string"
        ? parseFloat(baseEntry.amount)
        : Number(baseEntry.amount || 0);
    return Number.isFinite(baseAmount) ? baseAmount : 0;
  }, [assets]);

  const uaTotalUsdcAvailable = useMemo(() => {
    const assetList = (assets?.assets || []) as Array<{ tokenType?: string; symbol?: string; amount?: number | string }>;
    const usdcAsset = assetList.find((a) => {
      const tokenType = a.tokenType?.toUpperCase();
      const symbol = a.symbol?.toUpperCase();
      return tokenType === "USDC" || symbol === "USDC";
    });
    if (!usdcAsset) return 0;
    const totalAmount =
      typeof usdcAsset.amount === "string"
        ? parseFloat(usdcAsset.amount)
        : Number(usdcAsset.amount || 0);
    return Number.isFinite(totalAmount) ? totalAmount : 0;
  }, [assets]);
  // Perps trades execute from 7702 UA execution wallet; collateral checks/MAX use unified UA USDC.
  const perpsUsdcBalance = Math.max(eoaUsdcBalance, uaBaseUsdcAvailable, uaTotalUsdcAvailable);
  const perpsUnifiedBalance = Math.max(unifiedUaBalance, perpsUsdcBalance);
  const usdcBalance = perpsUnifiedBalance;

  // Calculate position details
  const positionSize = useMemo(() => {
    const col = parseFloat(collateral) || 0;
    return col * leverage;
  }, [collateral, leverage]);

  const liquidationPrice = useMemo(() => {
    if (!currentPrice || !collateral || !leverage) return null;
    // Simplified liq calc: entry ± (entry / leverage) * 0.9
    const liqDistance = (currentPrice / leverage) * 0.9;
    return isLong ? currentPrice - liqDistance : currentPrice + liqDistance;
  }, [currentPrice, collateral, leverage, isLong]);

  // Keep selected market price aligned with shared market feed prices.
  useEffect(() => {
    const live = marketPrices[selectedPair.name]?.price;
    if (Number.isFinite(live) && (live as number) > 0) {
      setCurrentPrice(Number(live));
    }
  }, [marketPrices, selectedPair.name]);

  // One-shot Pyth read if the shared batch has not filled this pair yet (e.g. open modal / pick market).
  useEffect(() => {
    if (!isOpen) return;
    const live = marketPricesRef.current[selectedPair.name]?.price;
    if (Number.isFinite(live) && (live as number) > 0) return;
    const feedId = pairLeverageLimits[selectedPair.name]?.feedId;
    if (!feedId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`);
        const data = await response.json();
        const priceData = data?.parsed?.[0]?.price;
        if (cancelled) return;
        if (priceData?.price && Number.isFinite(Number(priceData.price)) && Number.isFinite(Number(priceData.expo))) {
          const price = Number(priceData.price) * Math.pow(10, Number(priceData.expo));
          if (Number.isFinite(price) && price > 0) setCurrentPrice(price);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedPair.name, pairLeverageLimits]);

  // Real-time marks: Pyth Hermes SSE (same oracle Avantis uses). Pair → feedId comes from Avantis Socket API above.
  useEffect(() => {
    if (!isOpen) return;

    const feedTargets = availableMarkets
      .map((market) => ({
        pairName: market.pairName,
        feedId: pairLeverageLimits[market.pairName]?.feedId,
      }))
      .filter((x): x is { pairName: string; feedId: string } => !!x.feedId);

    if (feedTargets.length === 0) return;

    const normalizeKey = (id: string) => id.replace(/^0x/i, '').toLowerCase();
    const normalizeHermesId = (id: string) => {
      const s = id.trim();
      return s.startsWith('0x') || s.startsWith('0X') ? s : `0x${s}`;
    };

    const feedKeyToPairs = new Map<string, string[]>();
    for (const { pairName, feedId } of feedTargets) {
      const key = normalizeKey(feedId);
      const list = feedKeyToPairs.get(key) || [];
      list.push(pairName);
      feedKeyToPairs.set(key, list);
    }

    const uniqueIds = Array.from(new Set(feedTargets.map((t) => normalizeHermesId(t.feedId))));
    const hermes = new HermesClient('https://hermes.pyth.network/');
    hermesSseSourcesRef.current.forEach((es) => {
      try {
        es.close();
      } catch {
        // ignore
      }
    });
    hermesSseSourcesRef.current = [];
    let cancelled = false;

    const applyParsed = (parsed: unknown) => {
      if (!Array.isArray(parsed)) return;
      const slice: Record<string, { price: number; change24h: number }> = {};
      for (const item of parsed as Array<{ id?: string; price?: { price?: string; expo?: number } }>) {
        const id = typeof item?.id === 'string' ? item.id : '';
        const p = item?.price;
        if (!id || !p || !Number.isFinite(Number(p.price)) || !Number.isFinite(Number(p.expo))) continue;
        const px = Number(p.price) * Math.pow(10, Number(p.expo));
        if (!Number.isFinite(px) || px <= 0) continue;
        const pairNames = feedKeyToPairs.get(normalizeKey(id));
        if (!pairNames) continue;
        for (const pairName of pairNames) {
          slice[pairName] = { price: px, change24h: Number.NaN };
        }
      }
      if (Object.keys(slice).length === 0) return;
      setMarketPrices((prev) => ({ ...prev, ...slice }));
    };

    const openStreams = async () => {
      const chunkSize = 28;
      for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        if (cancelled) return;
        const chunk = uniqueIds.slice(i, i + chunkSize);
        try {
          const es = await hermes.getPriceUpdatesStream(chunk, {
            parsed: true,
            allowUnordered: true,
            benchmarksOnly: false,
            ignoreInvalidPriceIds: true,
          });
          if (cancelled) {
            es.close();
            return;
          }
          es.onmessage = (ev) => {
            try {
              const body = JSON.parse(ev.data as string) as { parsed?: unknown };
              if (body?.parsed) applyParsed(body.parsed);
            } catch {
              // ignore malformed SSE payloads
            }
          };
          es.onerror = () => {
            try {
              es.close();
            } catch {
              // ignore
            }
          };
          hermesSseSourcesRef.current.push(es);
        } catch {
          // chunk failed — others may still connect
        }
      }
    };

    const seedLatest = async () => {
      const batch = 45;
      for (let i = 0; i < uniqueIds.length; i += batch) {
        if (cancelled) return;
        const slice = uniqueIds.slice(i, i + batch);
        try {
          const res = await hermes.getLatestPriceUpdates(slice, {
            parsed: true,
            ignoreInvalidPriceIds: true,
          });
          if (res?.parsed) applyParsed(res.parsed);
        } catch {
          // ignore
        }
      }
    };

    void seedLatest();
    void openStreams();

    return () => {
      cancelled = true;
      for (const es of hermesSseSourcesRef.current) {
        try {
          es.close();
        } catch {
          // ignore
        }
      }
      hermesSseSourcesRef.current = [];
    };
  }, [isOpen, availableMarkets, pairLeverageLimits]);

  // Fetch live leverage limits (including Zero Fee Perps ranges) from Avantis Socket API.
  useEffect(() => {
    let cancelled = false;
    const loadLeverageLimits = async () => {
      if (!isOpen) return;
      try {
        const response = await fetch(AVANTIS_SOCKET_API_URL);
        const json = await response.json();
        const pairInfos = json?.data?.pairInfos as Record<string, unknown> | undefined;
        if (!pairInfos || typeof pairInfos !== 'object') return;

        const limitsMap: Record<string, PairLeverageLimits> = {};
        for (const [pairIndexKey, infoRaw] of Object.entries(pairInfos)) {
          const info = infoRaw as {
            feed?: { feedId?: string; attributes?: { symbol?: string } };
            leverages?: {
              minLeverage?: number;
              maxLeverage?: number;
              pnlMinLeverage?: number;
              pnlMaxLeverage?: number;
            };
            pairOI?: number;
            pairMaxOI?: number;
            from?: string;
            to?: string;
            lazerFeed?: { state?: string };
          };
          const symbol = info.feed?.attributes?.symbol;
          const leverages = info.leverages;
          if (!leverages) continue;
          const parsedPairIndex = Number(pairIndexKey);

          const pairName = buildPairName(info.from, info.to, symbol);
          if (!pairName || !pairName.includes('/')) continue;
          const standardMin = Number(leverages.minLeverage ?? 2);
          const standardMax = Number(leverages.maxLeverage ?? 0);
          const zfpMin = Number(leverages.pnlMinLeverage ?? standardMin);
          const zfpMax = Number(leverages.pnlMaxLeverage ?? standardMax);
          if (!Number.isFinite(standardMax) || standardMax <= 0) continue;

          const override = LEVERAGE_OVERRIDES[pairName];
          const finalStandardMax = override ? override.standardMax : standardMax;
          const finalZfpMax = override ? override.zfpMax : (Number.isFinite(zfpMax) && zfpMax > 0 ? zfpMax : standardMax);

          limitsMap[pairName] = {
            pairIndex: Number.isFinite(parsedPairIndex) ? parsedPairIndex : undefined,
            standardMin: Number.isFinite(standardMin) && standardMin > 0 ? standardMin : 2,
            standardMax: finalStandardMax,
            zfpMin: Number.isFinite(zfpMin) && zfpMin > 0 ? zfpMin : standardMin,
            zfpMax: finalZfpMax,
            pairOI: Number.isFinite(Number(info.pairOI)) ? Number(info.pairOI) : 0,
            pairMaxOI: Number.isFinite(Number(info.pairMaxOI)) ? Number(info.pairMaxOI) : 0,
            feedId: typeof info.feed?.feedId === 'string' ? info.feed.feedId : undefined,
            lazerProEnabled: info.lazerFeed?.state === 'stable',
            socketSymbol: symbol,
            group: inferPerpsGroupFromSocketSymbol(symbol),
            fromSymbol: (info.from || '').toUpperCase() || undefined,
            toSymbol: (info.to || '').toUpperCase() || undefined,
            displayName: (info.from && info.to) ? `${info.from}/${info.to}` : undefined,
          };
        }

        if (!cancelled && Object.keys(limitsMap).length > 0) {
          setPairLeverageLimits(limitsMap);
        }
      } catch (e) {
        addDebug(`Avantis Socket pair limits fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    loadLeverageLimits();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isZeroFeeMode && !zfpAvailable) {
      setIsZeroFeeMode(false);
    }
  }, [isZeroFeeMode, zfpAvailable]);

  useEffect(() => {
    setLeverage((prev) => {
      if (prev < leverageMin) return leverageMin;
      if (prev > leverageMax) return leverageMax;
      return prev;
    });
  }, [leverageMin, leverageMax]);
  useEffect(() => {
    if (availableMarkets.length === 0) return;
    const stillExists = availableMarkets.some((m) => m.pairName === selectedMarket.pairName);
    if (!stillExists) {
      const nextMarket = availableMarkets[0];
      setSelectedMarket(nextMarket);
      setSelectedPair({
        index: nextMarket.index,
        name: nextMarket.pairName,
        maxLeverage: nextMarket.maxLeverage,
      });
    }
  }, [availableMarkets, selectedMarket.pairName]);

  const fetchOwnerBalances = useCallback(async (eoa: string) => {
    const [ethRes, usdcRes] = await Promise.all([
      callBaseRpc('eth_getBalance', [eoa, 'latest']),
      callBaseRpc('eth_call', [
        {
          to: BASE_USDC_ADDRESS,
          data: encodeFunctionData({
            abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [eoa as `0x${string}`],
          }),
        },
        'latest',
      ]),
    ]);

    const eth = ethRes.result ? Number(BigInt(ethRes.result)) / 1e18 : 0;
    const usdc = usdcRes.result ? Number(BigInt(usdcRes.result)) / 1e6 : 0;
    return { eth, usdc };
  }, [BASE_USDC_ADDRESS]);
  const refreshOwnerBalances = useCallback(async (targetEoa?: string) => {
    const eoa = (targetEoa || ownerEOA || '').trim();
    if (!eoa) return;
    try {
      const { eth, usdc } = await fetchOwnerBalances(eoa);
      setEoaEthBalance(eth);
      setEoaUsdcBalance(usdc);
    } catch {
      // ignore transient RPC failures
    }
  }, [ownerEOA, fetchOwnerBalances]);

  // Resolve Perps execution wallet (7702 UA smart account) and balances
  useEffect(() => {
    const loadExecutionWallet = async () => {
      if (!isOpen) return;
      try {
        const execution = (smartAccountAddress || '').trim();
        setOwnerEOA(execution);
        if (!execution) return;
        await refreshOwnerBalances(execution);
      } catch {
        // ignore
      }
    };
    loadExecutionWallet();
  }, [isOpen, smartAccountAddress, refreshOwnerBalances]);
  useEffect(() => {
    if (!isOpen || !ownerEOA) return;
    const t = setInterval(() => {
      refreshOwnerBalances();
    }, 10000);
    return () => clearInterval(t);
  }, [isOpen, ownerEOA, refreshOwnerBalances]);

  const handleSelectMarket = (market: PerpsMarket) => {
    setSelectedMarket(market);
    const pair = AVANTIS_PAIRS.find(p => p.name === market.pairName);
    if (pair) {
      setSelectedPair(pair);
    } else {
      setSelectedPair({
        index: market.index,
        name: market.pairName,
        maxLeverage: market.maxLeverage,
      });
    }
    setView('trade');
  };

  const baseRpcCall = useCallback(async (method: string, params: unknown[]) => {
    const j = await callBaseRpc(method, params);
    if (process.env.NODE_ENV === 'development' && j.error) {
      console.warn('[Base RPC]', method, j.error);
    }
    return j.result;
  }, []);
  const waitForBaseReceipt = useCallback(async (txHash: string) => {
    for (let i = 0; i < 40; i++) {
      const receipt = await baseRpcCall('eth_getTransactionReceipt', [txHash]);
      if (receipt) return receipt;
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Transaction confirmation timeout');
  }, [baseRpcCall]);
  const upsertPerpsActivity = useCallback((entry: {
    id: string;
    action: string;
    pairName: string;
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  }) => {
    setPerpsActivity((prev) => {
      const idx = prev.findIndex((x) => x.id === entry.id);
      const next = [...prev];
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...entry };
      } else {
        next.unshift(entry);
      }
      return next.slice(0, 25);
    });
  }, []);

  /** UA expectTokens ETH must cover msg.value to Avantis + 7702/bundler gas; Number(wei) loses precision. */
  const perpsUaEthExpectAmount = useCallback((executionFeeWei: bigint) => {
    const bufferWei = parseEther('0.00035');
    return formatEther(executionFeeWei + bufferWei);
  }, []);

  /**
   * Price update bytes for on-chain calls — same source as the official Avantis Trader SDK (`feed-v3` API).
   * `priceSourcing`: 0 = Hermes (core), 1 = Pyth Pro / Lazer when the pair has stable Lazer in Socket API.
   */
  const fetchAvantisPriceUpdatePayload = useCallback(
    async (pairName: string) => {
      const pairIndex = pairLeverageLimits[pairName]?.pairIndex;
      if (!Number.isFinite(pairIndex)) throw new Error(`Missing Avantis pair index for ${pairName}`);
      const res = await fetch(`${AVANTIS_FEED_V3_URL}/v2/pairs/${pairIndex}/price-update-data`);
      if (!res.ok) throw new Error(`Avantis price-update-data request failed (${res.status})`);
      const json = (await res.json()) as {
        core?: { priceUpdateData?: string };
        pro?: { priceUpdateData?: string } | null;
      };
      const usePro = pairLeverageLimits[pairName]?.lazerProEnabled === true && typeof json.pro?.priceUpdateData === 'string';
      const raw = usePro ? json.pro!.priceUpdateData! : json.core?.priceUpdateData;
      if (!raw || typeof raw !== 'string') throw new Error(`No price update payload from Avantis for ${pairName}`);
      const priceSourcing = usePro ? 1 : 0;
      return {
        updateData: [normalizeOracleUpdateHex(raw)] as `0x${string}`[],
        priceSourcing: priceSourcing as 0 | 1,
      };
    },
    [pairLeverageLimits],
  );

  /**
   * Wei for `msg.value` on Avantis trades: oracle payload → Pyth `getUpdateFee` on Base (+20% margin).
   * Same for open / close / TP-SL. Bytes should come from Avantis feed-v3 (SDK-aligned) or be normalized hex.
   */
  const resolveAvantisTradeExecutionFeeWei = useCallback(
    async (pairName: string, updateData?: `0x${string}`[]) => {
      const bytes =
        updateData && updateData.length > 0
          ? updateData.map((b) => normalizeOracleUpdateHex(b))
          : (await fetchAvantisPriceUpdatePayload(pairName)).updateData;
      if (!bytes.length) throw new Error('Missing price update payload; cannot compute trade execution fee.');
      const calldata = encodeFunctionData({
        abi: AVANTIS_TRADE_FEE_ABI,
        functionName: 'getUpdateFee',
        args: [bytes],
      });
      const feeResp = await callBaseRpc('eth_call', [{ to: AVANTIS_TRADE_FEE_PYTH_ADDRESS, data: calldata }, 'latest']);
      const feeHex = feeResp.result;
      if (!feeHex) {
        const errMsg =
          typeof feeResp.error === 'object' && feeResp.error !== null && 'message' in feeResp.error
            ? String((feeResp.error as { message?: string }).message)
            : JSON.stringify(feeResp.error ?? 'unknown');
        throw new Error(`Could not read trade ETH (value/gas) quote on Base: ${errMsg}`);
      }
      const raw = BigInt(feeHex);
      return (raw * BigInt(120)) / BigInt(100);
    },
    [fetchAvantisPriceUpdatePayload],
  );

  const fetchOpenPositions = useCallback(async () => {
    addDebug('Positions: refresh start', 2000);
    if (!ownerEOA) {
      setDisplayOpenPositions([]);
      previousPositionIdsRef.current = new Set();
      return;
    }
    setPositionsLoading(true);
    try {
      const marketsWithPair = availableMarkets
        .map((m) => ({ market: m, pairIndex: pairLeverageLimits[m.pairName]?.pairIndex }))
        .filter((x): x is { market: PerpsMarket; pairIndex: number } => Number.isFinite(x.pairIndex as number));

      if (marketsWithPair.length === 0) {
        addDebug('Positions: no Avantis pair metadata yet', 5000);
        return;
      }

      const countCalls = marketsWithPair.map(({ pairIndex }) => ({
        target: AVANTIS_TRADING_STORAGE_ADDRESS as `0x${string}`,
        allowFailure: true,
        value: BigInt(0),
        callData: encodeFunctionData({
          abi: AVANTIS_TRADING_STORAGE_ABI,
          functionName: 'openTradesCount',
          args: [ownerEOA as `0x${string}`, BigInt(pairIndex)],
        }),
      }));

      const countData = encodeFunctionData({
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3Value',
        args: [countCalls],
      });
      const countHex = await baseRpcCall('eth_call', [{ to: MULTICALL3_ADDRESS, data: countData }, 'latest']);
      if (!countHex) throw new Error('Multicall counts returned empty');
      const countResults = decodeFunctionResult({
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3Value',
        data: countHex as `0x${string}`,
      }) as Array<{ success: boolean; returnData: `0x${string}` }>;

      const tradeKeys: Array<{ pairName: string; pairIndex: number; idx: number; symbol: string }> = [];
      marketsWithPair.forEach(({ market, pairIndex }, i) => {
        const r = countResults[i];
        if (!r?.success) return;
        const n = Number(BigInt(r.returnData || '0x0'));
        if (!Number.isFinite(n) || n <= 0) return;
        const scan = Math.min(12, Math.max(3, n * 2));
        for (let idx = 0; idx < scan; idx++) tradeKeys.push({ pairName: market.pairName, pairIndex, idx, symbol: market.symbol });
      });

      if (tradeKeys.length === 0) {
        setDisplayOpenPositions([]);
        previousPositionIdsRef.current = new Set();
        addDebug('Positions: 0 open');
        return;
      }

      const tradeCalls = tradeKeys.map((k) => ({
        target: AVANTIS_TRADING_STORAGE_ADDRESS as `0x${string}`,
        allowFailure: true,
        value: BigInt(0),
        callData: encodeFunctionData({
          abi: AVANTIS_TRADING_STORAGE_ABI,
          functionName: 'openTrades',
          args: [ownerEOA as `0x${string}`, BigInt(k.pairIndex), BigInt(k.idx)],
        }),
      }));
      const tradeData = encodeFunctionData({ abi: MULTICALL3_ABI, functionName: 'aggregate3Value', args: [tradeCalls] });
      const tradeHex = await baseRpcCall('eth_call', [{ to: MULTICALL3_ADDRESS, data: tradeData }, 'latest']);
      if (!tradeHex) throw new Error('Multicall trades returned empty');
      const tradeResults = decodeFunctionResult({ abi: MULTICALL3_ABI, functionName: 'aggregate3Value', data: tradeHex as `0x${string}` }) as Array<{ success: boolean; returnData: `0x${string}` }>;

      const found: Array<{ key: typeof tradeKeys[number]; trade: { trader: `0x${string}`; index: bigint; initialPosToken: bigint; positionSizeUSDC: bigint; openPrice: bigint; buy: boolean; leverage: bigint; tp: bigint; sl: bigint; timestamp: bigint; } }> = [];
      tradeResults.forEach((r, i) => {
        if (!r?.success) return;
        const key = tradeKeys[i];
        const trade = decodeFunctionResult({ abi: AVANTIS_TRADING_STORAGE_ABI, functionName: 'openTrades', data: r.returnData }) as { trader: `0x${string}`; index: bigint; initialPosToken: bigint; positionSizeUSDC: bigint; openPrice: bigint; buy: boolean; leverage: bigint; tp: bigint; sl: bigint; timestamp: bigint; };
        if (!trade || trade.trader.toLowerCase() === '0x0000000000000000000000000000000000000000') return;
        found.push({ key, trade });
      });

      const infoCalls = found.map(({ key, trade }) => ({
        target: AVANTIS_TRADING_STORAGE_ADDRESS as `0x${string}`,
        allowFailure: true,
        value: BigInt(0),
        callData: encodeFunctionData({
          abi: AVANTIS_TRADING_STORAGE_ABI,
          functionName: 'openTradesInfo',
          args: [ownerEOA as `0x${string}`, BigInt(key.pairIndex), trade.index],
        }),
      }));
      const infoData = encodeFunctionData({ abi: MULTICALL3_ABI, functionName: 'aggregate3Value', args: [infoCalls] });
      const infoHex = await baseRpcCall('eth_call', [{ to: MULTICALL3_ADDRESS, data: infoData }, 'latest']);
      if (!infoHex) throw new Error('Multicall infos returned empty');
      const infoResults = decodeFunctionResult({ abi: MULTICALL3_ABI, functionName: 'aggregate3Value', data: infoHex as `0x${string}` }) as Array<{ success: boolean; returnData: `0x${string}` }>;

      const positions: OpenPerpsPosition[] = [];
      const cyclePythPrices: Record<string, number> = {};
      found.forEach(({ key, trade }, i) => {
        const info = infoResults[i]?.success
          ? decodeFunctionResult({ abi: AVANTIS_TRADING_STORAGE_ABI, functionName: 'openTradesInfo', data: infoResults[i].returnData }) as { beingMarketClosed: boolean }
          : { beingMarketClosed: false };

        const leverageNum = Number(trade.leverage) / 1e10;
        const collateralUsd = Number(trade.initialPosToken) / 1e6;
        if (!Number.isFinite(collateralUsd) || collateralUsd <= 0) return;
        const sizeUsd = collateralUsd * Math.max(leverageNum, 0);
        const entryPrice = Number(trade.openPrice) / 1e10;

        let markPrice = marketPricesRef.current[key.pairName]?.price;
        if (!Number.isFinite(markPrice) || (markPrice as number) <= 0) {
          if (Number.isFinite(cyclePythPrices[key.pairName])) markPrice = cyclePythPrices[key.pairName];
          else {
            const feedId = pairLeverageLimits[key.pairName]?.feedId;
            if (feedId) {
              // best-effort direct Pyth read for this pair
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`).then(r=>r.json()).then(j=>{
                const parsed = j?.parsed?.[0]?.price;
                if (parsed?.price && Number.isFinite(Number(parsed.price)) && Number.isFinite(Number(parsed.expo))) {
                  const p = Number(parsed.price) * Math.pow(10, Number(parsed.expo));
                  if (Number.isFinite(p) && p > 0) cyclePythPrices[key.pairName] = p;
                }
              }).catch(()=>{});
            }
          }
        }
        const safeMark = Number.isFinite(markPrice) && (markPrice as number) > 0 ? Number(markPrice) : entryPrice;
        const pnlUsd = trade.buy ? ((safeMark - entryPrice) / Math.max(entryPrice, 1e-9)) * sizeUsd : ((entryPrice - safeMark) / Math.max(entryPrice, 1e-9)) * sizeUsd;
        const pnlPercent = collateralUsd > 0 ? (pnlUsd / collateralUsd) * 100 : 0;
        const liqDistance = (entryPrice / Math.max(leverageNum, 1e-9)) * 0.9;
        const liquidationPrice = trade.buy ? entryPrice - liqDistance : entryPrice + liqDistance;
        positions.push({
          id: `${key.pairIndex}-${Number(trade.index)}`,
          pairName: key.pairName,
          symbol: key.symbol,
          pairIndex: key.pairIndex,
          positionIndex: Number(trade.index),
          isLong: trade.buy,
          collateralUsd,
          sizeUsd,
          leverage: leverageNum,
          entryPrice,
          markPrice: safeMark,
          pnlUsd,
          pnlPercent,
          liquidationPrice,
          beingMarketClosed: !!info?.beingMarketClosed,
          tpPrice: Number(trade.tp) > 0 ? Number(trade.tp) / 1e10 : 0,
          slPrice: Number(trade.sl) > 0 ? Number(trade.sl) / 1e10 : 0,
          timestamp: Number(trade.timestamp),
        });
      });

      positions.sort((a, b) => b.timestamp - a.timestamp);
      previousPositionIdsRef.current = new Set(positions.map((p) => p.id));
      addDebug(`Positions: ${positions.length} open`);
      setDisplayOpenPositions(positions);
      setPositionEdits((prev) => {
        const next = { ...prev };
        for (const pos of positions) {
          if (!next[pos.id]) next[pos.id] = { tp: pos.tpPrice > 0 ? pos.tpPrice.toString() : '', sl: pos.slPrice > 0 ? pos.slPrice.toString() : '' };
        }
        return next;
      });
    } catch (e) {
      addDebug(`Positions fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPositionsLoading(false);
    }
  }, [ownerEOA, pairLeverageLimits, baseRpcCall, availableMarkets]);

  useEffect(() => {
    if (!isOpen || !ownerEOA) return;
    fetchOpenPositions();
    const t = setInterval(fetchOpenPositions, 5000);
    return () => clearInterval(t);
  }, [isOpen, ownerEOA, fetchOpenPositions]);

  useEffect(() => {
    setDisplayOpenPositions((prev) => prev.map((pos) => {
      const live = marketPricesRef.current[pos.pairName]?.price;
      if (!Number.isFinite(live) || (live as number) <= 0) return pos;
      const markPrice = Number(live);
      const pnlUsd = pos.isLong
        ? ((markPrice - pos.entryPrice) / Math.max(pos.entryPrice, 1e-9)) * pos.sizeUsd
        : ((pos.entryPrice - markPrice) / Math.max(pos.entryPrice, 1e-9)) * pos.sizeUsd;
      const pnlPercent = pos.collateralUsd > 0 ? (pnlUsd / pos.collateralUsd) * 100 : 0;
      return { ...pos, markPrice, pnlUsd, pnlPercent };
    }));
  }, [marketPrices]);

  const handleDepositToEOA = async () => {
    if (!universalAccount || !primaryWallet || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Funding 7702 execution wallet...');
    addDebug(`Deposit start -> 7702 execution wallet ${ownerEOA}`);

    try {
      const amount = parseFloat(depositAmount.trim());
      const ethTarget = parseFloat(gasTopUpAmount.trim());
      const shouldFundUsdc = depositMode !== 'gas_only';
      const shouldFundEth = depositMode !== 'usdc_only';
      if (shouldFundUsdc && (!Number.isFinite(amount) || amount <= 0)) {
        throw new Error('Enter a valid USDC amount for this mode.');
      }
      if (shouldFundEth && (!Number.isFinite(ethTarget) || ethTarget <= 0)) {
        throw new Error('Enter a valid ETH gas top-up amount for this mode.');
      }
      const walletClient = primaryWallet.getWalletClient();
      const latestAssets = assets;
      const getBaseTokenAvailable = (tokenSymbol: 'USDC' | 'ETH') => {
        const assetList = (((latestAssets as unknown) as { assets?: unknown[] })?.assets || []) as Array<{
          tokenType?: string;
          symbol?: string;
          amount?: number | string;
          chainAggregation?: Array<{
            amount?: number | string;
            token?: { chainId?: number | string };
          }>;
        }>;
        const match = assetList.find((a) => {
          const tokenType = a.tokenType?.toUpperCase();
          const symbol = a.symbol?.toUpperCase();
          return tokenType === tokenSymbol || symbol === tokenSymbol;
        });
        if (!match) return 0;
        const baseEntry = match.chainAggregation?.find(
          (c) => Number(c.token?.chainId) === CHAIN_ID.BASE_MAINNET
        );
        if (baseEntry) {
          const baseAmount =
            typeof baseEntry.amount === 'string'
              ? parseFloat(baseEntry.amount)
              : Number(baseEntry.amount || 0);
          return Number.isFinite(baseAmount) ? baseAmount : 0;
        }
        const totalAmount =
          typeof match.amount === 'string'
            ? parseFloat(match.amount)
            : Number(match.amount || 0);
        return Number.isFinite(totalAmount) ? totalAmount : 0;
      };
      const currentBaseUsdcAvailable = getBaseTokenAvailable('USDC');
      const currentBaseEthAvailable = getBaseTokenAvailable('ETH');
      addDebug(`UA Base balances -> USDC: ${currentBaseUsdcAvailable.toFixed(4)}, ETH: ${currentBaseEthAvailable.toFixed(6)}`);

      const sendWithExpiryRetry = async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildTx: () => Promise<any>,
        label: string,
      ) => {
        let lastErr: unknown;
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            setLoadingStatus(`${label} (${attempt}/4)...`);
            addDebug(`${label} attempt ${attempt}`);
            const tx = await buildTx();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rootHash = (tx as any).rootHash as `0x${string}`;
            if (!rootHash) {
              throw new Error(`${label} missing rootHash`);
            }
            // Match ConvertModal flow for UA signing compatibility.
            const signature = await signUniversalRootHash({
              walletClient: walletClient as unknown as WalletClientLike,
              rootHash,
              signerAddress: ownerEOA as `0x${string}`,
              blindSigningEnabled,
            });
            if (!sign7702 || !ownerEOA) throw new Error('Wallet signing not available');
            const authorizations = await build7702Authorizations(tx, sign7702, ownerEOA);
            const res = await universalAccount.sendTransaction(tx, signature as string, authorizations);
            addDebug(`${label} sent: ${res?.transactionId || 'txid-missing'}`);
            return res;
          } catch (e) {
            lastErr = e;
            const msg = e instanceof Error ? e.message : String(e);
            addDebug(`${label} failed: ${msg}`);
            const expired = msg.toLowerCase().includes('expired');
            if (!(expired && attempt < 4)) throw e;
            addDebug(`${label} expired, rebuilding...`);
            await new Promise(r => setTimeout(r, 400));
          }
        }
        throw lastErr;
      };

      // 1) USDC funding path (optional)
      if (shouldFundUsdc) {
        setDepositStage('usdc');
        setLoadingStatus('Preparing USDC funding...');
        const usdcShortfall = Math.max(0, amount - currentBaseUsdcAvailable);
        if (usdcShortfall > 0.000001) {
          addDebug(`Base USDC in UA: ${currentBaseUsdcAvailable.toFixed(4)}. Converting shortfall: ${usdcShortfall.toFixed(4)} USDC`);
          await sendWithExpiryRetry(
            () => universalAccount.createConvertTransaction({
              expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: usdcShortfall.toString() },
              chainId: CHAIN_ID.BASE_MAINNET,
            }),
            'Convert missing USDC to Base',
          );
        } else {
          addDebug(`Sufficient Base USDC already in UA (${currentBaseUsdcAvailable.toFixed(4)}). Skipping USDC convert step`);
        }

        await sendWithExpiryRetry(
          () => universalAccount.createTransferTransaction({
            token: { chainId: CHAIN_ID.BASE_MAINNET, address: BASE_USDC_ADDRESS },
            amount: amount.toString(),
            receiver: ownerEOA,
          }),
          'Transfer USDC to 7702 execution wallet',
        );
      } else {
        addDebug('USDC deposit amount not set. Skipping USDC funding step');
      }

      // 2) ETH gas top-up path (optional and can run independently)
      if (shouldFundEth) {
        setDepositStage('gas');
        setLoadingStatus('Preparing ETH gas top-up...');
        const ethShortfall = Math.max(0, ethTarget - currentBaseEthAvailable);
        if (ethShortfall > 0.00000001) {
          addDebug(`Base ETH in UA: ${currentBaseEthAvailable.toFixed(6)}. Converting shortfall: ${ethShortfall.toFixed(6)} ETH`);
          await sendWithExpiryRetry(
            () => universalAccount.createConvertTransaction({
              expectToken: { type: SUPPORTED_TOKEN_TYPE.ETH, amount: ethShortfall.toString() },
              chainId: CHAIN_ID.BASE_MAINNET,
            }),
            'Convert to Base ETH',
          );
        } else {
          addDebug(`Sufficient Base ETH already in UA (${currentBaseEthAvailable.toFixed(6)}). Skipping ETH convert step`);
        }

        await sendWithExpiryRetry(
          () => universalAccount.createUniversalTransaction({
            chainId: CHAIN_ID.BASE_MAINNET,
            expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.ETH, amount: ethTarget.toString() }],
            transactions: [{ to: ownerEOA as `0x${string}`, data: '0x', value: toBeHex(BigInt(Math.floor(ethTarget * 1e18))) }],
          }),
          'Transfer ETH to 7702 execution wallet',
        );
      } else {
        addDebug('ETH gas top-up amount not set. Skipping ETH funding step');
      }

      const updated = await fetchOwnerBalances(ownerEOA);
      setEoaUsdcBalance(updated.usdc);
      setEoaEthBalance(updated.eth);
      setLoadingStatus('Deposit complete');
      addDebug('Deposit complete');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Deposit failed';
      addDebug(`Deposit error: ${msg}`);
      setError(msg);
    } finally {
      setDepositStage('idle');
      setIsLoading(false);
      setTimeout(() => setLoadingStatus(''), 1200);
    }
  };

  const handleWithdrawToUA = async () => {
    if (!primaryWallet || !ownerEOA || !smartAccountAddress) {
      setError('Connect wallet and ensure UA is ready');
      return;
    }
    const amt = parseFloat(withdrawAmount.trim());
    if (!Number.isFinite(amt) || amt <= 0 || amt > eoaUsdcBalance) {
      setError('Enter a valid amount within your EOA balance');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Switching to Base...');
    try {
      const walletClient = primaryWallet.getWalletClient();
      if (!walletClient) throw new Error('Wallet not connected');
      try {
        await walletClient.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      } catch {
        addDebug('Chain switch skipped (may already be on Base)');
      }
      setLoadingStatus('Sending USDC to UA...');
      const amountWei = BigInt(Math.floor(amt * 1e6));
      const transferData = encodeFunctionData({
        abi: [{ name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const,
        functionName: 'transfer',
        args: [smartAccountAddress as `0x${string}`, amountWei],
      });
      const txHash = await walletClient.request({
        method: 'eth_sendTransaction',
        params: [{
          from: ownerEOA as `0x${string}`,
          to: BASE_USDC_ADDRESS as `0x${string}`,
          data: transferData,
        }],
      });
      addDebug(`Withdraw tx: ${txHash}`);
      setLoadingStatus('Confirming...');
      await waitForBaseReceipt(txHash as string);
      await refreshOwnerBalances();
      setWithdrawAmount('');
      setView('markets');
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Withdraw failed';
      setError(msg);
      addDebug(`Withdraw error: ${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleOpenPosition = async () => {
    if (!universalAccount || !collateral) {
      setError('Please enter collateral amount');
      return;
    }
    if (!primaryWallet) {
      setError('Please connect wallet first');
      return;
    }
    if (!ownerEOA) {
      setError('Perps execution wallet not ready yet');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Preparing position...');
    setTxResult(null);
    setDebugLog([]);

    try {
      const collateralAmount = parseFloat(collateral);
      const tpPrice = takeProfit ? parseFloat(takeProfit) : 0;
      const slPrice = stopLoss ? parseFloat(stopLoss) : 0;
      if (isZeroFeeMode && !zfpAvailable) throw new Error(`Zero Fee Perps is not available for ${selectedPair.name} right now.`);
      if (leverage < leverageMin || leverage > leverageMax) throw new Error(`Leverage for ${selectedPair.name} must be between ${leverageMin}x and ${leverageMax}x${isZeroFeeMode ? ' in Zero Fee mode' : ''}.`);

      const positionValue = collateralAmount * leverage;
      if (positionValue < 100) throw new Error(`Position too small. Minimum is $100. You have $${positionValue.toFixed(0)} ($${collateralAmount} × ${leverage}x).`);

      const openPriceScaled = BigInt(Math.floor((currentPrice || 0) * 1e10));
      const leverageScaled = BigInt(Math.floor(leverage * 1e10));
      const positionSizeUSDC = BigInt(Math.floor(collateralAmount * 1e6));
      const tpScaled = tpPrice > 0 ? BigInt(Math.floor(tpPrice * 1e10)) : BigInt(0);
      const slScaled = slPrice > 0 ? BigInt(Math.floor(slPrice * 1e10)) : BigInt(0);
      const slippageP = BigInt(1e8);
      const executionFee = await resolveAvantisTradeExecutionFeeWei(selectedPair.name);

      const orderTypeValue = isZeroFeeMode ? 3 : 0;
      const openTradeCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: 'openTrade',
        args: [{
          trader: ownerEOA as `0x${string}`,
          pairIndex: BigInt(executionPairIndex),
          index: BigInt(0),
          initialPosToken: BigInt(0),
          positionSizeUSDC,
          openPrice: openPriceScaled,
          buy: isLong,
          leverage: leverageScaled,
          tp: tpScaled,
          sl: slScaled,
          timestamp: BigInt(0),
        }, orderTypeValue, slippageP],
      });

      const approveSpenders = [AVANTIS_TRADING_ADDRESS as `0x${string}`, AVANTIS_TRADING_STORAGE_ADDRESS as `0x${string}`];
      const uaTx = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        expectTokens: [
          { type: SUPPORTED_TOKEN_TYPE.USDC, amount: collateralAmount.toString() },
          { type: SUPPORTED_TOKEN_TYPE.ETH, amount: perpsUaEthExpectAmount(executionFee) },
        ],
        transactions: [
          ...approveSpenders.map((spender) => ({
            to: BASE_USDC_ADDRESS as `0x${string}`,
            data: encodeFunctionData({ abi: ERC20_APPROVE_ABI, functionName: 'approve', args: [spender, AVANTIS_APPROVAL_CAP_USDC] }),
            value: '0x0',
          })),
          { to: AVANTIS_TRADING_ADDRESS as `0x${string}`, data: openTradeCalldata, value: `0x${executionFee.toString(16)}` },
        ],
      });

      const walletClient = primaryWallet.getWalletClient() as unknown as WalletClientLike;
      const signerAddress = walletClient?.account?.address as `0x${string}` | undefined;
      if (!signerAddress) throw new Error('Wallet signer unavailable');
      const rootHash = (uaTx as { rootHash?: `0x${string}` }).rootHash;
      if (!rootHash) throw new Error('Perps transaction missing rootHash');
      const signature = await signUniversalRootHash({ walletClient, rootHash, signerAddress, blindSigningEnabled, addDebug });
      if (!sign7702) throw new Error('7702 signing not available');
      const authorizations = await build7702Authorizations(uaTx, sign7702, signerAddress);
      setLoadingStatus('Opening position...');
      const sendRes = await universalAccount.sendTransaction(uaTx, signature as string, authorizations);
      const txHash = sendRes?.transactionId || 'pending';

      upsertPerpsActivity({ id: `open-${txHash}`, action: 'Open', pairName: selectedPair.name, txHash, status: 'pending', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'pending', action: 'open' });
      if (txHash !== 'pending') {
        const receipt = await waitForBaseReceipt(txHash) as unknown as { status?: string };
        if (receipt?.status !== '0x1') throw new Error(`OpenTrade failed onchain. status=${receipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({ id: `open-${txHash}`, action: 'Open', pairName: selectedPair.name, txHash, status: 'confirmed', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'complete', action: 'open' });
      await fetchOpenPositions();
      await refreshOwnerBalances();
      setCollateral('');
      setTakeProfit('');
      setStopLoss('');
      setTimeout(() => setTxResult(null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes('insufficient') || lower.includes('eth') || lower.includes('gas')) {
        setError('Perps tx needs Base ETH for gas in your 7702 execution wallet. Top up gas and retry.');
      } else {
        setError(msg || 'Failed to open position');
      }
      addDebug(`FINAL ERROR: ${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleClosePosition = async (position: OpenPerpsPosition) => {
    if (!primaryWallet || !universalAccount || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Preparing close...');
    try {
      const executionFee = await resolveAvantisTradeExecutionFeeWei(position.pairName);
      const collateralToClose = BigInt(Math.max(1, Math.floor(position.collateralUsd * 1e6)));
      const closeCalldata = encodeFunctionData({ abi: AVANTIS_TRADING_ABI, functionName: 'closeTradeMarket', args: [BigInt(position.pairIndex), BigInt(position.positionIndex), collateralToClose] });

      const tx = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.ETH, amount: perpsUaEthExpectAmount(executionFee) }],
        transactions: [{ to: AVANTIS_TRADING_ADDRESS as `0x${string}`, data: closeCalldata, value: `0x${executionFee.toString(16)}` }],
      });
      const walletClient = primaryWallet.getWalletClient() as unknown as WalletClientLike;
      const signerAddress = walletClient?.account?.address as `0x${string}` | undefined;
      if (!signerAddress || !sign7702) throw new Error('Wallet signing not available');
      const rootHash = (tx as { rootHash?: `0x${string}` }).rootHash;
      if (!rootHash) throw new Error('Perps close missing rootHash');
      const signature = await signUniversalRootHash({ walletClient, rootHash, signerAddress, blindSigningEnabled, addDebug });
      const auths = await build7702Authorizations(tx, sign7702, signerAddress);
      addDebug('Submitting close position via UA...');
      const res = await universalAccount.sendTransaction(tx, signature as string, auths);
      const txHash = res?.transactionId || 'pending';
      addDebug(`Close send result tx=${txHash}`);

      upsertPerpsActivity({ id: `close-${txHash}`, action: 'Close', pairName: position.pairName, txHash, status: 'pending', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'pending', action: 'close' });
      if (txHash !== 'pending') {
        const receipt = await waitForBaseReceipt(txHash) as unknown as { status?: string };
        if (receipt?.status !== '0x1') throw new Error(`Close transaction failed onchain. status=${receipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({ id: `close-${txHash}`, action: 'Close', pairName: position.pairName, txHash, status: 'confirmed', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'complete', action: 'close' });
      await fetchOpenPositions();
      await refreshOwnerBalances();
      setTimeout(() => setTxResult(null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const lower = msg.toLowerCase();
      if (lower.includes('insufficient') && lower.includes('primary')) {
        setError(
          'Universal Account could not cover this close from your unified primary balance. Ensure enough value is available for the trade gas (ETH leg) or use Perps → Deposit to top up the execution wallet.',
        );
      } else {
        setError(`Close failed: ${msg}`);
      }
      addDebug(`Close failed: ${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleUpdatePositionTpSl = async (position: OpenPerpsPosition) => {
    if (!primaryWallet || !universalAccount || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }
    const edits = positionEdits[position.id] || { tp: '', sl: '' };
    const tpNum = edits.tp.trim() ? Number(edits.tp) : 0;
    const slNum = edits.sl.trim() ? Number(edits.sl) : 0;
    addDebug(`TP/SL click -> ${position.pairName} idx=${position.positionIndex} tp=${tpNum || 0} sl=${slNum || 0}`);
    if ((edits.tp.trim() && (!Number.isFinite(tpNum) || tpNum <= 0)) || (edits.sl.trim() && (!Number.isFinite(slNum) || slNum <= 0))) {
      setError('Enter valid TP/SL price values');
      addDebug('TP/SL validation failed: invalid numbers');
      return;
    }
    if (!edits.tp.trim() && !edits.sl.trim()) {
      setError('Enter TP and/or SL before updating');
      addDebug('TP/SL validation failed: both fields empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Updating TP/SL...');
    addDebug('TP/SL update flow started');
    try {
      const { updateData, priceSourcing } = await fetchAvantisPriceUpdatePayload(position.pairName);
      addDebug(`Avantis price update payload (feed-v3), sourcing=${priceSourcing}, chunks=${updateData.length}`);
      const executionFee = await resolveAvantisTradeExecutionFeeWei(position.pairName, updateData);
      const updateCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: 'updateTpAndSl',
        args: [
          BigInt(position.pairIndex),
          BigInt(position.positionIndex),
          BigInt(Math.floor(Math.max(0, slNum) * 1e10)),
          BigInt(Math.floor(Math.max(0, tpNum) * 1e10)),
          updateData,
          priceSourcing,
        ],
      });

      const tx = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.ETH, amount: perpsUaEthExpectAmount(executionFee) }],
        transactions: [{ to: AVANTIS_TRADING_ADDRESS as `0x${string}`, data: updateCalldata, value: `0x${executionFee.toString(16)}` }],
      });
      const walletClient = primaryWallet.getWalletClient() as unknown as WalletClientLike;
      const signerAddress = walletClient?.account?.address as `0x${string}` | undefined;
      if (!signerAddress || !sign7702) throw new Error('Wallet signing not available');
      const rootHash = (tx as { rootHash?: `0x${string}` }).rootHash;
      if (!rootHash) throw new Error('Perps TP/SL update missing rootHash');
      const signature = await signUniversalRootHash({ walletClient, rootHash, signerAddress, blindSigningEnabled, addDebug });
      const auths = await build7702Authorizations(tx, sign7702, signerAddress);
      addDebug('Submitting TP/SL transaction via UA...');
      const res = await universalAccount.sendTransaction(tx, signature as string, auths);
      const txHash = res?.transactionId || 'pending';
      addDebug(`TP/SL send result tx=${txHash}`);

      upsertPerpsActivity({ id: `update-${txHash}`, action: 'Update TP/SL', pairName: position.pairName, txHash, status: 'pending', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'pending', action: 'update' });
      if (txHash !== 'pending') {
        const updateReceipt = await waitForBaseReceipt(txHash) as unknown as { status?: string };
        if (updateReceipt?.status !== '0x1') throw new Error(`Update TP/SL transaction failed onchain. status=${updateReceipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({ id: `update-${txHash}`, action: 'Update TP/SL', pairName: position.pairName, txHash, status: 'confirmed', timestamp: Date.now() });
      setTxResult({ txId: txHash, status: 'complete', action: 'update' });
      await fetchOpenPositions();
      await refreshOwnerBalances();
      setTimeout(() => setTxResult(null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`TP/SL update failed: ${msg}`);
      addDebug(`TP/SL update failed: ${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const MIN_POSITION_SIZE_USDC = 100;
  const isLeverageValid =
    leverage >= leverageMin &&
    leverage <= leverageMax &&
    (!isZeroFeeMode || zfpAvailable);
  const positionSizeValid = positionSize >= MIN_POSITION_SIZE_USDC;
  const canTrade =
    !!collateral &&
    parseFloat(collateral) > 0 &&
    parseFloat(collateral) <= usdcBalance &&
    !!currentPrice &&
    currentPrice > 0 &&
    isLeverageValid &&
    positionSizeValid;
  const depositAmountNum = parseFloat(depositAmount) || 0;
  const gasTopUpNum = parseFloat(gasTopUpAmount) || 0;
  const canDeposit =
    depositMode === 'gas_only'
      ? gasTopUpNum > 0
      : depositMode === 'usdc_only'
        ? depositAmountNum > 0
        : depositAmountNum > 0 && gasTopUpNum > 0;
  const needsUsdcConvert = depositAmountNum > 0 && (depositAmountNum > uaBaseUsdcAvailable + 0.000001);
  const depositCtaLabel =
    depositMode === 'gas_only'
      ? 'Top up gas'
      : depositMode === 'usdc_only'
        ? 'Deposit to Perps Wallet'
        : depositStage === 'gas'
          ? 'Top up gas'
          : 'Deposit + Top up gas';
  const marketsFiltered = useMemo(() => {
    const searchLower = marketSearch.trim().toLowerCase();
    return availableMarkets.filter((m) => {
      const groupOk = marketGroupFilter === 'all'
        ? true
        : marketGroupFilter === 'zfp'
          ? (pairLeverageLimits[m.pairName]?.zfpMax ?? 0) > 0
          : m.group === marketGroupFilter;
      if (!groupOk) return false;
      if (!searchLower) return true;
      return (
        m.symbol.toLowerCase().includes(searchLower) ||
        m.name.toLowerCase().includes(searchLower) ||
        m.pairName.toLowerCase().includes(searchLower)
      );
    });
  }, [marketSearch, marketGroupFilter, availableMarkets, pairLeverageLimits]);

  const filteredSortedMarkets = useMemo(() => {
    const filtered = [...marketsFiltered];
    filtered.sort((a, b) => {
      const pa = marketPrices[a.pairName]?.price || 0;
      const pb = marketPrices[b.pairName]?.price || 0;
      const ca = Number.isFinite(marketPrices[a.pairName]?.change24h) ? (marketPrices[a.pairName]?.change24h as number) : 0;
      const cb = Number.isFinite(marketPrices[b.pairName]?.change24h) ? (marketPrices[b.pairName]?.change24h as number) : 0;
      const va = pairLeverageLimits[a.pairName]?.pairOI || 0;
      const vb = pairLeverageLimits[b.pairName]?.pairOI || 0;
      if (sortBy === 'price') return pb - pa;
      if (sortBy === 'change') return cb - ca;
      return vb - va;
    });
    return filtered;
  }, [marketsFiltered, marketPrices, pairLeverageLimits, sortBy]);

  /** Top 5 by open interest / volume proxy (Socket `pairOI`), within current group filter (no search). */
  const marketsTopFiveByVolume = useMemo(() => {
    const arr = [...marketsFiltered];
    arr.sort((a, b) => {
      const vb = pairLeverageLimits[b.pairName]?.pairOI || 0;
      const va = pairLeverageLimits[a.pairName]?.pairOI || 0;
      return vb - va;
    });
    return arr.slice(0, 5);
  }, [marketsFiltered, pairLeverageLimits]);

  const marketsListForUi = useMemo(() => {
    const hasSearch = marketSearch.trim().length > 0;
    if (hasSearch || showAllMarkets) return filteredSortedMarkets;
    return marketsTopFiveByVolume;
  }, [marketSearch, showAllMarkets, filteredSortedMarkets, marketsTopFiveByVolume]);
  const totalOpenCollateralUsd = displayOpenPositions.reduce((sum, p) => sum + p.collateralUsd, 0);
  const totalOpenPnlUsd = displayOpenPositions.reduce((sum, p) => sum + p.pnlUsd, 0);

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { setView('markets'); onClose(); }} dark={view === 'trade'}>
      <div className="pb-8 max-h-[85vh] overflow-y-auto">
        {view === 'markets' ? (
          /* ========== MARKETS VIEW (Rainbow-style) ========== */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="w-10 h-10" />
              <h2 className="text-white text-2xl font-bold flex items-center gap-2.5">
                <img
                  src={AVANTIS_HEADER_LOGO_URL}
                  alt="Avantis"
                  className="h-10 w-10"
                />
                <span className="text-2xl">Perps</span>
              </h2>
              <button
                onClick={() => setShowPerpsHistoryModal(true)}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>
            </div>

            {/* Available Balance Card */}
            <div className="px-4 mb-5">
              <div className="rounded-2xl border border-gray-700 bg-[#171717] px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full bg-[#1f1f1f] border border-gray-600 flex items-center justify-center shrink-0"
                    aria-hidden
                  >
                    <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-300 font-semibold">Unified balance (UA)</div>
                    <div className="text-2xl font-bold text-white">
                      $
                      {Number(perpsUnifiedBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('deposit')}
                    className="px-4 py-2.5 rounded-xl bg-accent-dynamic text-black font-bold text-sm"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setView('withdraw')}
                    className="px-4 py-2.5 rounded-xl bg-zinc-700 text-white font-bold text-sm hover:bg-zinc-600"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Perps Debug Monitor (Markets) */}
            <div className="px-4 mb-3">
              <div className="rounded-xl border border-[#2f2f2f] bg-[#121212] p-3 text-xs text-gray-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Perps Debug</span>
                  <span className="text-green-400">live</span>
                </div>
                <div>smartAccount: <span className="text-white font-mono break-all">{smartAccountAddress || 'n/a'}</span></div>
                <div>execution wallet: <span className="text-white font-mono break-all">{ownerEOA || 'n/a'}</span></div>
                <div>UA Base USDC: <span className="text-white">{uaBaseUsdcAvailable.toFixed(4)}</span></div>
                <div>UA Total USDC: <span className="text-white">{uaTotalUsdcAvailable.toFixed(4)}</span></div>
                <div>RPC USDC (execution): <span className="text-white">{eoaUsdcBalance.toFixed(4)}</span></div>
                <div>Effective Perps USDC: <span className="text-white">{perpsUsdcBalance.toFixed(4)}</span></div>
                <div>Unified UA USD: <span className="text-white">{unifiedUaBalance.toFixed(4)}</span></div>
                <div>Effective Perps Balance: <span className="text-white">{perpsUnifiedBalance.toFixed(4)}</span></div>
                <div>Last tx: <span className="text-white">{txResult ? `${txResult.action}/${txResult.status}` : 'none'}</span></div>
              </div>
            </div>

            {/* Open Positions */}
            <div className="px-4 mb-5">
              <div className="text-gray-500 font-semibold mb-1">Open Positions</div>
              <div className="text-gray-300 text-4xl font-bold mb-2">${totalOpenCollateralUsd.toFixed(2)}</div>
              <div className={`text-sm mb-3 ${totalOpenPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                PnL {totalOpenPnlUsd >= 0 ? '+' : ''}${totalOpenPnlUsd.toFixed(2)}
              </div>
              {displayOpenPositions.length === 0 ? (
                <div className="text-center py-2">
                  <img
                    src={AVANTIS_HEADER_LOGO_URL}
                    alt="Avantis"
                    className="h-8 w-auto mx-auto mb-2 opacity-80"
                  />
                  <p className="text-white/90 font-semibold text-lg mb-1">No Open Positions</p>
                  <button
                    onClick={() => { setPerpsExplainerStep(0); setShowPerpsExplainerModal(true); }}
                    className="mt-2 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto hover:bg-gray-700 transition-colors"
                    aria-label="Learn about perps"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayOpenPositions.map((p) => (
                    <div key={p.id} className="bg-[#191919] border border-gray-800 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-semibold">
                          {p.symbol}/USD <span className={p.isLong ? 'text-green-400' : 'text-red-400'}>{p.isLong ? 'LONG' : 'SHORT'}</span>
                        </div>
                        <div className="text-xs text-gray-500">{p.leverage.toFixed(0)}x</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="text-gray-400">Size <span className="text-white">${p.sizeUsd.toFixed(2)}</span></div>
                        <div className="text-gray-400">Collateral <span className="text-white">${p.collateralUsd.toFixed(2)}</span></div>
                        <div className="text-gray-400">Entry <span className="text-white">${p.entryPrice.toFixed(2)}</span></div>
                        <div className="text-gray-400">Mark <span className="text-white">${p.markPrice.toFixed(2)}</span></div>
                        <div className="text-gray-400">Liq <span className={p.isLong ? 'text-red-300' : 'text-green-300'}>${p.liquidationPrice.toFixed(2)}</span></div>
                        <div className="text-gray-400">PnL <span className={p.pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'}>{p.pnlUsd >= 0 ? '+' : ''}${p.pnlUsd.toFixed(2)} ({p.pnlPercent >= 0 ? '+' : ''}{p.pnlPercent.toFixed(2)}%)</span></div>
                      </div>
                      {p.beingMarketClosed && (
                        <div className="text-[11px] text-yellow-300 mb-2">Close requested, awaiting oracle execution...</div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="number"
                          placeholder="TP"
                          value={positionEdits[p.id]?.tp || ''}
                          onChange={(e) => setPositionEdits((prev) => ({ ...prev, [p.id]: { tp: e.target.value, sl: prev[p.id]?.sl || '' } }))}
                          className="bg-gray-800 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
                        />
                        <input
                          type="number"
                          placeholder="SL"
                          value={positionEdits[p.id]?.sl || ''}
                          onChange={(e) => setPositionEdits((prev) => ({ ...prev, [p.id]: { tp: prev[p.id]?.tp || '', sl: e.target.value } }))}
                          className="bg-gray-800 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdatePositionTpSl(p)}
                          disabled={isLoading}
                          className="flex-1 bg-gray-800 text-gray-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          {isLoading && txResult?.action === 'update' ? (loadingStatus || 'Updating...') : 'Update TP/SL'}
                        </button>
                        <button
                          onClick={() => handleClosePosition(p)}
                          disabled={isLoading}
                          className="flex-1 bg-red-600/80 text-white rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Markets Header */}
            <div className="flex items-center justify-between px-4 mb-3">
              <button className="text-white text-3xl font-semibold flex items-center gap-1">
                Markets <span className="text-gray-500">›</span>
              </button>
              <div className="flex items-center gap-2">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'volume' | 'price' | 'change')}
                  className="bg-gray-900/80 border border-gray-700 rounded-full px-3 py-1 text-gray-300 text-sm outline-none"
                >
                  <option value="volume">By Volume</option>
                  <option value="price">By Price</option>
                  <option value="change">By Change</option>
                </select>
              </div>
            </div>
            <div className="px-4 mb-3">
              <input
                type="text"
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
                placeholder="Search market"
                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {(['all', 'zfp', 'crypto', 'forex', 'commodities', 'equity', 'other'] as const).map((group) => (
                  <button
                    key={group}
                    onClick={() => setMarketGroupFilter(group)}
                    className={`px-3 py-1 rounded-full text-xs capitalize ${
                      marketGroupFilter === group
                        ? 'bg-accent-dynamic text-black font-semibold'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {group === 'zfp' ? 'ZFP' : group}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets List */}
            <div className="space-y-1">
              {marketsListForUi.map((market) => {
                const priceData = marketPrices[market.pairName];
                const price = priceData?.price || 0;
                const change = Number.isFinite(priceData?.change24h) ? (priceData?.change24h as number) : Number.NaN;
                const pairName = market.pairName;
                const marketMeta = pairLeverageLimits[pairName];
                const zfpEligible = (marketMeta?.zfpMax ?? 0) > 0;
                const displayLev = zfpEligible
                  ? (marketMeta?.zfpMax || market.maxLeverage)
                  : (marketMeta?.standardMax || market.maxLeverage);
                const volumeOi = marketMeta?.pairOI || 0;
                const fallbackVolume = marketMeta?.pairMaxOI || 0;
                const volumeDisplay = volumeOi > 0
                  ? formatCompactUsd(volumeOi)
                  : fallbackVolume > 0
                    ? formatCompactUsd(fallbackVolume)
                    : '--';
                
                return (
                  <button
                    key={`${market.pairName}-${market.index}`}
                    onClick={() => handleSelectMarket(market)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Token Logo */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: `${market.color}20` }}
                      >
                        <img
                          src={market.logo}
                          alt={market.symbol}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            const fallback = buildTickerLogoDataUri(market.symbol, market.color);
                            if (img.src !== fallback) {
                              img.src = fallback;
                              return;
                            }
                            img.style.display = 'none';
                            const sibling = img.nextElementSibling as HTMLElement | null;
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                        <span className="hidden items-center justify-center w-full h-full text-[10px] font-bold text-gray-300">
                          {market.symbol.slice(0, 4)}
                        </span>
                      </div>
                      {/* Token Info */}
                      <div className="text-left">
                        <div className="text-white font-medium">{market.pairName}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">UP TO</span>
                          <span className="text-gray-400">{Math.floor(displayLev)}x</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500">VOL ${volumeDisplay}</span>
                        </div>
                      </div>
                    </div>
                    {/* Price & Change */}
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {price > 0 ? formatPrice(price) : '--'}
                      </div>
                      <div className={`text-sm ${Number.isFinite(change) ? (change >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
                        {Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {marketSearch.trim() === '' && filteredSortedMarkets.length > 5 && (
              <div className="px-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAllMarkets((v) => !v)}
                  className="w-full text-center text-accent-dynamic py-2 font-semibold text-sm"
                >
                  {showAllMarkets ? 'Show less' : 'View all markets'}
                </button>
              </div>
            )}

            {/* Debug Panel - Main Perps View */}
            <div className="px-4 mt-3">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-gray-500 underline"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'} ({debugLog.length} logs)
              </button>
              {showDebug && debugLog.length > 0 && (
                <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-300 max-h-40 overflow-y-auto">
                  {debugLog.map((log, i) => (
                    <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : view === 'deposit' ? (
          /* ========== DEPOSIT VIEW (Receive-style layout) ========== */
          <div className="px-5 pb-8">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setView('markets')}
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <span className="text-white">←</span>
              </button>
              <h2 className="text-white text-xl font-bold">Deposit</h2>
            </div>

            <p className="text-gray-400 text-sm mb-5">
              Move funds from your Universal Account to the 7702 execution wallet used for Perps execution on Base.
            </p>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2 mb-5">
              <div className="bg-[#252525] rounded-xl px-3 py-3">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Funding Mode</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDepositMode('usdc_gas')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      depositMode === 'usdc_gas' ? 'bg-accent-dynamic text-black' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    USDC + Gas
                  </button>
                  <button
                    onClick={() => setDepositMode('usdc_only')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      depositMode === 'usdc_only' ? 'bg-accent-dynamic text-black' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    USDC Only
                  </button>
                  <button
                    onClick={() => setDepositMode('gas_only')}
                    className={`py-2 rounded-lg text-xs font-semibold ${
                      depositMode === 'gas_only' ? 'bg-accent-dynamic text-black' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    Gas Only
                  </button>
                </div>
              </div>

              <div className="bg-[#252525] rounded-xl px-3 py-3">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Perps Deposit Amount</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="10.00"
                    min="0"
                    step="0.01"
                    disabled={depositMode === 'gas_only'}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white outline-none disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-300">USDC</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-2">
                  Sent to 7702 execution wallet on Base before opening positions.
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Unified UA Balance: ${unifiedUaBalance.toFixed(2)} • UA Base USDC Available: {uaBaseUsdcAvailable.toFixed(4)}
                </div>
              </div>

              <div className="bg-[#252525] rounded-xl px-3 py-3">
                <div>
                  <div className="text-white text-sm font-medium">ETH Gas Top-up (optional)</div>
                  <div className="text-[11px] text-gray-500">Works together with USDC deposit, or independently on its own.</div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={gasTopUpAmount}
                    onChange={(e) => setGasTopUpAmount(e.target.value)}
                    placeholder="0.0007"
                    min="0"
                    step="0.0001"
                    disabled={depositMode === 'usdc_only'}
                    className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white outline-none disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-300">ETH</span>
                </div>
              </div>

              <div className="bg-[#252525] rounded-xl px-3 py-3">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Execution wallet (7702 UA)</div>
                <div className="text-white text-sm font-mono break-all">{ownerEOA || 'Not connected'}</div>
                <div className="text-[11px] text-gray-500 mt-2">
                  Current balances: ${perpsUnifiedBalance.toFixed(2)} USD unified • {eoaEthBalance.toFixed(5)} ETH
                </div>
              </div>
            </div>

            <div className="bg-[#252525] rounded-xl px-3 py-3 mb-5">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Deterministic Flow</div>
              <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                {depositMode !== 'gas_only' && (needsUsdcConvert ? (
                  <li>Convert missing UA balance to Base USDC</li>
                ) : (
                  <li>Skip USDC convert (already available in UA)</li>
                ))}
                {depositMode !== 'gas_only' && <li>Transfer Base USDC to 7702 execution wallet</li>}
                {depositMode !== 'usdc_only' && <li>Convert UA balance to Base ETH</li>}
                {depositMode !== 'usdc_only' && <li>Transfer Base ETH to 7702 execution wallet</li>}
                {!canDeposit && <li>Enter the required amount(s) for selected mode</li>}
              </ol>
            </div>

            <button
              onClick={handleDepositToEOA}
              disabled={isLoading || !canDeposit}
              className="w-full bg-accent-dynamic text-black font-bold py-4 rounded-2xl disabled:bg-gray-700 disabled:text-gray-400"
            >
              {isLoading ? loadingStatus || depositCtaLabel : depositCtaLabel}
            </button>

            <div className="mt-4">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-gray-500 underline"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'} ({debugLog.length} logs)
              </button>
              {showDebug && debugLog.length > 0 && (
                <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs font-mono text-gray-300 max-h-40 overflow-y-auto">
                  {debugLog.map((log, i) => (
                    <div key={i} className="py-0.5 border-b border-gray-800 last:border-0">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : view === 'withdraw' ? (
          <div className="px-5 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView('markets')} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-white">←</span>
              </button>
              <h2 className="text-white text-xl font-bold">Withdraw</h2>
            </div>
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>
            )}
            <div className="bg-[#252525] rounded-xl px-3 py-3 mb-5">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Withdraw Amount</div>
              <div className="flex items-center gap-2">
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-white outline-none" />
                <span className="text-sm text-gray-300">USDC</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">Perps Wallet Balance: ${perpsUnifiedBalance.toFixed(2)} USD (Unified UA)</div>
              <button type="button" onClick={() => setWithdrawAmount(eoaUsdcBalance.toString())} className="text-accent-dynamic text-xs mt-1">Max</button>
            </div>
            <div className="bg-[#252525] rounded-xl px-3 py-3 mb-5">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">To Omni Wallet</div>
              <div className="text-white text-sm font-mono break-all">{smartAccountAddress || "Not available"}</div>
            </div>
            <button
              onClick={handleWithdrawToUA}
              disabled={isLoading || !smartAccountAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > eoaUsdcBalance}
              className="w-full bg-accent-dynamic text-black font-bold py-4 rounded-2xl disabled:bg-gray-700 disabled:text-gray-400"
            >
              {isLoading ? (loadingStatus || "Withdrawing...") : "Withdraw to UA"}
            </button>
          </div>
        ) : (
          /* ========== TRADE VIEW - inner modal only (dark sheet, no outer grey) ========== */
          <div className="px-4 pt-2 pb-6">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">{error}</div>
            )}

            {/* Single order card - back + market name (no duplicate) - on black sheet */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#252525]">
                <button onClick={() => setView('markets')} className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0">
                  <span className="text-white text-lg">←</span>
                </button>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: `${selectedMarket.color}25` }}>
                    <img src={selectedMarket.logo} alt="" className="w-5 h-5 object-contain" onError={(e) => { const t = e.currentTarget; t.src = buildTickerLogoDataUri(selectedMarket.symbol, selectedMarket.color); }} />
                  </div>
                  <span className="text-white font-medium truncate">{selectedMarket.pairName}</span>
                </div>
                <div className="w-9" />
              </div>

              {zfpAvailable && (
                <div className="flex items-center justify-between mb-4 py-1">
                  <span className="text-gray-400 text-sm">Zero Fee Perpetuals (ZFP)</span>
                  <button type="button" onClick={() => setIsZeroFeeMode((p) => !p)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${isZeroFeeMode ? 'bg-[#22c55e]' : 'bg-[#404040]'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isZeroFeeMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {/* Long/Short - green border + dotted bg when Long selected */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setIsLong(true)} className={`flex-1 py-3.5 rounded-xl font-bold text-white border-2 transition-colors ${isLong ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-[#2a2a2a] bg-[#1a1a1a]'}`} style={isLong ? { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '6px 6px' } : undefined}>Long</button>
                <button onClick={() => setIsLong(false)} className={`flex-1 py-3.5 rounded-xl font-bold text-white border-2 transition-colors ${!isLong ? 'border-[#ef4444] bg-[#ef4444]/5' : 'border-[#2a2a2a] bg-[#1a1a1a]'}`}>Short</button>
              </div>

              {/* Order type + Current Price - white labels, dropdown chevron on Order type */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <div className="text-white text-xs mb-1">Order type</div>
                  <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5">
                    <span className="text-white text-sm">{isZeroFeeMode && zfpAvailable ? 'Market Zero Fee' : 'Market'}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-white text-xs mb-1">Current Price</div>
                  <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2.5">
                    <span className="text-white text-sm font-medium">{currentPrice != null ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '...'}</span>
                    <span className="text-gray-500 text-xs">USD</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm">Collateral (USDC)</span>
                  <span className="text-xs text-gray-400">
                    Available{' '}
                    <span className="text-white">
                      $
                      {Number(perpsUnifiedBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </span>
                  </span>
                </div>
                <input type="number" value={collateral} onChange={(e) => setCollateral(e.target.value)} placeholder="0" className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-3 text-white outline-none text-base mb-2" />
                <div className="flex gap-2">
                  {[10, 25, 50, 75, 100].map((p) => (
                    <button key={p} type="button" onClick={() => setCollateral((perpsUnifiedBalance * p / 100).toFixed(2))} className="flex-1 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-xs font-medium hover:bg-[#252525]">{p}%</button>
                  ))}
                </div>
              </div>

              {/* Leverage - colored fill as you slide, dots track, green/red thumb */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm">Leverage</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min={leverageMin} max={leverageMax} value={leverage} onChange={(e) => setLeverage(Math.min(leverageMax, Math.max(leverageMin, Number(e.target.value) || leverageMin)))} className="w-12 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-white text-sm font-bold text-right outline-none" />
                    <span className="text-gray-500 text-sm">x</span>
                    <button type="button" onClick={() => setLeverage(leverageMin)} className="text-gray-500 p-1" aria-label="Reset">✕</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative h-6 flex items-center">
                    {/* Colored fill from left to thumb position */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-l-full pointer-events-none z-0"
                      style={{
                        width: `${((leverage - leverageMin) / (leverageMax - leverageMin)) * 100}%`,
                        backgroundColor: isLong ? '#22c55e' : '#ef4444',
                      }}
                    />
                    {/* Dots track - each dot colored or gray based on position */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 flex items-center gap-0.5 pointer-events-none z-[1]">
                      {Array.from({ length: 20 }, (_, i) => {
                        const fillThreshold = ((leverage - leverageMin) / (leverageMax - leverageMin)) * 20;
                        const isFilled = i < fillThreshold;
                        return (
                          <span
                            key={i}
                            className="flex-1 h-1.5 rounded-full min-w-[2px] transition-colors"
                            style={{ backgroundColor: isFilled ? (isLong ? '#22c55e' : '#ef4444') : '#404040' }}
                          />
                        );
                      })}
                    </div>
                    {/* Range input - thumb styled as bright circle */}
                    <input
                      type="range"
                      min={leverageMin}
                      max={leverageMax}
                      value={leverage}
                      onChange={(e) => setLeverage(Number(e.target.value))}
                      className="absolute inset-0 w-full h-6 appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/30 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/30 [&::-moz-range-thumb]:cursor-pointer"
                      style={{ accentColor: isLong ? '#22c55e' : '#ef4444' }}
                    />
                  </div>
                </div>
              </div>

              {/* Position Size - red border when below min. Value + logo + arrows INSIDE field on right */}
              <div className="mb-4">
                <div className="text-white text-sm mb-2">Position Size</div>
                <div className={`flex items-center bg-[#1a1a1a] rounded-lg overflow-hidden ${positionSize > 0 && positionSize < MIN_POSITION_SIZE_USDC ? 'border-2 border-red-500' : 'border border-[#333]'}`}>
                  <span className="flex-1 px-3 py-3 text-white text-base">
                    {positionSize > 0 ? positionSize.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 0 }) : '0'}
                  </span>
                  <div className="flex items-center gap-1.5 pr-3">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: `${selectedMarket.color}30` }}>
                      <img src={selectedMarket.logo} alt="" className="w-4 h-4 object-contain" />
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  </div>
                </div>
                {positionSize > 0 && positionSize < MIN_POSITION_SIZE_USDC && (
                  <div className="text-red-500 text-xs mt-2">Minimum position size for this asset is 100.00 USDC</div>
                )}
              </div>

              {/* Set TP/SL - white label, toggle right */}
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Set TP/SL</span>
                <button type="button" onClick={() => setShowTpSlInputs((v) => !v)} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${showTpSlInputs ? 'bg-[#22c55e]' : 'bg-[#404040]'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${showTpSlInputs ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* TP/SL inputs when expanded */}
            {showTpSlInputs && (
              <div className="p-3 mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="Take Profit" className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm outline-none" />
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Stop Loss" className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm outline-none" />
                </div>
              </div>
            )}

            {/* Position Summary - Avantis style */}
            {positionSize > 0 && liquidationPrice && (
              <div className="p-3 mb-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Price</span>
                  <span className="text-white">${currentPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liq. Price</span>
                  <span className={isLong ? 'text-red-400' : 'text-green-400'}>
                    ${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Fee row hidden for ZFP orders - zero fee perps have no trading fee */}
                {(!isZeroFeeMode || !zfpAvailable) && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fee</span>
                    <span className="text-white">~${(positionSize * 0.0006).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Open Position Button - Avantis exact */}
            <button 
              onClick={handleOpenPosition}
              disabled={!canTrade || isLoading}
              className={`w-full font-bold py-4 rounded-xl transition-colors ${
                canTrade && !isLoading
                  ? isLong ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white'
                  : 'bg-[#2a2a2a] text-gray-500'
              }`}
            >
              {isLoading ? loadingStatus : `Open ${isLong ? 'Long' : 'Short'}`}
            </button>

            {/* Transaction Result */}
            {txResult && (
              <div className={`mt-4 p-4 rounded-xl text-sm ${
                txResult.status === 'pending' 
                  ? 'bg-yellow-900/30 border border-yellow-500/50 text-yellow-300'
                  : 'bg-green-900/30 border border-green-500/50 text-green-300'
              }`}>
                <div className="font-bold mb-1">
                  {txResult.status === 'pending'
                    ? (txResult.action === 'open' ? '⏳ Opening...' : txResult.action === 'close' ? '⏳ Closing...' : '⏳ Updating TP/SL...')
                    : (txResult.action === 'open' ? '✅ Position Opened!' : txResult.action === 'close' ? '✅ Close Requested' : '✅ TP/SL Updated')}
                </div>
                <div className="text-xs font-mono break-all">
                  TX: {txResult.txId.slice(0, 20)}...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomSheet isOpen={showPerpsHistoryModal} onClose={() => setShowPerpsHistoryModal(false)}>
        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-lg font-bold">Perps Activity</h3>
            <button
              onClick={() => setShowPerpsHistoryModal(false)}
              className="w-8 h-8 rounded-full bg-gray-800 text-gray-300"
            >
              ✕
            </button>
          </div>
          {perpsActivity.length === 0 ? (
            <div className="text-xs text-gray-500 bg-[#151515] border border-gray-800 rounded-xl px-3 py-3">
              No recent perps activity yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {perpsActivity.map((a) => (
                <div key={a.id} className="bg-[#151515] border border-gray-800 rounded-xl px-3 py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white">{a.action} • {a.pairName}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{new Date(a.timestamp).toLocaleString()}</div>
                    {a.txHash && a.txHash !== '-' && (
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{a.txHash.slice(0, 14)}...{a.txHash.slice(-6)}</div>
                    )}
                  </div>
                  <div className={`text-[11px] font-semibold ${
                    a.status === 'confirmed' ? 'text-green-400' : a.status === 'failed' ? 'text-red-400' : 'text-yellow-300'
                  }`}>
                    {a.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Perps Explainer Modals (3 steps) */}
      <BottomSheet isOpen={showPerpsExplainerModal} onClose={() => setShowPerpsExplainerModal(false)}>
        <div className="px-5 pb-8 max-w-md mx-auto">
          {perpsExplainerStep === 0 && (
            <>
              <h3 className="text-white text-xl font-bold mb-3">Perpetual Futures</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Bet on price movements without buying it. Open and close positions with no expiration. Powered by Avantis and Hyperliquid.
              </p>
              <button
                onClick={() => setPerpsExplainerStep(1)}
                className="w-full py-3 rounded-xl bg-accent-dynamic text-black font-bold"
              >
                Next
              </button>
            </>
          )}
          {perpsExplainerStep === 1 && (
            <>
              <h3 className="text-white text-xl font-bold mb-3">Go long or short</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Go long when you believe price of the asset will rise. Go short when you believe the price will go down.
              </p>
              <button
                onClick={() => setPerpsExplainerStep(2)}
                className="w-full py-3 rounded-xl bg-accent-dynamic text-black font-bold"
              >
                Next
              </button>
            </>
          )}
          {perpsExplainerStep === 2 && (
            <>
              <h3 className="text-white text-xl font-bold mb-3">Leverage</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Leverage can amplify gains or amplify losses. When you&apos;re right, you are rewarded heavy. When you are wrong, losses can accrue and positions may be liquidated.
              </p>
              <button
                onClick={() => { setShowPerpsExplainerModal(false); setPerpsExplainerStep(0); }}
                className="w-full py-3 rounded-xl bg-accent-dynamic text-black font-bold"
              >
                LFG!
              </button>
            </>
          )}
        </div>
      </BottomSheet>
    </BottomSheet>
  );
};

// Agent Chat Modal (overlay instead of tab)
const AgentModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: "user" | "agent"; text: string}[]>([]);

  const suggestions = [
    "Swap 10 USDC to ETH",
    "What's my balance?",
    "Bridge to Arbitrum",
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullScreen>
      <div className="flex flex-col h-full bg-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-center px-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              🤖
            </div>
            <div>
              <div className="text-white font-bold">AI Agent</div>
              <div className="text-green-500 text-xs">Online</div>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-auto">
          {chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-xl text-white font-bold mb-2">AI Agent</h2>
              <p className="text-gray-500 text-center text-sm mb-6">Your crypto assistant</p>
              <div className="w-full max-w-sm space-y-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setMessage(s)} className="w-full bg-gray-900 rounded-xl p-3 text-left text-gray-300 text-sm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-accent-dynamic text-black" : "bg-gray-800 text-white"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 pb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-900 rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none"
              onKeyPress={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  setChat([...chat, { role: "user", text: message }]);
                  setMessage("");
                  setTimeout(() => {
                    setChat(c => [...c, { role: "agent", text: "I'm still learning! This feature is coming soon." }]);
                  }, 500);
                }
              }}
            />
            <button 
              onClick={() => {
                if (message.trim()) {
                  setChat([...chat, { role: "user", text: message }]);
                  setMessage("");
                  setTimeout(() => {
                    setChat(c => [...c, { role: "agent", text: "I'm still learning! This feature is coming soon." }]);
                  }, 500);
                }
              }}
              className="bg-accent-dynamic rounded-xl px-4 text-black font-medium"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

// TokenDetailModal is now imported from ./components/TokenDetailModal

// Home Tab
const HomeTab = ({ 
  accountInfo, 
  primaryAssets, 
  profile,
  onShowProfilePicker,
  onReceive,
  onSend,
  onConvert,
  onEarn,
  onTokenSelect,
  onRefresh,
}: {
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  profile: ProfileSettings;
  onShowProfilePicker: () => void;
  onReceive: () => void;
  onSend: () => void;
  onConvert: () => void;
  onEarn: () => void;
  onTokenSelect?: (token: { id: string; symbol: string; name: string; logo?: string; price: number; contracts?: Array<{ address: string; blockchain: string }> }) => void;
  onRefresh?: () => Promise<void>;
}) => {
  // Use Set to allow multiple tokens to be expanded simultaneously
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [hideSmallBalances, setHideSmallBalances] = useState(true); // Hide <$0.10 by default
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Compact action bar mode (icons only) - persisted to localStorage
  const [compactActionBar, setCompactActionBar] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('compactActionBar') === 'true';
    }
    return false;
  });
  const [actionBarToast, setActionBarToast] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Toggle compact mode on long-press
  const handleActionBarLongPress = () => {
    const newMode = !compactActionBar;
    setCompactActionBar(newMode);
    localStorage.setItem('compactActionBar', String(newMode));
    setActionBarToast(newMode ? 'Compact mode' : 'Full mode');
    setTimeout(() => setActionBarToast(null), 1500);
  };
  
  const handleActionBarTouchStart = () => {
    longPressTimer.current = setTimeout(handleActionBarLongPress, 500);
  };
  
  const handleActionBarTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  // Pull-to-refresh handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0 && touchStartY.current > 0) {
      const distance = e.touches[0].clientY - touchStartY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance * 0.5, 80));
      }
    }
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > 60 && onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStartY.current = 0;
  };
  
  const toggleExpanded = (symbol: string) => {
    setExpandedTokens(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTokens = primaryAssets?.assets?.map((asset: any) => {
    // Build contracts from chainAggregation if not present
    let contracts = asset.contracts || [];
    
    // For primary UA assets, extract contracts from chainAggregation
    if (contracts.length === 0 && asset.chainAggregation) {
      const chainIdToName: Record<number, string> = {
        1: "ethereum", 8453: "base", 42161: "arbitrum", 
        10: "optimism", 137: "polygon", 56: "bsc", 101: "solana",
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contracts = asset.chainAggregation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c.token?.address)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => ({
          address: c.token.address,
          blockchain: chainIdToName[c.token.chainId] || `chain-${c.token.chainId}`,
        }));
    }
    
    return {
      symbol: asset.symbol || asset.tokenType?.toUpperCase() || "???",
      name: asset.name || asset.symbol || asset.tokenType || "Token",
      balance: typeof asset.amount === 'string' ? parseFloat(asset.amount) : (asset.amount || 0),
      amountInUSD: asset.amountInUSD || 0,
      price: asset.price || 0,
      logo: asset.logo,
      isExternal: asset.isExternal || false,
      contracts,
      // Chain breakdown from chainAggregation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chainBreakdown: asset.chainAggregation?.map((chain: any) => ({
        chainId: chain.token?.chainId,
        chainName: getChainName(chain.token?.chainId) || chain.token?.chainId,
        amount: typeof chain.amount === 'string' ? parseFloat(chain.amount) : (chain.amount || 0),
        amountInUSD: chain.amountInUSD || 0,
        address: chain.token?.address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })).filter((c: any) => c.amount > 0.0001) || [],
    };
  }).filter((t: { balance: number }) => t.balance > 0.0001) || [];
  
  // Filter based on hide small balances toggle
  const tokens = hideSmallBalances 
    ? allTokens.filter((t: { amountInUSD: number }) => t.amountInUSD >= 0.10)
    : allTokens;

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-auto pb-24 bg-[#0a0a0a]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div 
        className="flex justify-center items-center transition-all duration-200"
        style={{ height: pullDistance, opacity: pullDistance / 60 }}
      >
        {isRefreshing ? (
          <div className="w-6 h-6 border-2 border-accent-dynamic border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className={`text-accent-dynamic text-sm ${pullDistance > 60 ? 'font-bold' : ''}`}>
            {pullDistance > 60 ? '↓ Release to refresh' : '↓ Pull to refresh'}
          </span>
        )}
      </div>
      
      {/* Profile & Balance */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <button 
          onClick={onShowProfilePicker}
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 overflow-hidden relative group"
          style={{ backgroundColor: profile.customImage ? undefined : (profile.backgroundColor || "#f97316") }}
        >
          {profile.customImage ? (
            <img src={profile.customImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            profile.emoji
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-xs">Edit</span>
          </div>
        </button>
        <button 
          onClick={onShowProfilePicker}
          className="text-gray-400 text-sm mb-2 hover:text-white transition-colors"
        >
          {profile.displayName || (accountInfo ? formatAddress(accountInfo.evmSmartAccount) : "Loading...")}
        </button>
        <div className="text-white text-5xl font-bold">
          ${primaryAssets?.totalAmountInUSD?.toFixed(2) || "0.00"}
        </div>
      </div>

      {/* Action Pill Bar - Receive, Send, Convert, Earn (long-press to toggle compact mode) */}
      <div className="flex justify-center py-6 px-4 relative">
        <div 
          className="flex bg-white/[0.08] backdrop-blur-xl rounded-full p-1.5 border border-white/10"
          onTouchStart={handleActionBarTouchStart}
          onTouchEnd={handleActionBarTouchEnd}
          onMouseDown={handleActionBarTouchStart}
          onMouseUp={handleActionBarTouchEnd}
          onMouseLeave={handleActionBarTouchEnd}
        >
          {[
            { icon: "↓", label: "Receive", action: onReceive },
            { icon: "↑", label: "Send", action: onSend },
            { icon: "⇄", label: "Convert", action: onConvert },
            { icon: "↗", label: "Earn", action: onEarn },
          ].map(({ icon, label, action }, idx, arr) => (
            <div key={label} className="flex items-center">
              <button 
                onClick={action} 
                className={`flex items-center gap-2 ${compactActionBar ? 'px-3' : 'px-4'} py-2.5 rounded-full text-white/70 hover:text-white hover:bg-accent-dynamic/80 active:scale-95 transition-all duration-200`}
              >
                <span className="text-base">{icon}</span>
                {!compactActionBar && <span className="text-sm font-medium">{label}</span>}
              </button>
              {idx < arr.length - 1 && (
                <div className="w-px h-5 bg-white/15 mx-1" />
              )}
            </div>
          ))}
        </div>
        {/* Toast notification */}
        {actionBarToast && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm animate-fade-in">
            {actionBarToast}
          </div>
        )}
      </div>

      {/* Token List with Chain Breakdown */}
      <div className="px-4 mt-2">
        {/* Hide small balances toggle */}
        <div className="flex items-center justify-between py-2 mb-2">
          <span className="text-gray-500 text-sm">Hide small balances (&lt;$0.10)</span>
          <button
            onClick={() => setHideSmallBalances(!hideSmallBalances)}
            className={`w-10 h-6 rounded-full transition-colors ${hideSmallBalances ? 'bg-accent-dynamic' : 'bg-gray-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ml-1 ${hideSmallBalances ? 'translate-x-4' : ''}`} />
          </button>
        </div>
        
        {tokens.length > 0 ? (
          <div>
            {tokens.map((token: { 
              symbol: string; 
              name: string; 
              balance: number; 
              amountInUSD: number; 
              price: number;
              logo?: string;
              isExternal?: boolean;
              contracts?: Array<{ address: string; blockchain: string }>;
              chainBreakdown: Array<{ chainId: number; chainName: string; amount: number; amountInUSD: number; address: string }>;
            }, i: number) => {
              // For external tokens, get chain from first chain breakdown or contracts
              const externalChainId = token.isExternal && token.chainBreakdown[0]?.chainId;
              
              return (
              <div key={i} className="border-b border-gray-800/30">
                {/* Main Token Row - click opens swap modal */}
                <button 
                  className="w-full flex items-center justify-between py-4"
                  onClick={() => {
                    if (token.isExternal) {
                      // External tokens: open token detail modal for swap
                      let contracts = token.contracts || [];
                      
                      // Fallback: extract from chainBreakdown if contracts is empty
                      if (contracts.length === 0 && token.chainBreakdown?.length > 0) {
                        const chainIdToName: Record<number, string> = {
                          1: "ethereum", 8453: "base", 42161: "arbitrum", 
                          10: "optimism", 137: "polygon", 56: "bsc", 101: "solana",
                        };
                        contracts = token.chainBreakdown
                          .filter((c: { address?: string; chainId?: number }) => c.address)
                          .map((c: { address: string; chainId: number }) => ({
                            address: c.address,
                            blockchain: chainIdToName[c.chainId] || `chain-${c.chainId}`,
                          }));
                      }
                      
                      console.log("[HomeTab] External token selected:", token.symbol, "contracts:", contracts);
                      
                      onTokenSelect?.({
                        id: token.symbol.toLowerCase(),
                        symbol: token.symbol,
                        name: token.name,
                        logo: token.logo,
                        price: token.price,
                        contracts,
                      });
                    } else {
                      // Primary UA tokens: toggle chain breakdown expansion
                      toggleExpanded(token.symbol);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Token Logo with chain badge for external tokens */}
                    <div className="relative">
                      {token.logo ? (
                        <img 
                          src={token.logo} 
                          alt={token.symbol} 
                          className="w-10 h-10 rounded-full bg-gray-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <TokenLogo symbol={token.symbol} size={40} />
                      )}
                      {/* Chain badge for external tokens */}
                      {token.isExternal && externalChainId && (
                        <img 
                          src={CHAIN_LOGOS[getChainName(externalChainId)] || CHAIN_LOGOS["Base"]}
                          alt="chain"
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a]"
                        />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-white font-medium">{token.name}</span>
                      <div className="text-gray-500 text-sm">{token.balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {token.symbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-white">${token.amountInUSD.toFixed(2)}</div>
                      {!token.isExternal && token.chainBreakdown.length > 1 && (
                        <div className="text-gray-500 text-xs">{token.chainBreakdown.length} chains</div>
                      )}
                    </div>
                    {/* Show expand arrow for primary tokens with chain breakdown */}
                    {!token.isExternal && token.chainBreakdown.length > 0 && (
                      <span className={`text-gray-500 text-sm transition-transform ${expandedTokens.has(token.symbol) ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Chain Breakdown (Expanded) - only for primary UA tokens */}
                {!token.isExternal && expandedTokens.has(token.symbol) && (
                  <div className="pl-14 pb-4">
                    {token.chainBreakdown.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {token.chainBreakdown.map((chain, j) => (
                          <div key={j} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <ChainLogo chainName={chain.chainName} size={16} />
                              <span className="text-gray-400">{chain.chainName}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-300">{chain.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} {token.symbol}</span>
                              <span className="text-gray-500 ml-2">(${chain.amountInUSD.toFixed(2)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-600">No tokens yet</div>
            <button onClick={onReceive} className="text-accent-dynamic mt-2">
              Deposit to get started
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-24" />
    </div>
  );
};

// Search Tab with Mobula API
const SearchTab = ({ 
  primaryAssets,
  universalAccount,
  onSend,
}: { 
  primaryAssets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  onSend?: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTargetToken, setSwapTargetToken] = useState<TokenResult | null>(null);
  const dexMetricsCacheRef = useRef<Record<string, { volume?: number; liquidity?: number; priceChange24h?: number }>>({});

  // Calculate user balance for selected token
  const getUserBalance = useCallback((token: TokenResult | null) => {
    if (!token || !primaryAssets?.assets) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userAsset = primaryAssets.assets.find((a: any) => 
      a.symbol?.toUpperCase() === token.symbol.toUpperCase()
    );
    if (!userAsset) return null;
    return {
      amount: typeof userAsset.amount === 'string' ? parseFloat(userAsset.amount) : (userAsset.amount || 0),
      amountInUSD: userAsset.amountInUSD || 0,
    };
  }, [primaryAssets]);
  
  // Recent searches - persisted to localStorage
  // Recent searches - store full token data for rich display
  const [recentTokens, setRecentTokens] = useState<TokenResult[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentTokensV2');
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  
  const addToRecentTokens = (token: TokenResult) => {
    setRecentTokens(prev => {
      const filtered = prev.filter(t => t.id !== token.id);
      const updated = [token, ...filtered].slice(0, 10);
      localStorage.setItem('recentTokensV2', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromRecentTokens = (token: TokenResult) => {
    setRecentTokens(prev => {
      const updated = prev.filter(t => t.id !== token.id);
      localStorage.setItem('recentTokensV2', JSON.stringify(updated));
      return updated;
    });
  };

  const WATCHLIST_STORAGE_KEY = "omni_swap_watchlist_v1";
  const [watchlistTokens, setWatchlistTokens] = useState<TokenResult[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const refreshWatchlist = useCallback(() => {
    try {
      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      setWatchlistTokens(raw ? JSON.parse(raw) : []);
    } catch {
      setWatchlistTokens([]);
    }
  }, []);

  useEffect(() => {
    if (!query) refreshWatchlist();
  }, [query, refreshWatchlist]);

  const [searchSection, setSearchSection] = useState<"recents" | "watchlist">("recents");

  const clearAllRecents = () => {
    setRecentTokens([]);
    localStorage.setItem("recentTokensV2", "[]");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) setQuery(text.trim());
    } catch {
      /* clipboard not available */
    }
  };

  const isAddressQuery = useMemo(() => {
    const trimmed = query.trim();
    return /^0x[a-fA-F0-9]{40}$/.test(trimmed) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
  }, [query]);

  const pickPrimaryContract = useCallback((token: TokenResult, searchInput: string) => {
    const contracts = token.contracts || [];
    if (!contracts.length) return undefined;
    const trimmed = searchInput.trim();
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      const exact = contracts.find((c) => (c.address || "").toLowerCase() === lower);
      if (exact) return exact;
    }
    const order = ["base", "solana", "ethereum", "arbitrum", "bsc", "polygon", "optimism", "avalanche"];
    const sorted = [...contracts].sort((a, b) => {
      const ai = order.indexOf(normalizeBlockchain(a.blockchain));
      const bi = order.indexOf(normalizeBlockchain(b.blockchain));
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return sorted[0];
  }, []);

  const fetchDexMetrics = useCallback(async (address: string, blockchain: string) => {
    const normalizedChain = normalizeBlockchain(blockchain);
    const dexChain = BLOCKCHAIN_TO_DEX_CHAIN[normalizedChain];
    const cacheKey = `${normalizedChain}:${address.toLowerCase()}`;
    const cached = dexMetricsCacheRef.current[cacheKey];
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (!res.ok) return null;
      const data = await res.json();
      const allPairs = Array.isArray(data?.pairs) ? data.pairs : [];
      if (!allPairs.length) return null;

      const pairs = dexChain
        ? allPairs.filter((p: { chainId?: string }) => (p.chainId || "").toLowerCase() === dexChain)
        : allPairs;
      const candidates = pairs.length ? pairs : allPairs;
      if (!candidates.length) return null;

      const best = [...candidates].sort((a: {
        volume?: { h24?: number | string };
        liquidity?: { usd?: number | string };
      }, b: {
        volume?: { h24?: number | string };
        liquidity?: { usd?: number | string };
      }) => {
        const av = Number(a?.volume?.h24 || 0);
        const bv = Number(b?.volume?.h24 || 0);
        const al = Number(a?.liquidity?.usd || 0);
        const bl = Number(b?.liquidity?.usd || 0);
        return (bv * 1.5 + bl) - (av * 1.5 + al);
      })[0] as {
        volume?: { h24?: number | string };
        liquidity?: { usd?: number | string };
        priceChange?: { h24?: number | string };
      };

      const metrics = {
        volume: Number(best?.volume?.h24 || 0) || undefined,
        liquidity: Number(best?.liquidity?.usd || 0) || undefined,
        priceChange24h: Number(best?.priceChange?.h24 || 0) || undefined,
      };
      dexMetricsCacheRef.current[cacheKey] = metrics;
      return metrics;
    } catch {
      return null;
    }
  }, []);

  const scoreToken = useCallback((token: TokenResult, searchInput: string) => {
    const q = searchInput.trim().toLowerCase();
    let score = 0;
    const symbol = token.symbol.toLowerCase();
    const name = token.name.toLowerCase();
    if (q) {
      if (symbol === q) score += 80;
      else if (symbol.startsWith(q)) score += 35;
      if (name === q) score += 30;
      else if (name.startsWith(q)) score += 12;
      if (isAddressQuery && token.contracts?.some((c) => (c.address || "").toLowerCase() === q)) score += 120;
    }
    const volumeScore = Math.log10((token.volume || 0) + 1) * 14;
    const liquidityScore = Math.log10((token.liquidity || 0) + 1) * 10;
    const marketCapScore = Math.log10((token.market_cap || 0) + 1) * 6;
    return score + volumeScore + liquidityScore + marketCapScore;
  }, [isAddressQuery]);

  const searchTokens = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MOBULA_PROXY_BASE}/mobula/api/1/search?input=${encodeURIComponent(q)}`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Map Mobula response to our format with defensive checks
      // Mobula returns contracts as string[] and blockchains as string[]
      const rawTokens = data?.data || [];
      const tokens: TokenResult[] = rawTokens.slice(0, 30).map((t: {
        id?: number | string;
        name?: string;
        symbol?: string;
        logo?: string;
        price?: number;
        price_change_24h?: number;
        market_cap?: number;
        contracts?: string[];
        blockchains?: string[];
        liquidity?: number;
        volume?: number;
        twitter?: string;
        website?: string;
        total_supply?: number;
        circulating_supply?: number;
      }) => {
        // Map contracts and blockchains arrays together
        const contractsList: Array<{ address: string; blockchain: string }> = [];
        if (Array.isArray(t.contracts) && Array.isArray(t.blockchains)) {
          t.contracts.forEach((addr, idx) => {
            contractsList.push({
              address: addr,
              blockchain: t.blockchains?.[idx] || "Unknown",
            });
          });
        }
        
        return {
          id: String(t.id || t.name || Math.random()),
          name: t.name || "Unknown",
          symbol: t.symbol || "???",
          logo: t.logo || "",
          price: typeof t.price === 'number' ? t.price : undefined,
          price_change_24h: typeof t.price_change_24h === 'number' ? t.price_change_24h : undefined,
          market_cap: typeof t.market_cap === 'number' ? t.market_cap : undefined,
          contracts: contractsList,
          // Extended data
          liquidity: typeof t.liquidity === 'number' ? t.liquidity : undefined,
          volume: typeof t.volume === 'number' ? t.volume : undefined,
          twitter: t.twitter || undefined,
          website: t.website || undefined,
          totalSupply: typeof t.total_supply === 'number' ? t.total_supply : undefined,
          circulatingSupply: typeof t.circulating_supply === 'number' ? t.circulating_supply : undefined,
        };
      });
      const enriched = await Promise.all(tokens.map(async (token, idx) => {
        if ((token.volume && token.liquidity) || idx > 12) return token;
        const primary = pickPrimaryContract(token, q);
        if (!primary?.address) return token;
        const metrics = await fetchDexMetrics(primary.address, primary.blockchain);
        if (!metrics) return token;
        return {
          ...token,
          volume: token.volume ?? metrics.volume,
          liquidity: token.liquidity ?? metrics.liquidity,
          price_change_24h: typeof token.price_change_24h === "number" ? token.price_change_24h : metrics.priceChange24h,
        };
      }));

      const ranked = enriched
        .sort((a, b) => scoreToken(b, q) - scoreToken(a, q))
        .slice(0, 15);
      setResults(ranked);
    } catch (e) {
      console.error("Search failed:", e);
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    }
    setLoading(false);
  }, [fetchDexMetrics, pickPrimaryContract, scoreToken]);

  useEffect(() => {
    const timer = setTimeout(() => searchTokens(query), 500);
    return () => clearTimeout(timer);
  }, [query, searchTokens]);

  useEffect(() => {
    if (query || !recentTokens.length) return;
    let cancelled = false;
    const enrichRecent = async () => {
      const updated = await Promise.all(recentTokens.map(async (token, idx) => {
        if ((token.volume && token.liquidity) || idx > 7) return token;
        const primary = pickPrimaryContract(token, "");
        if (!primary?.address) return token;
        const metrics = await fetchDexMetrics(primary.address, primary.blockchain);
        if (!metrics) return token;
        return {
          ...token,
          volume: token.volume ?? metrics.volume,
          liquidity: token.liquidity ?? metrics.liquidity,
          price_change_24h: typeof token.price_change_24h === "number" ? token.price_change_24h : metrics.priceChange24h,
        };
      }));
      if (cancelled) return;
      const changed = updated.some((token, i) =>
        token.volume !== recentTokens[i]?.volume ||
        token.liquidity !== recentTokens[i]?.liquidity ||
        token.price_change_24h !== recentTokens[i]?.price_change_24h
      );
      if (changed) {
        setRecentTokens(updated);
        localStorage.setItem("recentTokensV2", JSON.stringify(updated));
      }
    };
    enrichRecent();
    return () => {
      cancelled = true;
    };
  }, [query, recentTokens, pickPrimaryContract, fetchDexMetrics]);

  const displayList = !query
    ? (searchSection === "recents" ? recentTokens : watchlistTokens)
    : [];
  const isRecents = searchSection === "recents";

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] min-h-0">
      {/* Header: Recents | Watchlist + Clear all */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSearchSection("recents")}
            className={`text-sm font-medium ${isRecents ? "text-white" : "text-gray-500"}`}
          >
            Recents
          </button>
          <button
            type="button"
            onClick={() => setSearchSection("watchlist")}
            className={`text-sm font-medium ${!isRecents ? "text-white" : "text-gray-500"}`}
          >
            Watchlist
          </button>
        </div>
        {(isRecents && recentTokens.length > 0) || (!isRecents && watchlistTokens.length > 0) ? (
          <button
            type="button"
            onClick={() => isRecents ? clearAllRecents() : (localStorage.setItem(WATCHLIST_STORAGE_KEY, "[]"), setWatchlistTokens([]))}
            className="text-sm text-accent-dynamic font-medium"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Search bar at top - below header */}
      <div className="shrink-0 px-4 py-3 bg-[#0a0a0a]">
        <div className="relative flex items-center bg-gray-800 rounded-full px-4 py-2.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anything..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          />
          <button
            type="button"
            onClick={handlePaste}
            className="ml-2 px-3 py-1 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            Paste
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto px-4 pb-24">
        {loading && <div className="text-gray-500 text-center py-4">Searching...</div>}
        {error && <div className="text-red-500 text-center py-4 text-sm">Error: {error}</div>}

        {!query && displayList.length > 0 && displayList.map((token) => {
            const primaryContract = pickPrimaryContract(token, query);
            const chainLogo = getChainLogoForBlockchain(primaryContract?.blockchain);
            const handleRemove = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (isRecents) {
                removeFromRecentTokens(token);
              } else {
                const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
                const list: TokenResult[] = raw ? JSON.parse(raw) : [];
                const updated = list.filter((t) => t.id !== token.id);
                localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
                setWatchlistTokens(updated);
              }
            };
            return (
              <button
                key={token.id}
                onClick={() => setSelectedToken(token)}
                className="w-full flex items-center justify-between py-3 border-b border-gray-800/30 hover:bg-gray-900/50 rounded-lg px-2 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {token.logo ? (
                      <img src={token.logo} alt={token.symbol} className="w-9 h-9 rounded-full bg-gray-800 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                    ) : null}
                    <div className={`w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold ${token.logo ? "hidden" : ""}`}>
                      ?
                    </div>
                    {chainLogo && (
                      <img src={chainLogo} alt="" className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{token.symbol}</div>
                    <div className="text-gray-500 text-xs">
                      ${token.market_cap && token.market_cap > 0 ? formatMarketCap(token.market_cap) : "—"} MC
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">{formatPrice(token.price || 0)}</div>
                    {typeof token.price_change_24h === "number" && (
                      <span className={`text-xs ${token.price_change_24h >= 0 ? "text-green-500" : "text-orange-500"}`}>
                        {token.price_change_24h >= 0 ? "▲" : "▼"} {Math.abs(token.price_change_24h).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    aria-label="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </button>
            );
          })}

        {!query && displayList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div>{isRecents ? "Recently Viewed" : "Watchlist"}</div>
            <div className="text-xs mt-1 text-gray-600">Search to add tokens here</div>
          </div>
        )}

        {results.length > 0 && (
        <div>
          {results.map((token) => {
            const primaryContract = pickPrimaryContract(token, query);
            const chainLogo = getChainLogoForBlockchain(primaryContract?.blockchain);
            
            return (
            <button 
              key={token.id} 
              onClick={() => {
                setSelectedToken(token);
                addToRecentTokens(token);
              }}
              className="w-full flex items-center justify-between py-3 border-b border-gray-800/30 hover:bg-gray-900/50 rounded-lg px-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {token.logo ? (
                    <img 
                      src={token.logo} 
                      alt={token.symbol} 
                      className="w-10 h-10 rounded-full bg-gray-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      {getTokenIcon(token.symbol)}
                    </div>
                  )}
                  {/* Chain badge on logo */}
                  {chainLogo && (
                    <img 
                      src={chainLogo}
                      alt=""
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a0a]"
                    />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{token.name}</span>
                  </div>
                  <div className="text-gray-500 text-sm uppercase">{token.symbol}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    VOL {token.volume && token.volume > 0 ? formatMarketCap(token.volume) : "N/A"} • LIQ {token.liquidity && token.liquidity > 0 ? formatMarketCap(token.liquidity) : "N/A"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {typeof token.price === 'number' && (
                  <>
                    <div className="text-white">{formatPrice(token.price)}</div>
                    {typeof token.price_change_24h === 'number' && (
                      <div className={`text-sm ${token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {token.price_change_24h >= 0 ? "+" : ""}{token.price_change_24h.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
            );
          })}
        </div>
      )}
      </div>

      <TokenDetailModal 
        token={selectedToken} 
        userBalance={getUserBalance(selectedToken)}
        onClose={() => setSelectedToken(null)} 
        onWatchlistChange={refreshWatchlist}
        onSwap={(token) => { 
          setSwapTargetToken(token as TokenResult);
          setShowSwapModal(true);
          setSelectedToken(null);
        }}
        onSend={() => { setSelectedToken(null); onSend?.(); }}
      />

      <SwapModal
        isOpen={showSwapModal}
        onClose={() => {
          setShowSwapModal(false);
          setSwapTargetToken(null);
        }}
        targetToken={swapTargetToken ? {
          symbol: swapTargetToken.symbol,
          name: swapTargetToken.name,
          logo: swapTargetToken.logo,
          price: swapTargetToken.price,
          contracts: swapTargetToken.contracts,
        } : null}
        primaryAssets={primaryAssets}
        universalAccount={universalAccount}
        onSwapSuccess={(txId) => {
          console.log("Swap success:", txId);
        }}
      />
    </div>
  );
};

// Points Tab
const PointsTab = () => (
  <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a] px-4 pt-4">
    <div className="text-center py-16">
      <div className="text-6xl mb-4">⭐</div>
      <h2 className="text-white text-2xl font-bold mb-2">Points Program</h2>
      <p className="text-gray-500 mb-6">Coming Soon</p>
      
      <div className="bg-gray-900 rounded-xl p-6 mx-4 text-left">
        <h3 className="text-white font-medium mb-4">Earn Points By:</h3>
        <ul className="space-y-3 text-gray-400 text-sm">
          <li className="flex items-center gap-3">
            <span className="text-accent-dynamic">•</span>
            Trading tokens across chains
          </li>
          <li className="flex items-center gap-3">
            <span className="text-accent-dynamic">•</span>
            Referring friends
          </li>
          <li className="flex items-center gap-3">
            <span className="text-accent-dynamic">•</span>
            Daily check-ins
          </li>
          <li className="flex items-center gap-3">
            <span className="text-accent-dynamic">•</span>
            Completing quests
          </li>
        </ul>
      </div>
      
      <div className="mt-8">
        <div className="text-gray-500 text-sm">Your Points</div>
        <div className="text-white text-4xl font-bold mt-1">0</div>
      </div>
    </div>
  </div>
);

// Activity Modal with real transaction history
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxData = Record<string, any>;

const ActivityModal = ({ 
  isOpen, 
  onClose,
  universalAccount,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  universalAccount: UniversalAccount | null;
}) => {
  const [transactions, setTransactions] = useState<TxData[]>([]);
  const [selectedTx, setSelectedTx] = useState<TxData | null>(null);
  const [txDetails, setTxDetails] = useState<TxData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Fetch transactions when modal opens
  useEffect(() => {
    if (isOpen && universalAccount && !selectedTx) {
      fetchTransactions(1, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, universalAccount]);

  // Auto-refresh list while modal is open (UX improvement)
  useEffect(() => {
    if (!isOpen || !universalAccount || selectedTx) return;
    const interval = setInterval(() => {
      fetchTransactions(1, true);
    }, 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, universalAccount, selectedTx]);

  const fetchTransactions = async (pageNum: number, reset: boolean = false) => {
    if (!universalAccount) return;

    if (reset) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (universalAccount as any).getTransactions(pageNum, PAGE_SIZE);
      const txList = result?.transactions || result?.data || result || [];

      if (reset) {
        setTransactions(txList);
      } else {
        // De-dupe by transaction id/hash while appending
        setTransactions(prev => {
          const merged = [...prev, ...txList];
          const seen = new Set<string>();
          return merged.filter((tx: TxData, idx: number) => {
            const key = String(tx.transactionId || tx.id || tx.transaction_id || tx.hash || idx);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }

      setHasMore(txList.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('[Activity] Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshTransactions = () => fetchTransactions(1, true);

  const fetchTxDetails = async (txId: string) => {
    if (!universalAccount) return;
    
    setIsLoadingDetails(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const details = await (universalAccount as any).getTransaction(txId);
      console.log('[Activity] Tx details:', JSON.stringify(details, null, 2));
      setTxDetails(details);
    } catch (err) {
      console.error('[Activity] Failed to fetch tx details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleTxClick = (tx: TxData) => {
    setSelectedTx(tx);
    const txId = tx.transactionId || tx.id || tx.transaction_id;
    if (txId) {
      fetchTxDetails(txId);
    }
  };

  const handleBack = () => {
    setSelectedTx(null);
    setTxDetails(null);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchTransactions(page + 1, false);
    }
  };

  const formatDate = (dateInput: string | number | undefined) => {
    if (!dateInput) return '';
    
    // Handle timestamp in seconds or milliseconds
    let date: Date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput > 1e12 ? dateInput : dateInput * 1000);
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFullDate = (dateInput: string | number | undefined) => {
    if (!dateInput) return '';
    let date: Date;
    if (typeof dateInput === 'number') {
      date = new Date(dateInput > 1e12 ? dateInput : dateInput * 1000);
    } else {
      date = new Date(dateInput);
    }
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const getTxType = (tx: TxData): string => {
    const tag = (tx.tag || tx.type || tx.txType || tx.action || '').toLowerCase();
    if (tag && tag !== 'universal' && tag !== 'unknown') {
      if (tag.includes('convert')) return 'Convert';
      if (tag.includes('receive') || tag.includes('deposit')) return 'Receive';
      if (tag.includes('send') || tag.includes('transfer')) return 'Send';
      if (tag.includes('swap') || tag.includes('buy') || tag.includes('sell')) return 'Swap';
      if (tag.includes('contract') || tag.includes('interaction')) return 'Contract';
      return tag;
    }

    const depositOps = tx.depositUserOperations || [];
    const lendingOps = tx.lendingUserOperations || [];
    const settlementOps = tx.settlementUserOperations || [];
    if (depositOps.length > 0 || lendingOps.length > 0 || settlementOps.length > 0) return 'Swap';

    if (tx.tokenChanges) {
      const hasDecr = tx.tokenChanges.decr?.length > 0;
      const hasIncr = tx.tokenChanges.incr?.length > 0;
      if (hasDecr && hasIncr) return 'Swap';
      if (hasDecr && !hasIncr) return 'Send';
      if (!hasDecr && hasIncr) return 'Receive';
    }
    
    if (tx.transactions?.length > 1) return 'Swap';
    if (tx.transactions?.length > 0 || tx.userOps?.length > 0) return 'Contract';
    return 'Transaction';
  };

  const getTxStatus = (tx: TxData): string => {
    // Check explicit status field
    const s = tx.status || tx.state || '';
    
    if (typeof s === 'string' && s.length > 0) {
      const sl = s.toLowerCase();
      // Only mark as failed if explicitly failed
      if (sl === 'failed' || sl === 'error' || sl === 'reverted') return 'Failed';
      if (sl === 'pending' || sl === 'processing' || sl === 'submitted') return 'Pending';
      if (sl === 'completed' || sl === 'success' || sl === 'confirmed' || sl === 'done') return 'Completed';
    }
    
    if (typeof s === 'number') {
      // 0 = pending, 1+ = success, negative = failed
      if (s === 0) return 'Pending';
      if (s > 0) return 'Completed';
      if (s < 0) return 'Failed';
    }
    
    // If transaction has an ID and timestamp, assume it completed
    if ((tx.transactionId || tx.id) && (tx.created_at || tx.createdAt || tx.timestamp)) {
      return 'Completed';
    }
    
    // If has token changes, likely completed
    if (tx.tokenChanges?.decr?.length > 0 || tx.tokenChanges?.incr?.length > 0) {
      return 'Completed';
    }
    
    return 'Pending';
  };

  const getTxDate = (tx: TxData): string | number | undefined => {
    return tx.created_at || tx.createdAt || tx.timestamp || tx.time || tx.updated_at;
  };

  const getTagIcon = (txType: string) => {
    const t = txType.toLowerCase();
    if (t.includes('buy') || t.includes('swap')) return '⇄';
    if (t.includes('send') || t.includes('transfer') || t.includes('universal')) return '↑';
    if (t.includes('receive') || t.includes('deposit')) return '↓';
    if (t.includes('convert')) return '🔄';
    return '•';
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('success') || s.includes('complete')) return 'text-accent-dynamic bg-accent-dynamic-20';
    if (s.includes('pending') || s.includes('process')) return 'text-amber-400 bg-amber-400/20';
    if (s.includes('fail') || s.includes('error') || s.includes('cancel')) return 'text-red-400 bg-red-400/20';
    return 'text-zinc-400 bg-zinc-500/20';
  };

  const formatHexUsd = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    try {
      const n = typeof value === 'string' && value.startsWith('0x')
        ? Number(BigInt(value)) / 1e18
        : Number(value);
      if (!Number.isFinite(n)) return '0.00';
      return n.toFixed(4);
    } catch {
      return '0.00';
    }
  };

  /** Format amountInUSD - API sometimes returns raw values (e.g. 994176017463000064 → $0.99) */
  const formatAmountInUsd = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    try {
      const n = typeof value === 'string' && value.startsWith('0x')
        ? Number(BigInt(value)) / 1e18
        : Number(value);
      if (!Number.isFinite(n)) return '0.00';
      const abs = Math.abs(n);
      if (abs > 1e15) return (n / 1e18).toFixed(2);
      if (abs > 1e9) return (n / 1e12).toFixed(2);
      return n.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // Convert hex/BigInt string to human readable number. API may use 18 decimals; use token-native when result is unreasonably large.
  const formatTokenAmount = (amount: string | number, decimals: number = 18, symbol?: string): string => {
    if (!amount) return '0';
    let value: bigint;
    try {
      if (typeof amount === 'string' && amount.startsWith('0x')) {
        value = BigInt(amount);
      } else if (typeof amount === 'string') {
        if (amount.includes('.')) return parseFloat(amount).toFixed(4);
        value = BigInt(amount);
      } else {
        value = BigInt(Math.floor(amount));
      }
      const sym = (symbol || '').toUpperCase();
      const tryDecimals = (d: number) => {
        const div = BigInt(10 ** d);
        const w = value / div;
        const r = value % div;
        const rStr = r.toString().padStart(d, '0').slice(0, 8);
        return `${w}.${rStr}`.replace(/\.?0+$/, '') || '0';
      };
      let result = tryDecimals(decimals);
      const num = parseFloat(result);
      // SOL uses 9 decimals. If result is wrong (e.g. 2,068,860 vs 0.00206886), API likely used 0/18.
      if (sym === 'SOL' && (num > 1 || num < 1e-10)) result = tryDecimals(9);
      else if ((sym === 'USDC' || sym === 'USDT') && num > 1000) result = tryDecimals(18);
      else if (num > 10000) result = tryDecimals(18);
      return result;
    } catch {
      return String(amount);
    }
  };

  const getTxAmount = (tx: TxData): { amount: string; symbol: string; isNegative: boolean; usdValue?: string } | null => {
    try {
      if (tx.tokenChanges?.decr?.[0]) {
        const d = tx.tokenChanges.decr[0];
        const decimals = d.token?.decimals || d.token?.realDecimals || 18;
        const symbol = d.token?.symbol || '';
        const rawAmount = d.rawAmount || d.amount;
        const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals, symbol) : (d.amount || '0');
        return { amount: formattedAmount, symbol, isNegative: true, usdValue: d.amountInUSD != null ? `$${formatAmountInUsd(d.amountInUSD)}` : undefined };
      }
      if (tx.tokenChanges?.incr?.[0]) {
        const i = tx.tokenChanges.incr[0];
        const decimals = i.token?.decimals || i.token?.realDecimals || 18;
        const symbol = i.token?.symbol || '';
        const rawAmount = i.rawAmount || i.amount;
        const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals, symbol) : (i.amount || '0');
        return { amount: formattedAmount, symbol, isNegative: false, usdValue: i.amountInUSD != null ? `$${formatAmountInUsd(i.amountInUSD)}` : undefined };
      }
      if (tx.depositTokens?.[0]) {
        const d = tx.depositTokens[0];
        const decimals = d.token?.decimals || 18;
        const symbol = d.token?.symbol || '';
        return { amount: formatTokenAmount(d.rawAmount || d.amount, decimals, symbol), symbol, isNegative: true, usdValue: d.amountInUSD != null ? `$${formatAmountInUsd(d.amountInUSD)}` : undefined };
      }
      if (tx.amount !== undefined) {
        const decimals = tx.decimals || 18;
        return { amount: formatTokenAmount(tx.amount, decimals), symbol: tx.symbol || tx.token || '', isNegative: tx.direction === 'out' };
      }
      if (tx.totalDecrAmountInUSD) return { amount: `$${formatAmountInUsd(tx.totalDecrAmountInUSD)}`, symbol: '', isNegative: true };
      if (tx.totalIncrAmountInUSD) return { amount: `$${formatAmountInUsd(tx.totalIncrAmountInUSD)}`, symbol: '', isNegative: false };
    } catch {
      // Prevent any format error from breaking UA/balance
    }
    return null;
  };

  const shortenHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getChainMeta = (chainId: number | undefined) => {
    const map: Record<number, { name: string; logo: string; explorer: string }> = {
      1: { name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', explorer: 'https://etherscan.io/tx/' },
      10: { name: 'Optimism', logo: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png', explorer: 'https://optimistic.etherscan.io/tx/' },
      56: { name: 'BNB Chain', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', explorer: 'https://bscscan.com/tx/' },
      137: { name: 'Polygon', logo: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', explorer: 'https://polygonscan.com/tx/' },
      8453: { name: 'Base', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png', explorer: 'https://basescan.org/tx/' },
      42161: { name: 'Arbitrum', logo: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg', explorer: 'https://arbiscan.io/tx/' },
      101: { name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', explorer: 'https://solscan.io/tx/' },
      2013: { name: 'Particle Alpha', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', explorer: 'https://universalx.app/activity/details?id=' },
    };
    return map[chainId || 0] || { name: `Chain ${chainId || '-'}`, logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', explorer: 'https://etherscan.io/tx/' };
  };

  const getExplorerTxUrl = (chainId: number | undefined, txHash: string | undefined) => {
    if (!chainId || !txHash) return '';
    return `${getChainMeta(chainId).explorer}${txHash}`;
  };

  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const formatWithSubscript = (n: number): string => {
    const s = n.toFixed(8).replace(/\.?0+$/, '');
    if (s.includes('.')) {
      const [whole, frac] = s.split('.');
      const m = frac.match(/^0+/);
      if (m && m[0].length > 0 && m[0].length <= 9) {
        return `${whole}.0${SUB[m[0].length]}${frac.slice(m[0].length)}`;
      }
    }
    return s;
  };
  /** Format balance for display - cap decimals to avoid odd numbers like -186008.742856 */
  const formatBalanceDisplay = (num: number, formatted: string): string => {
    if (num > 0 && num < 0.01) return formatWithSubscript(num);
    if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(4).replace(/\.?0+$/, '') || '0';
    return formatted;
  };

  const copyIcon = (
    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  const doCopy = (value: string) => { try { navigator.clipboard.writeText(value); } catch { /* ignore */ } };
  const copyRowAddr = (label: string, addr: string) => (
    <div className="flex justify-between items-center py-2 border-b border-zinc-700/50 last:border-0">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-zinc-200 text-xs bg-accent-dynamic-10 px-2 py-1 rounded border border-accent-dynamic/30">Omni Wallet</span>
        <span className="text-white font-mono text-sm">{shortenHash(addr)}</span>
        <button onClick={() => doCopy(addr)} className="p-1 hover:bg-zinc-700/50 rounded">{copyIcon}</button>
      </div>
    </div>
  );
  const copyRowTxHash = (hash: string, href: string) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-zinc-400 text-sm">Tx Hash</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent-dynamic hover:underline">
        <span className="font-mono text-sm">{shortenHash(hash)}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
      </a>
    </div>
  );
  const infoIcon = (title: string) => (
    <span title={title} className="text-zinc-500 text-xs ml-0.5 cursor-help">?</span>
  );

  // Transaction Detail View - 1:1 reference layout
  if (selectedTx) {
    const details = txDetails || selectedTx;
    const txType = getTxType(details);
    const status = getTxStatus(details);
    const lendingOps = details.lendingUserOperations || [];
    const depositOps = details.depositUserOperations || [];
    const totals = details.fees?.totals || {};
    const gasUsd = formatHexUsd(totals.gasFeeTokenAmountInUSD);
    const txFeeUsd = formatHexUsd(totals.transactionFeeTokenAmountInUSD);

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} dark>
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">
          <button onClick={handleBack} className="flex items-center gap-2 text-zinc-400 mb-4 hover:text-accent-dynamic transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>

          {isLoadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-accent-dynamic border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <>
              {/* Header: Title + Status */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold capitalize">{txType}</h2>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>{status}</span>
              </div>

              {/* 1. Balance change (first) */}
              {(details.tokenChanges?.decr?.length || details.tokenChanges?.incr?.length) ? (
                <div className="mb-6">
                  <div className="text-zinc-400 text-sm mb-2">Balance change</div>
                  <div className="space-y-2">
                    {(details.tokenChanges?.decr || []).map((d: { amount?: string; rawAmount?: string; amountInUSD?: string; token?: { symbol?: string; tokenType?: string; image?: string; chainId?: number; realDecimals?: number; decimals?: number } }, i: number) => {
                      const sym = (d.token?.symbol || d.token?.tokenType || '').toUpperCase();
                      const decimals = d.token?.realDecimals ?? d.token?.decimals ?? (sym === 'USDC' || sym === 'USDT' ? 6 : sym === 'SOL' ? 9 : 18);
                      const raw = d.rawAmount ?? d.amount ?? '0';
                      const formatted = formatTokenAmount(raw, decimals, sym || undefined);
                      const num = parseFloat(formatted);
                      const display = formatBalanceDisplay(num, formatted);
                      const chainMeta = getChainMeta(d.token?.chainId);
                      return (
                        <div key={`decr-${i}`} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            {d.token?.image ? <img src={d.token.image} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" /> : null}
                            <span className="text-amber-400/90 font-medium">-{display} {d.token?.symbol || d.token?.tokenType || 'Token'}</span>
                            <img src={chainMeta.logo} alt={chainMeta.name} className="w-4 h-4 rounded-full object-contain" referrerPolicy="no-referrer" title={chainMeta.name} />
                          </div>
                        </div>
                      );
                    })}
                    {(details.tokenChanges?.incr || []).map((inc: { amount?: string; rawAmount?: string; amountInUSD?: string; token?: { symbol?: string; tokenType?: string; image?: string; chainId?: number; realDecimals?: number; decimals?: number } }, i: number) => {
                      const sym = (inc.token?.symbol || inc.token?.tokenType || '').toUpperCase();
                      const decimals = inc.token?.realDecimals ?? inc.token?.decimals ?? (sym === 'USDC' || sym === 'USDT' ? 6 : sym === 'SOL' ? 9 : 18);
                      const raw = inc.rawAmount ?? inc.amount ?? '0';
                      const formatted = formatTokenAmount(raw, decimals, sym || undefined);
                      const num = parseFloat(formatted);
                      const display = formatBalanceDisplay(num, formatted);
                      const chainMeta = getChainMeta(inc.token?.chainId);
                      return (
                        <div key={`incr-${i}`} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            {inc.token?.image ? <img src={inc.token.image} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" /> : null}
                            <span className="text-accent-dynamic font-medium">+{display} {inc.token?.symbol || inc.token?.tokenType || 'Token'}</span>
                            <img src={chainMeta.logo} alt={chainMeta.name} className="w-4 h-4 rounded-full object-contain" referrerPolicy="no-referrer" title={chainMeta.name} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* 2. Transaction details */}
              <div className="border-t border-zinc-700/50 pt-4 space-y-0">
                {details.sender && copyRowAddr('From(you)', details.sender)}
                {details.receiver && copyRowAddr('To', details.receiver)}
                {getTxDate(details) && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700/50">
                    <span className="text-zinc-400 text-sm">Time</span>
                    <span className="text-white text-sm">{formatFullDate(getTxDate(details))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-zinc-700/50">
                  <span className="text-zinc-400 text-sm">Gas fee{infoIcon('Estimated gas cost')}</span>
                  <span className="text-white text-sm">≈${gasUsd}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-700/50">
                  <span className="text-zinc-400 text-sm">Transaction fee{infoIcon('Service fee')}</span>
                  <span className="text-white text-sm">${txFeeUsd}</span>
                </div>
              </div>

              {/* 3. Multi-chain: From (deposit) first, then Target (lending) - no Settlement */}
              {depositOps.map((op: { chainId?: number; txHash?: string }, i: number) => {
                const chain = getChainMeta(op.chainId);
                const href = getExplorerTxUrl(op.chainId, op.txHash);
                const fromChains = (details.tokenChanges as { fromChains?: number[] })?.fromChains || [];
                const chainId = op.chainId ?? 0;
                const decrForChain = (details.tokenChanges?.decr || []).filter((x: { token?: { chainId?: number } }) => Number(x.token?.chainId) === chainId);
                const incrForChain = (details.tokenChanges?.incr || []).filter((x: { token?: { chainId?: number } }) => Number(x.token?.chainId) === chainId);
                const depositForChain = (details.depositTokens || []).filter((d: { token?: { chainId?: number } }) => Number(d.token?.chainId) === chainId);
                const chainTokens = [...decrForChain, ...incrForChain].length > 0
                  ? [...decrForChain, ...incrForChain]
                  : depositForChain.map((d: { token?: { symbol?: string }; amount?: string; rawAmount?: string }) => ({ ...d, rawAmount: d.rawAmount ?? d.amount, isDeposit: true }));
                return (
                  <div key={`from-${i}`} className="mt-6 border-t border-zinc-700/50 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={chain.logo} alt={chain.name} className="w-4 h-4 rounded-full object-contain" referrerPolicy="no-referrer" />
                      <span className="text-zinc-300 font-medium text-sm">From Tx Hash - on {chain.name}</span>
                    </div>
                    {chainTokens.map((item: { amount?: string; rawAmount?: string; token?: { symbol?: string; tokenType?: string; image?: string; realDecimals?: number; decimals?: number }; isDeposit?: boolean }, j: number) => {
                      const sym = (item.token?.symbol || item.token?.tokenType || '').toUpperCase();
                      const decimals = item.token?.realDecimals ?? item.token?.decimals ?? 18;
                      const raw = item.rawAmount ?? item.amount ?? '0';
                      const formatted = formatTokenAmount(raw, decimals, sym || undefined);
                      const num = parseFloat(formatted);
                      const display = formatBalanceDisplay(num, formatted);
                      const isIncr = !item.isDeposit && j >= decrForChain.length;
                      return (
                        <div key={`dc-${j}`} className="flex items-center gap-2 py-1 text-sm">
                          {item.token?.image ? <img src={item.token.image} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" /> : null}
                          <span className={isIncr ? 'text-accent-dynamic' : 'text-amber-400/90'}>{isIncr ? '+' : '-'}{display} {item.token?.symbol || item.token?.tokenType || ''}</span>
                        </div>
                      );
                    })}
                    {chainTokens.length === 0 && fromChains.includes(op.chainId ?? 0) ? (
                      <div className="text-zinc-500 text-xs py-1">Balance change on chain</div>
                    ) : null}
                    {op.txHash && copyRowTxHash(op.txHash, href)}
                  </div>
                );
              })}
              {lendingOps.map((op: { chainId?: number; txHash?: string }, i: number) => {
                const chain = getChainMeta(op.chainId);
                const href = getExplorerTxUrl(op.chainId, op.txHash);
                const incrForChain = (details.tokenChanges?.incr || []).filter((x: { token?: { chainId?: number } }) => x.token?.chainId === op.chainId);
                const decrForChain = (details.tokenChanges?.decr || []).filter((x: { token?: { chainId?: number } }) => x.token?.chainId === op.chainId);
                return (
                  <div key={`target-${i}`} className="mt-6 border-t border-zinc-700/50 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={chain.logo} alt={chain.name} className="w-4 h-4 rounded-full object-contain" referrerPolicy="no-referrer" />
                      <span className="text-zinc-300 font-medium text-sm">Target Tx Hash - on {chain.name}</span>
                    </div>
                    {[...decrForChain, ...incrForChain].map((item: { amount?: string; rawAmount?: string; token?: { symbol?: string; tokenType?: string; image?: string; realDecimals?: number; decimals?: number } }, j: number) => {
                      const sym = (item.token?.symbol || item.token?.tokenType || '').toUpperCase();
                      const decimals = item.token?.realDecimals ?? item.token?.decimals ?? 18;
                      const raw = item.rawAmount ?? item.amount ?? '0';
                      const formatted = formatTokenAmount(raw, decimals, sym || undefined);
                      const num = parseFloat(formatted);
                      const display = formatBalanceDisplay(num, formatted);
                      const isIncr = j >= decrForChain.length;
                      return (
                        <div key={`tc-${j}`} className="flex items-center gap-2 py-1 text-sm">
                          {item.token?.image ? <img src={item.token.image} alt="" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" /> : null}
                          <span className={isIncr ? 'text-accent-dynamic' : 'text-amber-400/90'}>{isIncr ? '+' : '-'}{display} {item.token?.symbol || item.token?.tokenType || ''}</span>
                        </div>
                      );
                    })}
                    {op.txHash && copyRowTxHash(op.txHash, href)}
                  </div>
                );
              })}

              {/* Advanced */}
              <details className="mt-6 border-t border-zinc-700/50 pt-4">
                <summary className="cursor-pointer text-zinc-400 text-sm hover:text-accent-dynamic transition-colors">Advanced</summary>
                <pre className="mt-2 text-xs text-zinc-500 whitespace-pre-wrap break-all overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      </BottomSheet>
    );
  }

  // Transaction List View
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Activity</h2>
          <button
            onClick={refreshTransactions}
            disabled={isLoading || isRefreshing}
            className="text-sm px-3 py-1 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        
        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-accent-dynamic border-t-transparent rounded-full mx-auto mb-4" />
            <div className="text-gray-500">Loading transactions...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx, idx) => {
              const txType = getTxType(tx);
              const status = getTxStatus(tx);
              const dateStr = formatDate(getTxDate(tx));
              const amount = getTxAmount(tx);

              return (
                <button
                  key={tx.transactionId || tx.id || idx}
                  onClick={() => handleTxClick(tx)}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                    {getTagIcon(txType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium capitalize">{txType}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>
                    {amount && (
                      <div className={`text-sm ${amount.isNegative ? 'text-red-400' : 'text-green-400'}`}>
                        {amount.isNegative ? '-' : '+'}{amount.amount} {amount.symbol}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {dateStr || ''}
                  </div>
                </button>
              );
            })}
            
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="w-full py-3 text-center text-accent-dynamic hover:text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

// App Lock Modal
// Declare global type for native biometrics bridge
declare global {
  interface Window {
    nativeBiometrics?: {
      getStatus: () => Promise<{ enabled: boolean; available: boolean; type: string }>;
      enable: () => Promise<{ success: boolean; enabled: boolean }>;
      disable: () => Promise<{ success: boolean; enabled: boolean }>;
    };
  }
}

const AppLockModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometrics");
  const [isLoading, setIsLoading] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  
  // Check biometrics status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (window.nativeBiometrics) {
        setIsNativeApp(true);
        try {
          const status = await window.nativeBiometrics.getStatus();
          setBiometricsEnabled(status.enabled);
          setBiometricsAvailable(status.available);
          setBiometricType(status.type);
        } catch (e) {
          console.error("Failed to get biometrics status:", e);
        }
      }
    };
    if (isOpen) checkStatus();
  }, [isOpen]);
  
  const handleToggle = async () => {
    if (!window.nativeBiometrics) return;
    
    setIsLoading(true);
    try {
      if (biometricsEnabled) {
        const result = await window.nativeBiometrics.disable();
        setBiometricsEnabled(result.enabled);
      } else {
        const result = await window.nativeBiometrics.enable();
        setBiometricsEnabled(result.enabled);
      }
    } catch (e) {
      console.error("Failed to toggle biometrics:", e);
    }
    setIsLoading(false);
  };
  
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onClose} className="text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="text-white text-xl font-bold">App Lock</h2>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">
          App Lock uses biometric data to unlock your OMNI account. Enable an unlock method below.
        </p>
        
        {!isNativeApp ? (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              App Lock requires the native OMNI app. This feature is not available in the web browser.
            </p>
          </div>
        ) : !biometricsAvailable ? (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              Biometrics are not available on this device. Please ensure Face ID or Touch ID is set up in your device settings.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
              </svg>
              <span className="text-white">{biometricType}</span>
            </div>
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`w-12 h-7 rounded-full transition-colors ${biometricsEnabled ? 'bg-purple-500' : 'bg-gray-600'} ${isLoading ? 'opacity-50' : ''}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${biometricsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
        
        {biometricsEnabled && (
          <p className="text-green-500 text-xs mt-4">
            ✓ App Lock is enabled. You&apos;ll need to authenticate with {biometricType} when opening OMNI.
          </p>
        )}
      </div>
    </BottomSheet>
  );
};

// Settings Modal (moved from tab)
const SettingsModal = ({
  isOpen,
  onClose,
  onLogout,
  blindSigningEnabled,
  onToggleBlindSigning,
  onOpenAppLock,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  blindSigningEnabled: boolean;
  onToggleBlindSigning: (enabled: boolean) => void;
  onOpenAppLock?: () => void;
}) => {
  const exportWallet = useExportWalletCompat();
  const { address } = useAccount();
  const [exporting, setExporting] = useState(false);

  const handleExportKey = async () => {
    if (!exportWallet || !address) return;
    setExporting(true);
    const fallback = setTimeout(() => setExporting(false), 5000);
    try {
      await exportWallet({ address });
    } catch (e) {
      console.error("[Export]", e);
    } finally {
      clearTimeout(fallback);
      setExporting(false);
    }
  };

  return (
  <BottomSheet isOpen={isOpen} onClose={onClose}>
    <div className="px-6 pb-8">
      <h2 className="text-white text-xl font-bold mb-6 text-center">Settings</h2>
      <div className="space-y-4">
        {/* Security Section */}
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Security</div>
        
        <button 
          onClick={onOpenAppLock}
          className="w-full flex items-center justify-between py-3 border-b border-gray-800"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"/>
            </svg>
            <span className="text-white">App Lock</span>
          </div>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>

        {exportWallet && address && (
          <button
            type="button"
            onClick={handleExportKey}
            disabled={exporting}
            className="w-full flex items-center justify-between py-3 border-b border-gray-800 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
              </svg>
              <span className="text-white">Export Private Key</span>
            </div>
            {exporting ? (
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            )}
          </button>
        )}
        
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2 mt-6">Signing</div>
        <div className="w-full flex items-center justify-between py-3 border-b border-gray-800">
          <div className="pr-3">
            <div className="text-white">Blind Signing</div>
            <div className="text-[11px] text-gray-500">When enabled, UA signing uses a lower-friction blind-sign path when supported.</div>
          </div>
          <button
            type="button"
            onClick={() => onToggleBlindSigning(!blindSigningEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${blindSigningEnabled ? 'bg-accent-dynamic' : 'bg-gray-600'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${blindSigningEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full py-3 text-red-500 text-center mt-6"
        >
          Log Out
        </button>
      </div>
    </div>
  </BottomSheet>
  );
};

// Bottom Nav with Agent and Trade
const BottomNav = ({ 
  active, 
  onChange,
  onAgentPress,
  onTradePress,
}: { 
  active: TabType; 
  onChange: (t: TabType) => void;
  onAgentPress: () => void;
  onTradePress: (option: "perps" | "polymarket") => void;
}) => {
  const tabs = [
    { id: "home" as TabType, icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
      </svg>
    )},
    { id: "search" as TabType, icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    )},
    { id: "agent" as TabType, icon: () => (
      <img src="/universal-wallet-web/omni-logo.png" alt="Omni" className="w-11 h-11 rounded-xl object-contain" />
    ), isAgent: true },
    { id: "trade" as TabType, icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
    ), isTrade: true },
    { id: "points" as TabType, icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
      </svg>
    )},
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 flex justify-center">
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10"
        style={{ 
          background: 'linear-gradient(135deg, rgba(40,40,45,0.9) 0%, rgba(25,25,30,0.95) 100%)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id || (tab.isAgent && false) || (tab.isTrade && false);
          if (tab.isTrade) {
            return (
              <DropdownMenu key={tab.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 text-gray-400 hover:text-gray-300 focus:outline-none`}
                  >
                    {tab.icon()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="center"
                  sideOffset={8}
                  className="bg-gray-900 border-gray-800 min-w-[140px] p-1"
                >
                  <DropdownMenuItem
                    onSelect={() => onTradePress("perps")}
                    className="flex items-center gap-2 text-white focus:bg-gray-800 focus:text-white cursor-pointer py-2"
                  >
                    <img src={TRADE_MENU_LOGOS.perps} alt="" className="w-5 h-5 rounded object-contain" />
                    Perps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onTradePress("polymarket")}
                    className="flex items-center gap-2 text-white focus:bg-gray-800 focus:text-white cursor-pointer py-2"
                  >
                    <img src={TRADE_MENU_LOGOS.polymarket} alt="" className="w-5 h-5 rounded object-contain" />
                    Predictions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }
          return (
            <button
              key={tab.id}
              onClick={() => tab.isAgent ? onAgentPress() : onChange(tab.id)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                isActive 
                  ? 'text-accent-dynamic bg-accent-dynamic-20' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.icon(isActive || false)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const sign7702 = useSign7702AuthorizationCompat();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [universalAccountInstance, setUniversalAccountInstance] = useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(null);
  const [mobulaAssets, setMobulaAssets] = useState<MobulaAsset[]>([]);
  const [particleAssets, setParticleAssets] = useState<Awaited<ReturnType<typeof fetchParticleExternalAssets>>>([]);
  
  // Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showPerpsModal, setShowPerpsModal] = useState(false);
  const [showPolymarketModal, setShowPolymarketModal] = useState(false);
  const [showEarnModal, setShowEarnModal] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAppLockModal, setShowAppLockModal] = useState(false);
  const [homeSelectedToken, setHomeSelectedToken] = useState<{ id: string; symbol: string; name: string; logo?: string; price: number; contracts?: Array<{ address: string; blockchain: string }> } | null>(null);
  const [showHomeSwapModal, setShowHomeSwapModal] = useState(false);
  // Sell is handled by SwapModal with direction flip

  // Profile settings (persisted to localStorage)
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    const defaults: ProfileSettings = {
      emoji: "🍊",
      customImage: null,
      displayName: "Wallet",
      backgroundColor: "#f97316",
      blindSigningEnabled: false,
    };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('walletProfile');
      if (saved) {
        try {
          return { ...defaults, ...JSON.parse(saved) };
        } catch {
          return defaults;
        }
      }
    }
    return defaults;
  });

  const updateProfile = (p: ProfileSettings) => {
    setProfile(p);
    localStorage.setItem('walletProfile', JSON.stringify(p));
    // Apply accent theme based on profile background color
    if (p.backgroundColor) {
      applyAccentTheme(p.backgroundColor);
    }
  };
  
  // Apply accent theme on initial load
  useEffect(() => {
    if (profile.backgroundColor) {
      applyAccentTheme(profile.backgroundColor);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const universalAccountConfig = useMemo((): IUniversalAccountConfig | null => {
    if (!address || typeof address !== "string" || !address.startsWith("0x") || address.length !== 42) {
      return null;
    }
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "c0cb9e74-192b-4bdc-ba62-852775c6e7fd";
    const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY || "caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK";
    const appId = process.env.NEXT_PUBLIC_APP_ID || "e5be9376-1d3a-4882-b4a5-c5c0ce1b5182";
    return {
      projectId,
      projectClientKey: clientKey,
      projectAppUuid: appId,
      rpcUrl: 'https://universal-rpc-staging.particle.network', // Bypass simulation for oracle-dependent contracts (Avantis perps)
      smartAccountOptions: {
        useEIP7702: true, // Magic auth + EOA signing path with UA 7702 enabled
        name: "UNIVERSAL",
        version: UNIVERSAL_ACCOUNT_VERSION,
        ownerAddress: address,
      },
    };
  }, [address]);

  useEffect(() => {
    if (isConnected && address && universalAccountConfig) {
      console.log("[UA] Creating UA instance for:", address);
      const ua = new UniversalAccount(universalAccountConfig);
      setUniversalAccountInstance(ua);
    } else {
      console.log("[UA] Disconnected or invalid address, clearing state");
      setUniversalAccountInstance(null);
      setAccountInfo(null);
      setPrimaryAssets(null);
    }
  }, [isConnected, address, universalAccountConfig]);

  useEffect(() => {
    if (!universalAccountInstance || !address) return;
    const fetchAddresses = async () => {
      try {
        console.log("[UA] Fetching smart account options...");
        const options = await universalAccountInstance.getSmartAccountOptions();
        console.log("[UA] Smart accounts:", { evm: options.smartAccountAddress, sol: options.solanaSmartAccountAddress });
        setAccountInfo({
          ownerAddress: address,
          evmSmartAccount: options.smartAccountAddress || "",
          solanaSmartAccount: options.solanaSmartAccountAddress || "",
        });
      } catch (error) {
        console.error("[UA] Failed to fetch addresses:", error);
      }
    };
    fetchAddresses();
  }, [universalAccountInstance, address]);

  const fetchAssets = useCallback(async () => {
    if (!universalAccountInstance) {
      console.log("[Assets] No UA instance yet");
      return;
    }
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
        console.log("[Assets] Fetching primary assets...", attempt > 0 ? `(retry ${attempt})` : "");
        const assets = await universalAccountInstance.getPrimaryAssets();
        console.log("[Assets] Got assets:", JSON.stringify(assets).slice(0, 500));
        setPrimaryAssets(assets);
        return;
      } catch (error) {
        lastError = error;
        console.error("[Assets] Fetch failed:", error);
      }
    }
    console.error("[Assets] All retries failed:", lastError);
    setPrimaryAssets({ assets: [], totalAmountInUSD: 0 });
  }, [universalAccountInstance]);

  // Fetch Mobula wallet balances for external tokens (UA smart accounts - EVM + Solana)
  const fetchMobulaAssets = useCallback(async () => {
    if (!accountInfo?.evmSmartAccount) {
      console.log("[Mobula] No EVM smart account yet");
      return;
    }
    try {
      // Fetch EVM assets
      console.log("[Mobula] Fetching for EVM account:", accountInfo.evmSmartAccount);
      const evmAssets = await fetchMobulaWalletBalances(accountInfo.evmSmartAccount);
      console.log("[Mobula] EVM assets:", evmAssets.length, evmAssets.map(a => a.asset?.symbol).slice(0, 10));
      
      // Fetch Solana assets if we have a Solana address
      let solanaAssets: MobulaAsset[] = [];
      if (accountInfo?.solanaSmartAccount) {
        console.log("[Mobula] Fetching for Solana account:", accountInfo.solanaSmartAccount);
        solanaAssets = await fetchMobulaWalletBalances(accountInfo.solanaSmartAccount);
        console.log("[Mobula] Solana assets:", solanaAssets.length, solanaAssets.map(a => a.asset?.symbol).slice(0, 10));
      }
      
      // Merge and dedupe by symbol (prefer higher balance)
      const assetMap = new Map<string, MobulaAsset>();
      [...evmAssets, ...solanaAssets].forEach(asset => {
        const key = asset.asset.symbol?.toUpperCase();
        const existing = assetMap.get(key);
        if (!existing || asset.estimated_balance > existing.estimated_balance) {
          assetMap.set(key, asset);
        }
      });
      
      const mergedAssets = Array.from(assetMap.values());
      console.log("[Mobula] Merged assets:", mergedAssets.length);
      setMobulaAssets(mergedAssets);
    } catch (error) {
      console.error("Failed to fetch Mobula assets:", error);
    }
  }, [accountInfo?.evmSmartAccount, accountInfo?.solanaSmartAccount]);

  // Fetch Particle external assets (WETH, WBNB, etc.) - fallback when Mobula credits out
  const fetchParticleAssets = useCallback(async () => {
    if (!accountInfo?.evmSmartAccount || !primaryAssets?.assets) return;
    try {
      const primarySymbols = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (primaryAssets.assets?.map((a: any) => a.tokenType?.toUpperCase()?.trim()) || []).filter((s: string | undefined) => s)
      );
      const assets = await fetchParticleExternalAssets(accountInfo.evmSmartAccount, primarySymbols);
      setParticleAssets(assets);
    } catch (e) {
      console.warn("[Particle] fetchParticleExternalAssets failed:", e);
    }
  }, [accountInfo?.evmSmartAccount, primaryAssets?.assets]);

  // Fetch Mobula + Particle assets when account info is available
  useEffect(() => {
    if (accountInfo?.evmSmartAccount) {
      fetchMobulaAssets();
    }
  }, [accountInfo?.evmSmartAccount, accountInfo?.solanaSmartAccount, fetchMobulaAssets]);

  useEffect(() => {
    if (accountInfo?.evmSmartAccount && primaryAssets?.assets) {
      fetchParticleAssets();
    }
  }, [accountInfo?.evmSmartAccount, primaryAssets?.assets, fetchParticleAssets]);

  // WebSocket for real-time balance and transaction updates
  const handleAssetUpdate = useCallback((assets: Array<{ chainId: number; address: string; amountOnChain: string }>) => {
    console.log("[WSS] Real-time asset update received:", assets.length, "assets");
    fetchAssets();
    fetchMobulaAssets();
    fetchParticleAssets();
  }, [fetchAssets, fetchMobulaAssets, fetchParticleAssets]);

  const handleTransactionUpdate = useCallback((tx: { transactionId: string; status: number }) => {
    console.log("[WSS] Transaction update:", tx.transactionId, "status:", tx.status === 7 ? "success" : tx.status === 11 ? "failed" : tx.status);
    if (tx.status === 7 || tx.status === 11) {
      fetchAssets();
      fetchMobulaAssets();
      fetchParticleAssets();
    }
  }, [fetchAssets, fetchMobulaAssets, fetchParticleAssets]);

  // Real-time WebSocket updates (auto-refreshes assets on changes)
  useUniversalAccountWS({
    universalAccount: universalAccountInstance,
    ownerAddress: address,
    evmAddress: accountInfo?.evmSmartAccount,
    solanaAddress: accountInfo?.solanaSmartAccount,
    useEIP7702: true,
    onAssetUpdate: handleAssetUpdate,
    onTransactionUpdate: handleTransactionUpdate,
  });

  // Merge UA primary assets with Mobula + Particle external assets
  const combinedAssets = useMemo(() => {
    console.log("[CombinedAssets] primaryAssets:", primaryAssets ? `${primaryAssets.assets?.length} assets, $${primaryAssets.totalAmountInUSD}` : "null");
    console.log("[CombinedAssets] mobulaAssets:", mobulaAssets?.length || 0, "particleAssets:", particleAssets?.length || 0);
    if (!primaryAssets) return null;
    
    // Get tokenTypes from UA primary assets for dedup (UA uses tokenType, not symbol)
    const primarySymbols = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (primaryAssets.assets?.map((a: any) => a.tokenType?.toUpperCase()?.trim()) || [])
        .filter((s: string | undefined) => s)
    );
    
    // Filter Mobula assets - exclude primary dupes
    const fromMobula = mobulaAssets
      .filter(ma => {
        const symbolUpper = ma.asset.symbol?.toUpperCase()?.trim();
        if (!symbolUpper) return false;
        
        // Debug: Log PUNCH specifically
        if (symbolUpper === 'PUNCH') {
          console.log("[CombinedAssets] PUNCH debug:", {
            symbol: ma.asset.symbol,
            token_balance: ma.token_balance,
            estimated_balance: ma.estimated_balance,
            inPrimary: primarySymbols.has(symbolUpper),
            contracts: ma.asset.contracts,
            blockchains: ma.asset.blockchains,
          });
        }
        
        // Skip if already in primary assets (case-insensitive)
        // This is the ONLY dedup - no more commonTokens blocking
        if (primarySymbols.has(symbolUpper)) {
          console.log("[CombinedAssets] Skipping dupe (in primary):", ma.asset.symbol);
          return false;
        }
        
        return true;
      })
      .filter(ma => {
        // Debug: log if PUNCH gets filtered by balance
        if (ma.asset.symbol?.toUpperCase() === 'PUNCH' && ma.token_balance <= 0) {
          console.log("[CombinedAssets] PUNCH filtered - zero balance:", ma.token_balance);
        }
        return ma.token_balance > 0;
      }) // Show any token with balance
      .map(ma => {
        // Build contracts array from Mobula asset data or cross_chain_balances
        const contracts: Array<{ address: string; blockchain: string }> = [];
        
        // First try: use asset.contracts + asset.blockchains arrays
        if (ma.asset.contracts && ma.asset.blockchains) {
          for (let i = 0; i < ma.asset.contracts.length; i++) {
            contracts.push({
              address: ma.asset.contracts[i],
              blockchain: ma.asset.blockchains[i] || "unknown",
            });
          }
        }
        
        // Fallback: extract from cross_chain_balances if available
        if (contracts.length === 0 && ma.cross_chain_balances) {
          const chainIdToName: Record<number, string> = {
            1: "ethereum", 8453: "base", 42161: "arbitrum", 
            10: "optimism", 137: "polygon", 56: "bsc", 101: "solana",
          };
          Object.values(ma.cross_chain_balances).forEach((data) => {
            if (data.address && data.chainId) {
              contracts.push({
                address: data.address,
                blockchain: chainIdToName[data.chainId] || `chain-${data.chainId}`,
              });
            }
          });
        }
        
        console.log("[CombinedAssets] Adding external token:", ma.asset.symbol, "contracts:", contracts.length);
        
        return {
          symbol: ma.asset.symbol,
          name: ma.asset.name,
          amount: ma.token_balance,
          amountInUSD: ma.estimated_balance,
          price: ma.price,
          logo: ma.asset.logo,
          isExternal: true, // Flag to identify external assets
          contracts, // Now properly populated
          // Build chain aggregation from cross_chain_balances
          chainAggregation: ma.cross_chain_balances 
            ? Object.values(ma.cross_chain_balances).map((data) => ({
                token: { chainId: data.chainId, address: data.address },
                amount: data.balance,
                amountInUSD: data.balance * ma.price,
              }))
            : [],
        };
      });
    
    // Add Particle assets (WETH, WBNB) - skip symbols already from Mobula
    const mobulaSymbols = new Set(fromMobula.map((a: { symbol: string }) => a.symbol?.toUpperCase()));
    const fromParticle = particleAssets.filter(
      (pa) => !mobulaSymbols.has(pa.symbol?.toUpperCase()) && pa.amount > 0
    );
    
    const externalAssets = [...fromMobula, ...fromParticle];
    const mergedAssets = [...(primaryAssets.assets || []), ...externalAssets];
    
    console.log("[CombinedAssets] Final:", mergedAssets.length, "assets (", externalAssets.length, "external, Mobula:", fromMobula.length, "Particle:", fromParticle.length, ")");
    
    const externalTotal = externalAssets.reduce((sum, a) => sum + a.amountInUSD, 0);
    
    return {
      ...primaryAssets,
      assets: mergedAssets,
      totalAmountInUSD: (primaryAssets.totalAmountInUSD || 0) + externalTotal,
    };
  }, [primaryAssets, mobulaAssets, particleAssets]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Delayed refetch for mobile: UA backend may need a moment after init
  useEffect(() => {
    if (!universalAccountInstance) return;
    const t = setTimeout(() => fetchAssets(), 1500);
    return () => clearTimeout(t);
  }, [universalAccountInstance, fetchAssets]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isConnected) return <LoginScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Top Header with Activity/Settings - only on Home tab */}
      {activeTab === "home" && (
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-end px-4 py-3" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowActivityModal(true)}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {activeTab === "home" && (
        <HomeTab 
          accountInfo={accountInfo}
          primaryAssets={combinedAssets as IAssetsResponse | null}
          profile={profile}
          onShowProfilePicker={() => setShowProfilePicker(true)}
          onReceive={() => setShowReceiveModal(true)}
          onSend={() => setShowSendModal(true)}
          onConvert={() => setShowConvertModal(true)}
          onEarn={() => setShowEarnModal(true)}
          onTokenSelect={(token) => setHomeSelectedToken(token)}
          onRefresh={async () => {
            await fetchAssets();
            await fetchMobulaAssets();
          }}
        />
      )}
      {activeTab === "search" && (
        <SearchTab 
          primaryAssets={combinedAssets as IAssetsResponse | null}
          universalAccount={universalAccountInstance}
          onSend={() => setShowSendModal(true)}
        />
      )}
      {activeTab === "points" && <PointsTab />}

      <BottomNav 
        active={activeTab} 
        onChange={setActiveTab} 
        onAgentPress={() => setShowAgentModal(true)}
        onTradePress={(option) => {
          if (option === "perps") setShowPerpsModal(true);
          else if (option === "polymarket") setShowPolymarketModal(true);
        }}
      />

      {/* All Modals */}
      <AgentModal isOpen={showAgentModal} onClose={() => setShowAgentModal(false)} />
      
      <ProfilePickerModal
        isOpen={showProfilePicker}
        onClose={() => setShowProfilePicker(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
      />
      
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        evmAddress={accountInfo?.evmSmartAccount || ""}
        solanaAddress={accountInfo?.solanaSmartAccount || ""}
      />
      
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        assets={primaryAssets}
        universalAccount={universalAccountInstance}
        blindSigningEnabled={profile.blindSigningEnabled}
        sign7702={sign7702}
        onSuccess={() => {
          fetchAssets();
          fetchMobulaAssets();
          fetchParticleAssets();
        }}
      />
      
      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        assets={primaryAssets}
        universalAccount={universalAccountInstance}
        blindSigningEnabled={profile.blindSigningEnabled}
        signMessage={undefined}
        onTransactionCreated={(tx) => {
          console.log('[Convert] Transaction created:', tx);
        }}
        onSuccess={() => {
          fetchAssets();
          fetchMobulaAssets();
          fetchParticleAssets();
        }}
      />

      <PerpsModal
        isOpen={showPerpsModal}
        onClose={() => setShowPerpsModal(false)}
        assets={combinedAssets as IAssetsResponse | null}
        universalAccount={universalAccountInstance}
        blindSigningEnabled={profile.blindSigningEnabled}
        smartAccountAddress={accountInfo?.evmSmartAccount}
        sign7702={sign7702}
        onSuccess={() => {
          fetchAssets();
          fetchMobulaAssets();
        }}
      />

      <PolymarketModal
        isOpen={showPolymarketModal}
        onClose={() => setShowPolymarketModal(false)}
        universalAccount={universalAccountInstance}
        smartAccountAddress={accountInfo?.evmSmartAccount}
        onSuccess={() => {
          fetchAssets();
          fetchMobulaAssets();
        }}
      />

      <EarnModal
        isOpen={showEarnModal}
        onClose={() => setShowEarnModal(false)}
        assets={combinedAssets as IAssetsResponse | null}
        primaryAssets={primaryAssets}
        universalAccount={universalAccountInstance}
        smartAccountAddress={accountInfo?.evmSmartAccount}
        blindSigningEnabled={profile.blindSigningEnabled}
        sign7702={sign7702}
        onSuccess={() => {
          fetchAssets();
          fetchMobulaAssets();
        }}
      />

      {/* Sell is handled by SwapModal with direction flip */}

      {accountInfo && (
        <DepositDialog
          showDepositDialog={showDepositDialog}
          setShowDepositDialog={setShowDepositDialog}
          evmAddress={accountInfo.evmSmartAccount}
          solanaAddress={accountInfo.solanaSmartAccount}
        />
      )}
      
      <AssetBreakdownDialog
        isOpen={showAssetBreakdown}
        setIsOpen={setShowAssetBreakdown}
        assets={primaryAssets}
      />

      <ActivityModal 
        isOpen={showActivityModal} 
        onClose={() => setShowActivityModal(false)}
        universalAccount={universalAccountInstance}
      />
      
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        onLogout={disconnect}
        blindSigningEnabled={profile.blindSigningEnabled}
        onToggleBlindSigning={(enabled) => updateProfile({ ...profile, blindSigningEnabled: enabled })}
        onOpenAppLock={() => setShowAppLockModal(true)}
      />
      
      <AppLockModal
        isOpen={showAppLockModal}
        onClose={() => setShowAppLockModal(false)}
      />
      
      {/* Token Detail Modal for Home Tab external tokens */}
      <TokenDetailModal 
        token={homeSelectedToken} 
        userBalance={homeSelectedToken ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          amount: combinedAssets?.assets?.find((a: any) => a.symbol?.toUpperCase() === homeSelectedToken.symbol?.toUpperCase())?.amount || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          amountInUSD: combinedAssets?.assets?.find((a: any) => a.symbol?.toUpperCase() === homeSelectedToken.symbol?.toUpperCase())?.amountInUSD || 0,
        } : undefined}
        onClose={() => setHomeSelectedToken(null)} 
        onSwap={() => {
          setShowHomeSwapModal(true);
        }}
        onSend={() => { setHomeSelectedToken(null); setShowSendModal(true); }}
      />
      
      <SwapModal
        isOpen={showHomeSwapModal}
        onClose={() => setShowHomeSwapModal(false)}
        targetToken={homeSelectedToken}
        primaryAssets={combinedAssets as IAssetsResponse | null}
        universalAccount={universalAccountInstance}
      />
    </div>
  );
};

export default App;
