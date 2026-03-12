/* eslint-disable @next/next/no-img-element */
"use client";
import {
  ConnectButton,
  useAccount,
  useWallets,
  useDisconnect,
  useParticleAuth,
} from "@particle-network/connectkit";
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
import { decodeFunctionResult, encodeFunctionData } from "viem";
import { toBeHex } from "ethers";
import { useUniversalAccountWS } from "./hooks/useUniversalAccountWS";

// Mobula API for token search
const MOBULA_API_KEY = "a8e6a174-9dfd-4929-b0e0-9f6ece767923";

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
    const url = `https://lifi-proxy.orimolty.workers.dev/mobula/api/1/wallet/portfolio?wallet=${address}&blockchains=base,ethereum,arbitrum,polygon,solana`;
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

// Types
type TabType = "home" | "search" | "browser" | "points";

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
}: {
  walletClient: WalletClientLike;
  rootHash: `0x${string}`;
  signerAddress?: `0x${string}`;
  blindSigningEnabled: boolean;
}): Promise<string> => {
  const signer = signerAddress || walletClient.account?.address;
  if (!signer) {
    throw new Error('Signer address unavailable for UA signature');
  }

  if (blindSigningEnabled && walletClient.signMessage) {
    try {
      const signature = await walletClient.signMessage({ message: { raw: rootHash } });
      if (typeof signature === 'string' && signature.startsWith('0x')) {
        return signature;
      }
    } catch {
      // Fall back to explicit personal_sign path if blind sign path is unsupported.
    }
  }

  const signature = await walletClient.request({
    method: 'personal_sign',
    params: [rootHash, signer],
  });
  if (typeof signature !== 'string') {
    throw new Error('Invalid signature response from wallet');
  }
  return signature;
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

// Chain badge component for showing which chain a token is on
const ChainBadge = ({ blockchain }: { blockchain: string }) => {
  // Map blockchain names to CHAIN_LOGOS keys and short names
  const chainMapping: Record<string, { logoKey: string; shortName: string }> = {
    "ethereum": { logoKey: "Ethereum", shortName: "ETH" },
    "base": { logoKey: "Base", shortName: "Base" },
    "arbitrum": { logoKey: "Arbitrum", shortName: "ARB" },
    "optimism": { logoKey: "Optimism", shortName: "OP" },
    "polygon": { logoKey: "Polygon", shortName: "MATIC" },
    "bsc": { logoKey: "BNB Chain", shortName: "BSC" },
    "bnb": { logoKey: "BNB Chain", shortName: "BSC" },
    "solana": { logoKey: "Solana", shortName: "SOL" },
    "avalanche": { logoKey: "Avalanche", shortName: "AVAX" },
  };
  
  const chainLower = blockchain.toLowerCase();
  const mapping = chainMapping[chainLower];
  
  // CHAIN_LOGOS is defined later in the file, so we need to handle gracefully
  const getChainLogo = (key: string) => {
    const logos: Record<string, string> = {
      "Ethereum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
      "Base": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
      "Arbitrum": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
      "Optimism": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
      "Polygon": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
      "BNB Chain": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
      "Solana": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
      "Avalanche": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
    };
    return logos[key];
  };
  
  const logo = mapping ? getChainLogo(mapping.logoKey) : undefined;
  const shortName = mapping?.shortName || blockchain;
  
  return (
    <div className="flex items-center gap-1 bg-gray-800/80 rounded-full px-1.5 py-0.5">
      {logo && (
        <img src={logo} alt={blockchain} className="w-3 h-3 rounded-full" />
      )}
      <span className="text-gray-400 text-[10px]">{shortName}</span>
    </div>
  );
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
  if (price < 0.00001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
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

// Bottom Sheet Modal wrapper - proper sliding animation
const BottomSheet = ({ 
  isOpen, 
  onClose, 
  children,
  fullScreen = false,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
  fullScreen?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      currentYRef.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!sheetRef.current) return;
    if (currentYRef.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = '';
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center touch-none"
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Backdrop - blocks touch events */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${isAnimating ? 'opacity-80' : 'opacity-0'}`}
        onTouchMove={(e) => e.preventDefault()}
      />
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={`relative bg-[#1a1a1a] ${fullScreen ? 'h-full' : 'max-h-[90vh]'} w-full max-w-md rounded-t-3xl overflow-hidden touch-auto`}
        style={{ 
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle - larger touch target */}
        <div 
          className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-14 h-1.5 bg-gray-500 rounded-full" />
        </div>
        {/* Content */}
        <div className={`overflow-auto ${fullScreen ? 'h-[calc(100%-40px)]' : 'max-h-[calc(90vh-40px)]'}`}>
          {children}
        </div>
      </div>
    </div>
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

// Receive/Deposit Modal
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

  const truncateAddr = (addr: string) => addr ? `${addr.slice(0, 4)}...${addr.slice(-3)}` : "";

  const chains = [
    { name: "Solana", logo: CHAIN_LOGOS["Solana"], address: solanaAddress },
    { name: "Ethereum", logo: CHAIN_LOGOS["Ethereum"], address: evmAddress },
    { name: "Base", logo: CHAIN_LOGOS["Base"], address: evmAddress },
    { name: "BNB Chain", logo: CHAIN_LOGOS["BNB Chain"], address: evmAddress },
    { name: "Arbitrum", logo: CHAIN_LOGOS["Arbitrum"], address: evmAddress },
    { name: "Polygon", logo: CHAIN_LOGOS["Polygon"], address: evmAddress },
    { name: "Optimism", logo: CHAIN_LOGOS["Optimism"], address: evmAddress },
    { name: "Avalanche", logo: CHAIN_LOGOS["Avalanche"], address: evmAddress },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-5 pb-8">
        <h2 className="text-white text-xl font-bold mb-2">Receive</h2>
        
        <p className="text-gray-400 text-sm mb-5">
          Deposit any token on supported networks. All EVM chains share the same address.
        </p>

        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">Your receive address</p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {chains.map((chain) => (
            <div key={chain.name} className="bg-[#252525] rounded-xl px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={chain.logo} alt={chain.name} className="w-9 h-9 rounded-full" />
                <span className="text-white font-medium">{chain.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-mono">{truncateAddr(chain.address)}</span>
                <button
                  onClick={() => handleCopy(chain.address, chain.name)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copied === chain.name ? (
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
                  onClick={() => setQrAddress({ chain: chain.name, address: chain.address })}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Show QR code"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4v4H4V4zm0 12h4v4H4v-4zm12-12h4v4h-4V4zm0 12h4v4h-4v-4zm-6-6h4v4h-4v-4z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Modal */}
        {qrAddress && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setQrAddress(null)}>
            <div className="bg-[#1a1a1a] rounded-2xl p-6 mx-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-white text-lg font-bold mb-4 text-center">{qrAddress.chain} Address</h3>
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

// Send Modal
const SendModal = ({
  isOpen,
  onClose,
  assets,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
}) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = assets?.assets?.filter((a: any) => {
    const bal = typeof a.balance === 'string' ? parseFloat(a.balance) : (a.balance || 0);
    return bal > 0.0001;
  }) || [];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8">
        <h2 className="text-white text-xl font-bold mb-6 text-center">Send</h2>

        {/* Token Selection */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Token</label>
          <select
            value={selectedToken || ""}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full bg-gray-800 rounded-xl px-3 py-2 text-white outline-none"
          >
            <option value="">Select a token</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tokens.map((t: any, i: number) => (
              <option key={i} value={t.symbol}>{t.symbol} - {t.name}</option>
            ))}
          </select>
        </div>

        {/* Recipient */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x... or .eth"
            className="w-full bg-gray-800 rounded-xl px-3 py-2 text-white outline-none"
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-800 rounded-xl px-3 py-2 text-white outline-none"
          />
        </div>

        <button className="w-full bg-accent-dynamic text-black font-bold py-4 rounded-xl">
          Review Send
        </button>
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
  onTransactionCreated,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTransactionCreated?: (tx: any) => void;
  onSuccess?: () => void; // Callback to refresh balances
}) => {
  const [primaryWallet] = useWallets();
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
      
      // Extract and display fees from transaction
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
      
      if (onTransactionCreated) {
        onTransactionCreated(tx);
      }
      
      // Sign and send transaction (same flow as Perps)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((tx as any).rootHash) {
        if (!primaryWallet) {
          throw new Error('Please connect wallet first');
        }
        
        setLoadingStatus('Waiting for signature...');
        const walletClient = primaryWallet.getWalletClient();
        
        // Sign the root hash
        const signature = await signUniversalRootHash({
          walletClient: walletClient as unknown as WalletClientLike,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rootHash: (tx as any).rootHash as `0x${string}`,
          signerAddress: walletClient.account?.address as `0x${string}` | undefined,
          blindSigningEnabled,
        });

        // Send transaction
        setLoadingStatus('Sending transaction...');
        const sendResult = await universalAccount.sendTransaction(tx, signature as string);
        
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
      <div className="px-4 pb-4">
        <h2 className="text-white text-lg font-bold mb-2 text-center">Convert</h2>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-2 mb-2 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* From Section - Compact */}
        <div className="bg-[#1a1a1a] rounded-xl p-3 mb-1 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">From</div>
          
          <div className="flex gap-2 mb-1">
            {/* Asset Dropdown - Compact */}
            <div className="flex-1 relative">
              <button
                onClick={() => { setFromAssetOpen(!fromAssetOpen); setFromChainOpen(false); }}
                className="w-full bg-gray-700 rounded-lg px-2 py-1.5 text-white text-left flex items-center justify-between"
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden z-20 max-h-40 overflow-y-auto">
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
                className={`w-full bg-gray-700 rounded-lg px-2 py-1.5 text-left flex items-center justify-between ${!fromAsset ? 'opacity-50' : ''}`}
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden z-20 max-h-40 overflow-y-auto">
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
              className="flex-1 bg-gray-700 rounded-lg px-2 py-1.5 text-white outline-none"
            />
            <button 
              onClick={handleMax}
              className="bg-gray-700 px-2 py-1.5 rounded-lg text-purple-400 text-xs hover:bg-gray-600"
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
          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-[#0a0a0a] flex items-center justify-center text-gray-400">
            ↓
          </div>
        </div>

        {/* To Section - Compact */}
        <div className="bg-[#1a1a1a] rounded-xl p-3 mb-2 border border-white/10">
          <div className="text-gray-400 text-xs mb-1">To</div>
          
          <div className="flex gap-2">
            {/* To Asset Dropdown - Compact */}
            <div className="flex-1 relative">
              <button
                onClick={() => { setToAssetOpen(!toAssetOpen); setToChainOpen(false); }}
                className="w-full bg-gray-700 rounded-lg px-2 py-1.5 text-white text-left flex items-center justify-between"
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
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden z-20 max-h-40 overflow-y-auto">
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
                className={`w-full bg-gray-700 rounded-lg px-2 py-1.5 text-left flex items-center justify-between ${!toAsset ? 'opacity-50' : ''}`}
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
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden z-20 max-h-40 overflow-y-auto">
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
            <div className="mt-3 bg-[#0a0a0a] rounded-xl p-3 border border-white/10">
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

const ERC20_ALLOWANCE_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
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

// Pyth Oracle on Base (used by Avantis for price feeds)
const PYTH_CONTRACT_ADDRESS = '0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a';
const PYTH_ABI = [
  {
    name: 'getUpdateFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'updateDataSize', type: 'uint256' }],
    outputs: [{ name: 'feeAmount', type: 'uint256' }],
  },
] as const;

// Decimal conventions from Avantis SDK docs:
// - USDC amounts: 6 decimals (100n * 10n**6n = 100 USDC)
// - Prices: 10 decimals (50000n * 10n**10n = $50,000)
// - Leverage: 10 decimals (10n * 10n**10n = 10x)
// - Slippage: 10 decimals (10n**8n = 1%)
// - Execution fees: 18 decimals wei

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
const DEFAULT_PERPS_MARKET_LOGO = 'https://www.avantisfi.com/favicon.ico';

const AVANTIS_SOCKET_API_URL = 'https://socket-api-pub.avantisfi.com/socket-api/v1/data';

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

const PerpsModal = ({
  isOpen,
  onClose,
  assets,
  universalAccount,
  blindSigningEnabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
  universalAccount: UniversalAccount | null;
  blindSigningEnabled: boolean;
}) => {
  const [primaryWallet] = useWallets();
  const [view, setView] = useState<'markets' | 'trade' | 'deposit'>('markets');
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
  const [ownerEOA, setOwnerEOA] = useState<string>("");
  const [eoaUsdcBalance, setEoaUsdcBalance] = useState<number>(0);
  const [eoaEthBalance, setEoaEthBalance] = useState<number>(0);
  const [isZeroFeeMode, setIsZeroFeeMode] = useState(false);
  const [pairLeverageLimits, setPairLeverageLimits] = useState<Record<string, PairLeverageLimits>>({});
  const [marketSearch, setMarketSearch] = useState('');
  const [marketGroupFilter, setMarketGroupFilter] = useState<'all' | PerpsMarketGroup>('all');
  const [showTpSlInputs, setShowTpSlInputs] = useState(false);
  const [displayOpenPositions, setDisplayOpenPositions] = useState<OpenPerpsPosition[]>([]);
  const [, setPositionsLoading] = useState(false);
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
  const AVANTIS_HEADER_LOGO_URL = 'https://1312337203-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F76vAZHPcNKY10NzuKsC4%2Fuploads%2FEbbnsKGrcR2kXz3JxZ1w%2FAvantis%20White%20Logo%20-%20Horizontal.png?alt=media';
  const marketPricesRef = useRef<Record<string, { price: number; change24h: number }>>({});
  const previousPositionIdsRef = useRef<Set<string>>(new Set());
  const [showPerpsHistoryModal, setShowPerpsHistoryModal] = useState(false);
  
  // Helper to add debug messages
  const addDebug = (msg: string) => {
    console.log('[Perps Debug]', msg);
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
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
        logo: staticMeta?.logo || DEFAULT_PERPS_MARKET_LOGO,
        color: staticMeta?.color || '#6b7280',
        group: limits.group || staticMeta?.group || 'other',
        pairName,
      };
    });
    return dynamicMarkets.sort((a, b) => {
      if (a.index !== b.index) return a.index - b.index;
      return a.pairName.localeCompare(b.pairName);
    });
  }, [pairLeverageLimits]);
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
    if (!isOpen) setShowPerpsHistoryModal(false);
  }, [isOpen]);
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

  // Unified UA balance shown in Perps flows
  const unifiedUaBalance = useMemo(() => {
    if (!assets?.totalAmountInUSD) return 0;
    return Number(assets.totalAmountInUSD);
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
    if (baseEntry) {
      const baseAmount =
        typeof baseEntry.amount === "string"
          ? parseFloat(baseEntry.amount)
          : Number(baseEntry.amount || 0);
      return Number.isFinite(baseAmount) ? baseAmount : 0;
    }

    // Fallback when chain breakdown isn't available from SDK response.
    const totalAmount =
      typeof usdcAsset.amount === "string"
        ? parseFloat(usdcAsset.amount)
        : Number(usdcAsset.amount || 0);
    return Number.isFinite(totalAmount) ? totalAmount : 0;
  }, [assets]);
  // Perps trades execute from owner EOA; collateral checks/MAX should use EOA USDC.
  const usdcBalance = eoaUsdcBalance;

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

  // Fetch current price from Pyth oracle
  useEffect(() => {
    const fetchPythPrice = async () => {
      const feedId = pairLeverageLimits[selectedPair.name]?.feedId;
      if (!feedId) {
        console.log('[Perps] No Pyth feed ID for', selectedPair.name);
        setCurrentPrice(null);
        return;
      }
      
      try {
        // Pyth Hermes API for real-time prices
        const response = await fetch(
          `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`
        );
        const data = await response.json();
        
        if (data.parsed?.[0]?.price) {
          const priceData = data.parsed[0].price;
          // Pyth returns price with exponent, e.g. price=9500000000, expo=-8 means $95000.00
          const price = Number(priceData.price) * Math.pow(10, priceData.expo);
          setCurrentPrice(price);
          console.log('[Perps] Pyth price for', selectedPair.name, ':', price);
        } else {
          setCurrentPrice(null);
        }
      } catch (err) {
        console.error('[Perps] Failed to fetch Pyth price:', err);
        setCurrentPrice(null);
      }
    };
    
    fetchPythPrice();
    // Refresh price every 5 seconds
    const interval = setInterval(fetchPythPrice, 5000);
    return () => clearInterval(interval);
  }, [selectedPair, pairLeverageLimits]);

  // Fetch all market prices for the markets list
  useEffect(() => {
    const fetchAllPrices = async () => {
      const prices: Record<string, { price: number; change24h: number }> = {};
      const feedTargets = availableMarkets
        .map((market) => ({
          pairName: market.pairName,
          feedId: pairLeverageLimits[market.pairName]?.feedId,
        }))
        .filter((x): x is { pairName: string; feedId: string } => !!x.feedId);
      if (feedTargets.length === 0) {
        setMarketPrices({});
        return;
      }

      const uniqueFeedIds = Array.from(new Set(feedTargets.map((x) => x.feedId)));
      const params = new URLSearchParams();
      for (const id of uniqueFeedIds) {
        params.append('ids[]', id);
      }
      try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?${params.toString()}`);
        const data = await response.json();
        const parsed = Array.isArray(data?.parsed) ? data.parsed : [];
        const priceByFeedId = new Map<string, number>();
        const normalizeFeedId = (id: string) => id.replace(/^0x/i, '').toLowerCase();
        for (const item of parsed) {
          const id = typeof item?.id === 'string' ? item.id : '';
          const p = item?.price;
          if (!id || !p || !Number.isFinite(Number(p.price)) || !Number.isFinite(Number(p.expo))) continue;
          const price = Number(p.price) * Math.pow(10, Number(p.expo));
          if (Number.isFinite(price) && price > 0) {
            priceByFeedId.set(normalizeFeedId(id), price);
          }
        }
        for (const { pairName, feedId } of feedTargets) {
          const price = priceByFeedId.get(normalizeFeedId(feedId));
          if (!price) continue;
          prices[pairName] = { price, change24h: 0 };
        }
      } catch {
        // no static fallbacks in production market data path
      }
      
      setMarketPrices(prices);
    };
    
    if (isOpen && view === 'markets') {
      fetchAllPrices();
    }
  }, [isOpen, view, availableMarkets, pairLeverageLimits]);

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

          limitsMap[pairName] = {
            pairIndex: Number.isFinite(parsedPairIndex) ? parsedPairIndex : undefined,
            standardMin: Number.isFinite(standardMin) && standardMin > 0 ? standardMin : 2,
            standardMax,
            zfpMin: Number.isFinite(zfpMin) && zfpMin > 0 ? zfpMin : standardMin,
            zfpMax: Number.isFinite(zfpMax) && zfpMax > 0 ? zfpMax : standardMax,
            pairOI: Number.isFinite(Number(info.pairOI)) ? Number(info.pairOI) : 0,
            pairMaxOI: Number.isFinite(Number(info.pairMaxOI)) ? Number(info.pairMaxOI) : 0,
            feedId: typeof info.feed?.feedId === 'string' ? info.feed.feedId : undefined,
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
      } catch {
        // Keep static fallback limits if API fails.
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
      fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [eoa, 'latest'], id: 1 }),
      }).then(r => r.json()),
      fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: BASE_USDC_ADDRESS, data: encodeFunctionData({
            abi: [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [eoa as `0x${string}`],
          }) }, 'latest'],
          id: 1,
        }),
      }).then(r => r.json()),
    ]);

    const eth = ethRes?.result ? Number(BigInt(ethRes.result)) / 1e18 : 0;
    const usdc = usdcRes?.result ? Number(BigInt(usdcRes.result)) / 1e6 : 0;
    return { eth, usdc };
  }, [BASE_USDC_ADDRESS]);

  // Resolve owner EOA and balances (execution wallet)
  useEffect(() => {
    const loadOwner = async () => {
      if (!isOpen) return;
      try {
        let eoa = '';
        let walletAccount = '';
        let ownerFromUa = '';

        if (primaryWallet) {
          const walletClient = primaryWallet.getWalletClient();
          walletAccount = walletClient?.account?.address || '';
        }

        if (universalAccount) {
          const opts = await universalAccount.getSmartAccountOptions();
          ownerFromUa = (opts?.ownerAddress as string) || '';
        }

        // Prefer the underlying owner EOA when available, since Perps executes from EOA.
        eoa = ownerFromUa || walletAccount;
        if (ownerFromUa && walletAccount && ownerFromUa.toLowerCase() !== walletAccount.toLowerCase()) {
          addDebug(`Owner address override: wallet=${walletAccount.slice(0, 8)}... -> ownerEOA=${ownerFromUa.slice(0, 8)}...`);
        }

        setOwnerEOA(eoa);
        if (!eoa) return;

        const { eth, usdc } = await fetchOwnerBalances(eoa);
        setEoaEthBalance(eth);
        setEoaUsdcBalance(usdc);
      } catch {
        // ignore
      }
    };
    loadOwner();
  }, [isOpen, primaryWallet, universalAccount, fetchOwnerBalances]);

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
    const resp = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    }).then(r => r.json());
    return resp?.result as string | undefined;
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

  const fetchExecutionFeeWei = useCallback(async (updateCount = 1) => {
    try {
      const pythCalldata = encodeFunctionData({
        abi: PYTH_ABI,
        functionName: 'getUpdateFee',
        args: [BigInt(Math.max(1, updateCount))],
      });
      const feeHex = await baseRpcCall('eth_call', [{ to: PYTH_CONTRACT_ADDRESS, data: pythCalldata }, 'latest']);
      if (!feeHex) return BigInt(5e14);
      const raw = BigInt(feeHex);
      return (raw * BigInt(120)) / BigInt(100); // +20% buffer
    } catch {
      return BigInt(5e14);
    }
  }, [baseRpcCall]);

  const fetchPythUpdateData = useCallback(async (pairName: string) => {
    const feedId = pairLeverageLimits[pairName]?.feedId;
    if (!feedId) return [] as string[];
    try {
      const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`);
      const json = await response.json();
      const updates = Array.isArray(json?.binary?.data) ? json.binary.data : [];
      return updates.filter((x: unknown) => typeof x === 'string') as string[];
    } catch {
      return [] as string[];
    }
  }, [pairLeverageLimits]);

  const fetchOpenPositions = useCallback(async () => {
    if (!ownerEOA) {
      setDisplayOpenPositions([]);
      previousPositionIdsRef.current = new Set();
      return;
    }
    setPositionsLoading(true);
    try {
      const knownPairCount = availableMarkets.reduce((count, market) => {
        const pairName = market.pairName;
        return pairLeverageLimits[pairName]?.pairIndex !== undefined ? count + 1 : count;
      }, 0);
      if (knownPairCount === 0) {
        // Socket metadata not ready yet; preserve current UI until we can query positions reliably.
        return;
      }

      const positions: OpenPerpsPosition[] = [];
      let queriedAnyCountSuccessfully = false;
      for (const market of availableMarkets) {
        const pairName = market.pairName;
        const pairIndex = pairLeverageLimits[pairName]?.pairIndex;
        if (pairIndex === undefined) continue;

        const countCallData = encodeFunctionData({
          abi: AVANTIS_TRADING_STORAGE_ABI,
          functionName: 'openTradesCount',
          args: [ownerEOA as `0x${string}`, BigInt(pairIndex)],
        });
        const countHex = await baseRpcCall('eth_call', [{ to: AVANTIS_TRADING_STORAGE_ADDRESS, data: countCallData }, 'latest']);
        if (typeof countHex === 'string') queriedAnyCountSuccessfully = true;
        const openCount = countHex ? Number(BigInt(countHex)) : 0;
        if (!Number.isFinite(openCount) || openCount <= 0) continue;

        // Position indices may not be contiguous after closes, so scan a wider window.
        const scanLimit = Math.min(60, Math.max(20, openCount * 3));
        const seenIndices = new Set<number>();
        for (let i = 0; i < scanLimit; i++) {
          const tradeCallData = encodeFunctionData({
            abi: AVANTIS_TRADING_STORAGE_ABI,
            functionName: 'openTrades',
            args: [ownerEOA as `0x${string}`, BigInt(pairIndex), BigInt(i)],
          });
          const tradeHex = await baseRpcCall('eth_call', [{ to: AVANTIS_TRADING_STORAGE_ADDRESS, data: tradeCallData }, 'latest']);
          if (!tradeHex) continue;
          const trade = decodeFunctionResult({
            abi: AVANTIS_TRADING_STORAGE_ABI,
            functionName: 'openTrades',
            data: tradeHex as `0x${string}`,
          }) as {
            trader: `0x${string}`;
            index: bigint;
            initialPosToken: bigint;
            positionSizeUSDC: bigint;
            openPrice: bigint;
            buy: boolean;
            leverage: bigint;
            tp: bigint;
            sl: bigint;
            timestamp: bigint;
          };
          if (!trade || trade.trader.toLowerCase() === '0x0000000000000000000000000000000000000000') continue;
          const positionIndex = Number(trade.index);
          if (!Number.isFinite(positionIndex) || positionIndex < 0) continue;
          if (seenIndices.has(positionIndex)) continue;
          seenIndices.add(positionIndex);

          const infoCallData = encodeFunctionData({
            abi: AVANTIS_TRADING_STORAGE_ABI,
            functionName: 'openTradesInfo',
            args: [ownerEOA as `0x${string}`, BigInt(pairIndex), BigInt(positionIndex)],
          });
          const infoHex = await baseRpcCall('eth_call', [{ to: AVANTIS_TRADING_STORAGE_ADDRESS, data: infoCallData }, 'latest']);
          let beingMarketClosed = false;
          if (infoHex) {
            const info = decodeFunctionResult({
              abi: AVANTIS_TRADING_STORAGE_ABI,
              functionName: 'openTradesInfo',
              data: infoHex as `0x${string}`,
            }) as { beingMarketClosed: boolean };
            beingMarketClosed = !!info?.beingMarketClosed;
          }

          const leverageNum = Number(trade.leverage) / 1e10;
          const initialCollateralUsd = Number(trade.initialPosToken) / 1e6;
          const rawPositionUsd = Number(trade.positionSizeUSDC) / 1e6;
          const collateralUsd = initialCollateralUsd > 0
            ? initialCollateralUsd
            : leverageNum > 0
              ? rawPositionUsd / leverageNum
              : rawPositionUsd;
          if (!Number.isFinite(collateralUsd) || collateralUsd <= 0) continue;
          const sizeUsd = rawPositionUsd > 0 ? rawPositionUsd : collateralUsd * leverageNum;
          const entryPrice = Number(trade.openPrice) / 1e10;
          const markPrice = marketPricesRef.current[pairName]?.price || entryPrice;
          const pnlUsd = trade.buy
            ? ((markPrice - entryPrice) / Math.max(entryPrice, 1e-9)) * sizeUsd
            : ((entryPrice - markPrice) / Math.max(entryPrice, 1e-9)) * sizeUsd;
          const pnlPercent = collateralUsd > 0 ? (pnlUsd / collateralUsd) * 100 : 0;
          const liqDistance = (entryPrice / Math.max(leverageNum, 1e-9)) * 0.9;
          const liquidationPrice = trade.buy ? entryPrice - liqDistance : entryPrice + liqDistance;
          positions.push({
            id: `${pairIndex}-${positionIndex}`,
            pairName,
            symbol: market.symbol,
            pairIndex,
            positionIndex,
            isLong: trade.buy,
            collateralUsd,
            sizeUsd,
            leverage: leverageNum,
            entryPrice,
            markPrice,
            pnlUsd,
            pnlPercent,
            liquidationPrice,
            beingMarketClosed,
            tpPrice: Number(trade.tp) > 0 ? Number(trade.tp) / 1e10 : 0,
            slPrice: Number(trade.sl) > 0 ? Number(trade.sl) / 1e10 : 0,
            timestamp: Number(trade.timestamp),
          });
          if (positions.filter((p) => p.pairIndex === pairIndex).length >= openCount) break;
        }
      }
      positions.sort((a, b) => b.timestamp - a.timestamp);
      if (!queriedAnyCountSuccessfully) {
        addDebug('Positions refresh skipped (temporary RPC gap), keeping last known positions visible.');
        return;
      }

      const currentIds = new Set(positions.map((p) => p.id));
      for (const oldId of Array.from(previousPositionIdsRef.current)) {
        if (!currentIds.has(oldId)) {
          const [oldPairIndex] = oldId.split('-');
          const oldPair = Object.entries(pairLeverageLimits).find(([, v]) => String(v.pairIndex) === oldPairIndex)?.[0] || 'Unknown';
          upsertPerpsActivity({
            id: `removed-${oldId}-${Date.now()}`,
            action: 'Position removed (closed/liquidated)',
            pairName: oldPair,
            txHash: '-',
            status: 'confirmed',
            timestamp: Date.now(),
          });
        }
      }
      previousPositionIdsRef.current = currentIds;

      setDisplayOpenPositions(positions);
      setPositionEdits((prev) => {
        const next = { ...prev };
        for (const p of positions) {
          if (!next[p.id]) {
            next[p.id] = {
              tp: p.tpPrice > 0 ? p.tpPrice.toString() : '',
              sl: p.slPrice > 0 ? p.slPrice.toString() : '',
            };
          }
        }
        return next;
      });
    } catch (e) {
      addDebug(`Positions fetch failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPositionsLoading(false);
    }
  }, [ownerEOA, pairLeverageLimits, baseRpcCall, upsertPerpsActivity, availableMarkets]);

  useEffect(() => {
    if (!isOpen || !ownerEOA) return;
    fetchOpenPositions();
    const t = setInterval(fetchOpenPositions, 20000);
    return () => clearInterval(t);
  }, [isOpen, ownerEOA, fetchOpenPositions]);

  const handleDepositToEOA = async () => {
    if (!universalAccount || !primaryWallet || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Depositing to owner EOA...');
    addDebug(`Deposit start -> owner EOA ${ownerEOA}`);

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
            const res = await universalAccount.sendTransaction(tx, signature as string);
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
          'Transfer USDC to owner EOA',
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
          'Transfer ETH to owner EOA',
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

  const handleOpenPosition = async () => {
    if (!universalAccount || !collateral) {
      setError('Please enter collateral amount');
      return;
    }

    if (!primaryWallet) {
      setError('Please connect wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Preparing position...');
    setTxResult(null);
    setDebugLog([]); // Clear previous logs

    try {
      const collateralAmount = parseFloat(collateral);
      const tpPrice = takeProfit ? parseFloat(takeProfit) : 0;
      const slPrice = stopLoss ? parseFloat(stopLoss) : 0;
      if (isZeroFeeMode && !zfpAvailable) {
        setError(`Zero Fee Perps is not available for ${selectedPair.name} right now.`);
        setIsLoading(false);
        return;
      }
      if (leverage < leverageMin || leverage > leverageMax) {
        setError(`Leverage for ${selectedPair.name} must be between ${leverageMin}x and ${leverageMax}x${isZeroFeeMode ? ' in Zero Fee mode' : ''}.`);
        setIsLoading(false);
        return;
      }
      
      // Minimum position size validation ($100 for most pairs)
      const positionValue = collateralAmount * leverage;
      if (positionValue < 100) {
        setError(`Position too small. Minimum is $100. You have $${positionValue.toFixed(0)} ($${collateralAmount} × ${leverage}x). Increase collateral or leverage.`);
        setIsLoading(false);
        return;
      }
      
      addDebug(`Collateral: $${collateralAmount}, Leverage: ${leverage}x, Position: $${positionValue}`);
      addDebug(`Pair: ${selectedPair.name}, Direction: ${isLong ? 'LONG' : 'SHORT'}`);
      addDebug(`Mode: ${isZeroFeeMode ? 'Zero Fee Perps (MARKET_ZERO_FEE)' : 'Standard Perps (MARKET)'}`);
      if (executionPairIndex !== selectedPair.index) {
        addDebug(`Pair index remap: UI ${selectedPair.index} -> Socket ${executionPairIndex}`);
      }
      
      console.log('[Perps] Opening position:', {
        pair: selectedPair.name,
        pairIndex: executionPairIndex,
        isLong,
        leverage,
        collateral: collateralAmount,
        takeProfit: tpPrice,
        stopLoss: slPrice,
        currentPrice,
      });

      // Convert values using Avantis decimal conventions:
      // USDC: 6 decimals, Prices/Leverage/Slippage: 10 decimals, ETH: 18 decimals
      const openPriceScaled = BigInt(Math.floor((currentPrice || 0) * 1e10));
      const leverageScaled = BigInt(Math.floor(leverage * 1e10));
      // positionSizeUSDC = collateral in 6 decimals (NOT position size - SDK naming is misleading)
      // The contract uses leverage separately to calculate actual position size
      const positionSizeUSDC = BigInt(Math.floor(collateralAmount * 1e6));
      const tpScaled = tpPrice > 0 ? BigInt(Math.floor(tpPrice * 1e10)) : BigInt(0);
      const slScaled = slPrice > 0 ? BigInt(Math.floor(slPrice * 1e10)) : BigInt(0);
      const slippageP = BigInt(1e8); // 1% slippage (1e8 / 1e10 = 0.01 = 1%)
      
      // Query Pyth for dynamic execution fee
      let executionFee: bigint;
      try {
        addDebug('Querying Pyth for execution fee...');
        const pythCalldata = encodeFunctionData({
          abi: PYTH_ABI,
          functionName: 'getUpdateFee',
          args: [BigInt(1)], // 1 price feed update
        });
        const pythResponse = await fetch('https://mainnet.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: PYTH_CONTRACT_ADDRESS, data: pythCalldata }, 'latest'],
            id: 1,
          }),
        });
        const pythResult = await pythResponse.json();
        if (pythResult.result) {
          executionFee = BigInt(pythResult.result);
          // Add 20% buffer for safety
          executionFee = (executionFee * BigInt(120)) / BigInt(100);
          addDebug(`Pyth fee: ${(Number(executionFee) / 1e18).toFixed(6)} ETH`);
        } else {
          throw new Error('Pyth returned no result');
        }
      } catch (pythErr) {
        console.warn('[Perps] Failed to query Pyth fee, using fallback:', pythErr);
        executionFee = BigInt(5e14); // Fallback: 0.0005 ETH
        addDebug(`Using fallback fee: 0.0005 ETH`);
      }

      console.log('[Perps] Scaled values:', {
        openPriceScaled: openPriceScaled.toString(),
        leverageScaled: leverageScaled.toString(),
        positionSizeUSDC: positionSizeUSDC.toString(),
        tpScaled: tpScaled.toString(),
        slScaled: slScaled.toString(),
      });

      // Use owner EOA as Avantis trader/signer (not UA smart account)
      const walletClient = primaryWallet.getWalletClient();
      const traderAddress = ownerEOA || walletClient?.account?.address || '';
      if (!traderAddress) {
        throw new Error('Could not determine owner EOA address. Please reconnect wallet.');
      }
      const walletProvider = walletClient as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      const parseChainId = (hexChainId: unknown) => {
        if (typeof hexChainId !== 'string') return NaN;
        try {
          return Number(BigInt(hexChainId));
        } catch {
          return NaN;
        }
      };
      const ensureWalletOnBase = async () => {
        const currentChainRaw = await walletProvider.request({ method: 'eth_chainId' });
        let currentChain = parseChainId(currentChainRaw);
        if (currentChain === 8453) {
          addDebug('Wallet chain verified: Base (8453)');
          return;
        }

        addDebug(`Wallet chain ${Number.isFinite(currentChain) ? currentChain : 'unknown'} detected. Requesting switch to Base...`);
        try {
          await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        } catch (switchErr) {
          const err = switchErr as { code?: number; message?: string };
          const msg = (err?.message || '').toLowerCase();
          const unknownChain = err?.code === 4902 || msg.includes('unrecognized chain') || msg.includes('unknown chain');
          if (!unknownChain) throw switchErr;

          addDebug('Base chain not found in wallet. Attempting wallet_addEthereumChain...');
          await walletProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            }],
          });
          await walletProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        }

        currentChain = parseChainId(await walletProvider.request({ method: 'eth_chainId' }));
        if (currentChain !== 8453) {
          throw new Error(`Wallet must be on Base for Perps. Current chain: ${Number.isFinite(currentChain) ? currentChain : 'unknown'}`);
        }
        addDebug('Wallet switched to Base (8453)');
      };
      addDebug(`Owner EOA trader: ${traderAddress.slice(0, 10)}...${traderAddress.slice(-8)}`);

      const approvalSpenders = [
        { label: 'trading', address: AVANTIS_TRADING_ADDRESS as `0x${string}` },
        { label: 'trading storage', address: AVANTIS_TRADING_STORAGE_ADDRESS as `0x${string}` },
      ];
      const buildApproveCalldata = (spender: `0x${string}`, amount: bigint) => encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spender, amount],
      });
      // Default approve payload used for gas estimation only.
      const approveCalldata = buildApproveCalldata(approvalSpenders[0].address, AVANTIS_APPROVAL_CAP_USDC);
      
      console.log('[Perps] USDC approval calldata:', approveCalldata);

      // Step 2: Encode the openTrade call (inner calldata)
      const timestamp = BigInt(0); // SDK-compatible for new orders
      const orderTypeValue = isZeroFeeMode ? 3 : 0; // 0=MARKET, 3=MARKET_ZERO_FEE
      const innerOpenTradeCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: 'openTrade',
        args: [
          {
            trader: traderAddress as `0x${string}`,
            pairIndex: BigInt(executionPairIndex),
            index: BigInt(0), // Contract finds first empty index
            initialPosToken: BigInt(0), // Not used for USDC collateral
            positionSizeUSDC: positionSizeUSDC,
            openPrice: openPriceScaled,
            buy: isLong,
            leverage: leverageScaled,
            tp: tpScaled,
            sl: slScaled,
            timestamp: timestamp,
          },
          orderTypeValue,
          slippageP,
        ],
      });

      // Use direct openTrade call (not delegatedAction)
      // Particle's simulation should set msg.sender = smart account
      const openTradeCalldata = innerOpenTradeCalldata;

      addDebug(`OpenTrade calldata length: ${openTradeCalldata.length}`);
      addDebug(`Position USDC: ${positionSizeUSDC.toString()}, Price: ${openPriceScaled.toString()}`);
      setLoadingStatus('Creating transaction...');

      // Create universal transaction via UA with BOTH transactions:
      // 1. Approve USDC to Avantis
      // 2. Open the trade
      console.log('[Perps] Creating UA transaction with params:', {
        chainId: 8453,
        collateralAmount: collateralAmount.toString(),
        executionFee: executionFee.toString(),
        executionFeeHex: '0x' + executionFee.toString(16),
        traderAddress,
        pairIndex: executionPairIndex,
        leverage,
        isLong,
        orderTypeValue,
        positionSizeUSDC: positionSizeUSDC.toString(),
        openPrice: openPriceScaled.toString(),
        approveCapUSDC: AVANTIS_APPROVAL_CAP_USDC.toString(),
      });
      
      // EOA execution path (same model as PerpsTrader): approve + openTrade directly from owner EOA
      addDebug(`Trader(EOA): ${traderAddress}`);
      addDebug(`Leverage: ${leverage}x`);
      addDebug(`OrderType: ${isZeroFeeMode ? 'MARKET_ZERO_FEE (3)' : 'MARKET (0)'}`);

      const waitReceipt = async (txHash: string) => {
        for (let i = 0; i < 30; i++) {
          const resp = await fetch('https://mainnet.base.org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
          }).then(r => r.json());
          if (resp?.result) return resp.result;
          await new Promise(r => setTimeout(r, 2000));
        }
        throw new Error('Transaction confirmation timeout');
      };

      const valueHex = `0x${executionFee.toString(16)}`;
      const formatEth = (wei: bigint) => (Number(wei) / 1e18).toFixed(6);
      const formatGwei = (wei: bigint) => (Number(wei) / 1e9).toFixed(3);
      const asErrMsg = (e: unknown) => e instanceof Error ? e.message : String(e);
      const approveTxParams = {
        from: traderAddress,
        to: BASE_USDC_ADDRESS,
        data: approveCalldata,
      };
      const tradeTxParams = {
        from: traderAddress,
        to: AVANTIS_TRADING_ADDRESS,
        data: openTradeCalldata,
        value: valueHex,
      };

      // Preflight check for native ETH needed by:
      // 1) USDC approve gas, 2) openTrade gas, 3) openTrade execution fee value
      setLoadingStatus('Checking owner EOA gas...');
      const rpcCall = async (method: string, params: unknown[]) => {
        const resp = await fetch('https://mainnet.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
        }).then(r => r.json());
        return resp?.result as string | undefined;
      };
      const walletCall = async (method: string, params: unknown[]) => {
        try {
          return await walletProvider.request({ method, params });
        } catch (err) {
          addDebug(`wallet ${method} failed: ${asErrMsg(err)}`);
          return undefined;
        }
      };

      const [ethBalanceHex, gasPriceHex] = await Promise.all([
        rpcCall('eth_getBalance', [traderAddress, 'latest']),
        rpcCall('eth_gasPrice', []),
      ]);
      const ownerEthWei = ethBalanceHex ? BigInt(ethBalanceHex) : BigInt(0);
      const gasPriceWei = gasPriceHex ? BigInt(gasPriceHex) : BigInt(1_500_000_000); // 1.5 gwei fallback

      // Conservative fallbacks if estimateGas fails.
      let approveGas = BigInt(80_000);
      let tradeGas = BigInt(450_000);
      try {
        const approveGasHex = await rpcCall('eth_estimateGas', [approveTxParams]);
        if (approveGasHex) approveGas = BigInt(approveGasHex);
      } catch {
        addDebug('approve gas estimation failed, using fallback 80k');
      }
      try {
        const tradeGasHex = await rpcCall('eth_estimateGas', [tradeTxParams]);
        if (tradeGasHex) tradeGas = BigInt(tradeGasHex);
      } catch {
        addDebug('openTrade gas estimation failed, using fallback 450k');
      }

      const gasCostWei = ((approveGas + tradeGas) * gasPriceWei * BigInt(120)) / BigInt(100); // +20% buffer
      const minNeededWei = executionFee + gasCostWei;
      addDebug(`EOA ETH: ${formatEth(ownerEthWei)}, Required ETH: ${formatEth(minNeededWei)} (fee ${formatEth(executionFee)} + gas ${formatEth(gasCostWei)})`);

      if (ownerEthWei < minNeededWei) {
        const missingWei = minNeededWei - ownerEthWei;
        throw new Error(
          `Insufficient ETH for approve + open trade. Need ~${formatEth(minNeededWei)} ETH, have ${formatEth(ownerEthWei)} ETH. Top up at least ~${formatEth(missingWei)} ETH and retry.`
        );
      }

      setLoadingStatus('Ensuring Base network...');
      await ensureWalletOnBase();

      // Extra diagnostics using the same wallet provider that will send the transaction.
      setLoadingStatus('Collecting wallet send context...');
      const [walletChainIdHex, walletAccountsRaw, walletBalanceHex, walletGasPriceHex, walletApproveGasHex, walletTradeGasHex] =
        await Promise.all([
          walletCall('eth_chainId', []),
          walletCall('eth_accounts', []),
          walletCall('eth_getBalance', [traderAddress, 'latest']),
          walletCall('eth_gasPrice', []),
          walletCall('eth_estimateGas', [approveTxParams]),
          walletCall('eth_estimateGas', [tradeTxParams]),
        ]);

      const walletChainId = typeof walletChainIdHex === 'string' ? Number(BigInt(walletChainIdHex)) : NaN;
      const walletAccounts = Array.isArray(walletAccountsRaw) ? walletAccountsRaw.map(a => String(a)) : [];
      const walletPrimary = walletAccounts[0] || '';
      const fromMatchesWalletPrimary = !!walletPrimary && walletPrimary.toLowerCase() === traderAddress.toLowerCase();
      const walletBalanceWei = typeof walletBalanceHex === 'string' ? BigInt(walletBalanceHex) : BigInt(0);
      const walletGasPriceWei = typeof walletGasPriceHex === 'string' ? BigInt(walletGasPriceHex) : gasPriceWei;
      const walletApproveGas = typeof walletApproveGasHex === 'string' ? BigInt(walletApproveGasHex) : approveGas;
      const walletTradeGas = typeof walletTradeGasHex === 'string' ? BigInt(walletTradeGasHex) : tradeGas;
      const walletGasCostWei = ((walletApproveGas + walletTradeGas) * walletGasPriceWei * BigInt(120)) / BigInt(100);
      const walletMinNeededWei = executionFee + walletGasCostWei;

      addDebug(`Wallet context: chainId=${Number.isFinite(walletChainId) ? walletChainId : 'unknown'}, trader=${traderAddress}, walletPrimary=${walletPrimary || 'none'}`);
      addDebug(`Wallet account match: ${fromMatchesWalletPrimary ? 'yes' : 'no'}`);
      addDebug(`Wallet ETH: ${formatEth(walletBalanceWei)} | Wallet required ETH: ${formatEth(walletMinNeededWei)} (fee ${formatEth(executionFee)} + gas ${formatEth(walletGasCostWei)})`);
      addDebug(`Wallet gasPrice: ${formatGwei(walletGasPriceWei)} gwei | approveGas: ${walletApproveGas.toString()} | tradeGas: ${walletTradeGas.toString()}`);
      if (Number.isFinite(walletChainId) && walletChainId !== 8453) {
        addDebug(`WARNING: wallet chainId ${walletChainId} is not Base (8453).`);
      }

      const requiredAllowanceWei = positionSizeUSDC;
      addDebug(`Allowance required (USDC 6d): ${requiredAllowanceWei.toString()}`);
      if (requiredAllowanceWei > AVANTIS_APPROVAL_CAP_USDC) {
        throw new Error(
          `Trade requires allowance ${requiredAllowanceWei.toString()} but approval cap is ${AVANTIS_APPROVAL_CAP_USDC.toString()} (10,000 USDC).`
        );
      }

      const sendApproveAndWait = async (approvalData: `0x${string}`, logMessage: string) => {
        setLoadingStatus('Approving USDC from owner EOA...');
        addDebug(logMessage);
        const hash = await walletProvider.request({
          method: 'eth_sendTransaction',
          params: [{ ...approveTxParams, data: approvalData }],
        }) as string;
        addDebug(`Approve tx hash: ${hash}`);
        const receipt = await waitReceipt(hash) as { status?: string };
        addDebug(`Approve receipt status: ${receipt?.status || 'unknown'}`);
        return receipt?.status === '0x1';
      };
      const readAllowanceForSpender = async (spender: `0x${string}`, label: string) => {
        const allowanceCalldata = encodeFunctionData({
          abi: ERC20_ALLOWANCE_ABI,
          functionName: 'allowance',
          args: [traderAddress as `0x${string}`, spender],
        });
        const allowanceHex = await walletCall('eth_call', [{ to: BASE_USDC_ADDRESS, data: allowanceCalldata }, 'latest']);
        const allowanceWei = typeof allowanceHex === 'string' ? BigInt(allowanceHex) : BigInt(0);
        addDebug(`Current allowance to ${label}: ${allowanceWei.toString()} (cap ${AVANTIS_APPROVAL_CAP_USDC.toString()})`);
        return allowanceWei;
      };
      const ensureAllowanceForSpender = async (spender: `0x${string}`, label: string) => {
        let allowanceWei = await readAllowanceForSpender(spender, label);
        if (allowanceWei >= requiredAllowanceWei) {
          addDebug(`Sufficient existing USDC allowance for ${label}; skipping approve step.`);
          return;
        }

        await sendApproveAndWait(
          buildApproveCalldata(spender, AVANTIS_APPROVAL_CAP_USDC),
          `Allowance below required for ${label}, sending 10,000 USDC cap approval...`,
        );
        allowanceWei = await readAllowanceForSpender(spender, label);

        // Some wallets/tokens require approve(0) before changing a non-zero allowance.
        if (allowanceWei < requiredAllowanceWei) {
          addDebug(`Allowance for ${label} still insufficient; attempting reset-to-zero then re-approve.`);
          await sendApproveAndWait(buildApproveCalldata(spender, BigInt(0)), `Resetting ${label} allowance to 0...`);
          addDebug(`Allowance after ${label} reset: ${(await readAllowanceForSpender(spender, label)).toString()}`);
          await sendApproveAndWait(buildApproveCalldata(spender, AVANTIS_APPROVAL_CAP_USDC), `Re-applying 10,000 USDC cap approval for ${label}...`);
          allowanceWei = await readAllowanceForSpender(spender, label);
        }

        if (allowanceWei < requiredAllowanceWei) {
          throw new Error(
            `USDC allowance still below required amount for ${label}. required=${requiredAllowanceWei.toString()}, current=${allowanceWei.toString()}`
          );
        }
      };

      for (const spender of approvalSpenders) {
        await ensureAllowanceForSpender(spender.address, spender.label);
      }

      setLoadingStatus('Opening position from owner EOA...');
      addDebug(`Sending openTrade transaction (value ${formatEth(executionFee)} ETH)...`);
      const tradeHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [tradeTxParams],
      }) as string;
      addDebug(`OpenTrade tx hash: ${tradeHash}`);
      upsertPerpsActivity({
        id: `open-${tradeHash}`,
        action: 'Open',
        pairName: selectedPair.name,
        txHash: tradeHash,
        status: 'pending',
        timestamp: Date.now(),
      });

      setTxResult({ txId: tradeHash, status: 'pending', action: 'open' });
      setLoadingStatus('Position opening...');
      const tradeReceipt = await waitReceipt(tradeHash) as { status?: string };
      addDebug(`OpenTrade receipt status: ${tradeReceipt?.status || 'unknown'}`);
      if (tradeReceipt?.status !== '0x1') {
        upsertPerpsActivity({
          id: `open-${tradeHash}`,
          action: 'Open',
          pairName: selectedPair.name,
          txHash: tradeHash,
          status: 'failed',
          timestamp: Date.now(),
        });
        throw new Error(`OpenTrade transaction failed onchain. status=${tradeReceipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({
        id: `open-${tradeHash}`,
        action: 'Open',
        pairName: selectedPair.name,
        txHash: tradeHash,
        status: 'confirmed',
        timestamp: Date.now(),
      });
      setTxResult({ txId: tradeHash, status: 'complete', action: 'open' });
      setLoadingStatus('Position opened');
      await fetchOpenPositions();
      setTimeout(() => setTxResult(null), 2500);

      // Reset form
      setCollateral('');
      setTakeProfit('');
      setStopLoss('');
    } catch (err) {
      // Extract error details for debug
      let errorDetails = '';
      if (err && typeof err === 'object') {
        const anyErr = err as Record<string, unknown>;
        if (anyErr.data) errorDetails += ` Data: ${JSON.stringify(anyErr.data)}`;
        if (anyErr.reason) errorDetails += ` Reason: ${anyErr.reason}`;
        if (anyErr.code) errorDetails += ` Code: ${anyErr.code}`;
      }
      addDebug(`FINAL ERROR: ${err instanceof Error ? err.message : String(err)}${errorDetails}`);
      
      // Parse common error messages for better UX
      let errorMessage = 'Failed to open position';
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        const fullMsg = err.message; // Keep original for display
        
        if (msg.includes('leverage_incorrect')) {
          errorMessage = `Invalid leverage for ${selectedPair.name}. Use ${leverageMin}x-${leverageMax}x${isZeroFeeMode ? ' in Zero Fee mode' : ''}.`;
        } else if (msg.includes('simulation') || msg.includes('revert')) {
          // Show full error for debugging + trader address for verification
          errorMessage = `Simulation failed: ${fullMsg.slice(0, 100)}${errorDetails ? ' ' + errorDetails : ''}`;
        } else if (msg.includes('insufficient') || msg.includes('balance')) {
          errorMessage = 'Insufficient balance for this trade.';
        } else if (msg.includes('allowance')) {
          errorMessage = 'USDC approval failed. Please try again.';
        } else if (msg.includes('rejected') || msg.includes('denied')) {
          errorMessage = 'Transaction was rejected.';
        } else if (msg.includes('trader')) {
          errorMessage = 'Could not determine trader address. Please reconnect your wallet.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleClosePosition = async (position: OpenPerpsPosition) => {
    if (!primaryWallet || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLoadingStatus('Preparing close...');
    try {
      const walletClient = primaryWallet.getWalletClient();
      const walletProvider = walletClient as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      const parseChainId = (hexChainId: unknown) => {
        if (typeof hexChainId !== 'string') return NaN;
        try {
          return Number(BigInt(hexChainId));
        } catch {
          return NaN;
        }
      };
      const ensureWalletOnBase = async () => {
        const currentChain = parseChainId(await walletProvider.request({ method: 'eth_chainId' }));
        if (currentChain === 8453) return;
        await walletProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      };
      await ensureWalletOnBase();

      const executionFee = await fetchExecutionFeeWei(1);
      const collateralToClose = BigInt(Math.max(1, Math.floor(position.collateralUsd * 1e6)));
      addDebug(`Close args -> pair=${position.pairIndex}, index=${position.positionIndex}, collateralToClose=${collateralToClose.toString()}`);
      const closeCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: 'closeTradeMarket',
        args: [
          BigInt(position.pairIndex),
          BigInt(position.positionIndex),
          collateralToClose,
        ],
      });
      const txHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: ownerEOA,
          to: AVANTIS_TRADING_ADDRESS,
          data: closeCalldata,
          value: `0x${executionFee.toString(16)}`,
        }],
      }) as string;
      addDebug(`Close position tx: ${txHash}`);
      upsertPerpsActivity({
        id: `close-${txHash}`,
        action: 'Close',
        pairName: position.pairName,
        txHash,
        status: 'pending',
        timestamp: Date.now(),
      });
      setTxResult({ txId: txHash, status: 'pending', action: 'close' });
      setLoadingStatus('Closing position...');
      const closeReceipt = await waitForBaseReceipt(txHash) as unknown as { status?: string };
      addDebug(`Close receipt status: ${closeReceipt?.status || 'unknown'}`);
      if (closeReceipt?.status !== '0x1') {
        upsertPerpsActivity({
          id: `close-${txHash}`,
          action: 'Close',
          pairName: position.pairName,
          txHash,
          status: 'failed',
          timestamp: Date.now(),
        });
        throw new Error(`Close transaction failed onchain. status=${closeReceipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({
        id: `close-${txHash}`,
        action: 'Close',
        pairName: position.pairName,
        txHash,
        status: 'confirmed',
        timestamp: Date.now(),
      });
      setTxResult({ txId: txHash, status: 'complete', action: 'close' });
      await fetchOpenPositions();
      setTimeout(() => setTxResult(null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Close failed: ${msg}`);
      addDebug(`Close failed: ${msg}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleUpdatePositionTpSl = async (position: OpenPerpsPosition) => {
    if (!primaryWallet || !ownerEOA) {
      setError('Connect wallet first');
      return;
    }
    const edits = positionEdits[position.id] || { tp: '', sl: '' };
    const tpNum = edits.tp.trim() ? Number(edits.tp) : 0;
    const slNum = edits.sl.trim() ? Number(edits.sl) : 0;
    if ((edits.tp.trim() && (!Number.isFinite(tpNum) || tpNum <= 0)) || (edits.sl.trim() && (!Number.isFinite(slNum) || slNum <= 0))) {
      setError('Enter valid TP/SL price values');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Updating TP/SL...');
    try {
      const walletClient = primaryWallet.getWalletClient();
      const walletProvider = walletClient as unknown as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      const parseChainId = (hexChainId: unknown) => {
        if (typeof hexChainId !== 'string') return NaN;
        try {
          return Number(BigInt(hexChainId));
        } catch {
          return NaN;
        }
      };
      const currentChain = parseChainId(await walletProvider.request({ method: 'eth_chainId' }));
      if (currentChain !== 8453) {
        await walletProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
      }
      const updateData = await fetchPythUpdateData(position.pairName);
      const executionFee = await fetchExecutionFeeWei(updateData.length || 1);
      const updateCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: 'updateTpAndSl',
        args: [
          BigInt(position.pairIndex),
          BigInt(position.positionIndex),
          BigInt(Math.floor(Math.max(0, slNum) * 1e10)),
          BigInt(Math.floor(Math.max(0, tpNum) * 1e10)),
          updateData as `0x${string}`[],
        ],
      });

      const txHash = await walletProvider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: ownerEOA,
          to: AVANTIS_TRADING_ADDRESS,
          data: updateCalldata,
          value: `0x${executionFee.toString(16)}`,
        }],
      }) as string;
      addDebug(`Update TP/SL tx: ${txHash}`);
      upsertPerpsActivity({
        id: `update-${txHash}`,
        action: 'Update TP/SL',
        pairName: position.pairName,
        txHash,
        status: 'pending',
        timestamp: Date.now(),
      });
      setTxResult({ txId: txHash, status: 'pending', action: 'update' });
      const updateReceipt = await waitForBaseReceipt(txHash) as unknown as { status?: string };
      addDebug(`Update TP/SL receipt status: ${updateReceipt?.status || 'unknown'}`);
      if (updateReceipt?.status !== '0x1') {
        upsertPerpsActivity({
          id: `update-${txHash}`,
          action: 'Update TP/SL',
          pairName: position.pairName,
          txHash,
          status: 'failed',
          timestamp: Date.now(),
        });
        throw new Error(`Update TP/SL transaction failed onchain. status=${updateReceipt?.status || 'unknown'}`);
      }
      upsertPerpsActivity({
        id: `update-${txHash}`,
        action: 'Update TP/SL',
        pairName: position.pairName,
        txHash,
        status: 'confirmed',
        timestamp: Date.now(),
      });
      setTxResult({ txId: txHash, status: 'complete', action: 'update' });
      await fetchOpenPositions();
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

  const isLeverageValid =
    leverage >= leverageMin &&
    leverage <= leverageMax &&
    (!isZeroFeeMode || zfpAvailable);
  const canTrade =
    !!collateral &&
    parseFloat(collateral) > 0 &&
    parseFloat(collateral) <= usdcBalance &&
    !!currentPrice &&
    currentPrice > 0 &&
    isLeverageValid;
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
  const filteredSortedMarkets = useMemo(() => {
    const searchLower = marketSearch.trim().toLowerCase();
    const filtered = availableMarkets.filter((m) => {
      const groupOk = marketGroupFilter === 'all' || m.group === marketGroupFilter;
      if (!groupOk) return false;
      if (!searchLower) return true;
      return (
        m.symbol.toLowerCase().includes(searchLower) ||
        m.name.toLowerCase().includes(searchLower) ||
        m.pairName.toLowerCase().includes(searchLower)
      );
    });
    filtered.sort((a, b) => {
      const pa = marketPrices[a.pairName]?.price || 0;
      const pb = marketPrices[b.pairName]?.price || 0;
      const ca = marketPrices[a.pairName]?.change24h || 0;
      const cb = marketPrices[b.pairName]?.change24h || 0;
      const va = pairLeverageLimits[a.pairName]?.pairOI || 0;
      const vb = pairLeverageLimits[b.pairName]?.pairOI || 0;
      if (sortBy === 'price') return pb - pa;
      if (sortBy === 'change') return cb - ca;
      return vb - va;
    });
    return filtered;
  }, [marketSearch, marketGroupFilter, marketPrices, pairLeverageLimits, sortBy, availableMarkets]);
  const totalOpenCollateralUsd = displayOpenPositions.reduce((sum, p) => sum + p.collateralUsd, 0);
  const totalOpenPnlUsd = displayOpenPositions.reduce((sum, p) => sum + p.pnlUsd, 0);

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { setView('markets'); onClose(); }}>
      <div className="pb-8 max-h-[85vh] overflow-y-auto">
        {view === 'markets' ? (
          /* ========== MARKETS VIEW (Rainbow-style) ========== */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="w-10 h-10" />
              <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                <img
                  src={AVANTIS_HEADER_LOGO_URL}
                  alt="Avantis"
                  className="h-8 w-auto"
                />
                <span className="text-xl">Perps</span>
              </h2>
              <button
                onClick={() => setShowPerpsHistoryModal(true)}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <span className="text-gray-400">⏱</span>
              </button>
            </div>

            {/* Available Balance Card */}
            <div className="px-4 mb-5">
              <div className="rounded-2xl border border-gray-700 bg-[#171717] px-3 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1f1f1f] border border-gray-600 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                      alt="USDC"
                      className="w-6 h-6 rounded-full"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-300 font-semibold">Available Balance</div>
                    <div className="text-2xl font-bold text-white">${eoaUsdcBalance.toFixed(2)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setView('deposit')}
                  className="px-5 py-2.5 rounded-xl bg-accent-dynamic text-black font-bold text-sm"
                >
                  Deposit
                </button>
              </div>
            </div>

            {/* Open Positions */}
            <div className="px-4 mb-5">
              <div className="text-gray-500 font-semibold mb-1">Open Positions</div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Total Collateral</div>
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
                          Update TP/SL
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
              <div className="flex gap-2 mt-2">
                {(['all', 'crypto', 'forex', 'commodities', 'equity', 'other'] as const).map((group) => (
                  <button
                    key={group}
                    onClick={() => setMarketGroupFilter(group)}
                    className={`px-3 py-1 rounded-full text-xs capitalize ${
                      marketGroupFilter === group
                        ? 'bg-accent-dynamic text-black font-semibold'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets List */}
            <div className="space-y-1">
              {filteredSortedMarkets.map((market) => {
                const priceData = marketPrices[market.pairName];
                const price = priceData?.price || 0;
                const change = priceData?.change24h || 0;
                const pairName = market.pairName;
                const marketMeta = pairLeverageLimits[pairName];
                const displayLev = isZeroFeeMode
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
                          className="w-7 h-7"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
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
                        {price > 0
                          ? `$${price >= 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : price.toFixed(2)}`
                          : '--'}
                      </div>
                      <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* View All */}
            <div className="px-4 mt-4">
              <button className="w-full text-center text-accent-dynamic py-2">
                View All
              </button>
            </div>

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
              Move funds from your Universal Account to the owner EOA used for Perps execution on Base.
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
                  Sent to owner EOA on Base before opening positions.
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
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Execution wallet (owner EOA)</div>
                <div className="text-white text-sm font-mono break-all">{ownerEOA || 'Not connected'}</div>
                <div className="text-[11px] text-gray-500 mt-2">
                  Current balances: ${eoaUsdcBalance.toFixed(2)} USDC • {eoaEthBalance.toFixed(5)} ETH
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
                {depositMode !== 'gas_only' && <li>Transfer Base USDC to owner EOA</li>}
                {depositMode !== 'usdc_only' && <li>Convert UA balance to Base ETH</li>}
                {depositMode !== 'usdc_only' && <li>Transfer Base ETH to owner EOA</li>}
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
        ) : (
          /* ========== TRADE VIEW ========== */
          <div className="px-4">
            {/* Back Button & Header */}
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setView('markets')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <span className="text-white">←</span>
              </button>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `${selectedMarket.color}20` }}
                >
                  <img src={selectedMarket.logo} alt={selectedMarket.symbol} className="w-6 h-6" />
                </div>
                <span className="text-white font-bold text-lg">{selectedMarket.pairName}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Debug Panel - Toggle */}
            <div className="mb-4">
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

            {/* Current Price */}
            <div className="text-center mb-4 py-3 bg-gray-800/30 rounded-xl">
              <span className="text-gray-400 text-xs">Current Price</span>
              <div className="text-white text-3xl font-bold">
                ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '...'}
              </div>
            </div>

            {/* Long/Short Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsLong(true)}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                  isLong ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Long
              </button>
              <button
                onClick={() => setIsLong(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                  !isLong ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Short
              </button>
            </div>

            {/* Zero Fee Perps Mode */}
            <div className="bg-gray-800/40 rounded-xl p-3 mb-3 border border-gray-700/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white font-medium">Zero Fee Perps (ZFP)</div>
                  <div className="text-[11px] text-gray-400">
                    {zfpAvailable
                      ? `Standard ${activeLeverageLimits.standardMin}x-${activeLeverageLimits.standardMax}x • ZFP ${activeLeverageLimits.zfpMin}x-${activeLeverageLimits.zfpMax}x`
                      : 'Not available for this market'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!zfpAvailable}
                  onClick={() => setIsZeroFeeMode((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isZeroFeeMode && zfpAvailable ? 'bg-accent-dynamic' : 'bg-gray-600'
                  } ${!zfpAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isZeroFeeMode && zfpAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Order type: {isZeroFeeMode ? 'Market Zero Fee' : 'Market'}
              </div>
            </div>

            {/* Leverage */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Leverage</span>
                <span className="text-white font-bold text-lg">{leverage}x</span>
              </div>
              <input
                type="range"
                min={leverageMin}
                max={leverageMax}
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-dynamic h-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{leverageMin}x</span>
                <span>{leverageMax}x</span>
              </div>
            </div>

            {/* Collateral */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Collateral (USDC)</span>
                <button 
                  onClick={() => setCollateral(eoaUsdcBalance.toString())}
                  className="text-accent-dynamic text-xs"
                >
                  EOA USDC: ${usdcBalance.toFixed(2)}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-gray-700 rounded-lg px-3 py-3 text-white outline-none text-xl"
                />
                <button 
                  onClick={() => setCollateral(eoaUsdcBalance.toString())}
                  className="bg-gray-700 px-4 py-3 rounded-lg text-accent-dynamic text-sm"
                >
                  MAX
                </button>
              </div>
              {positionSize > 0 && (
                <div className="text-gray-400 text-xs mt-2">
                  Position Size: ${positionSize.toLocaleString()}
                </div>
              )}
              <div className="text-[11px] text-gray-500 mt-2">
                Owner EOA: {ownerEOA ? `${ownerEOA.slice(0, 8)}...${ownerEOA.slice(-6)}` : 'n/a'}
              </div>
              <div className="text-[11px] text-gray-500">
                EOA Balances: ${eoaUsdcBalance.toFixed(2)} USDC • {eoaEthBalance.toFixed(5)} ETH
              </div>

            </div>

            <div className="bg-gray-800/40 rounded-xl p-3 mb-3 border border-gray-700/60">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white font-medium">Set TP/SL</div>
                <button
                  type="button"
                  onClick={() => setShowTpSlInputs((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showTpSlInputs ? 'bg-accent-dynamic' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTpSlInputs ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              {showTpSlInputs && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="Take Profit"
                    className="bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Stop Loss"
                    className="bg-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
              )}
            </div>

            {/* Position Summary */}
            {positionSize > 0 && liquidationPrice && (
              <div className="bg-gray-800/30 rounded-xl p-3 mb-4 text-sm space-y-2">
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
                <div className="flex justify-between">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-white">~${(positionSize * 0.0006).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Open Position Button */}
            <button 
              onClick={handleOpenPosition}
              disabled={!canTrade || isLoading}
              className={`w-full font-bold py-4 rounded-2xl transition-colors ${
                canTrade && !isLoading
                  ? isLong ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-500'
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
    </BottomSheet>
  );
};

// Buy (Onramp) Modal
const BuyModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-8">
        <h2 className="text-white text-xl font-bold mb-6 text-center">Buy Crypto</h2>

        <div className="text-center py-8">
          <div className="text-5xl mb-4">💳</div>
          <h3 className="text-white text-lg mb-2">Coming Soon</h3>
          <p className="text-gray-500 text-sm">
            Onramp integration with card payments will be available soon.
          </p>
        </div>
      </div>
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
  onBuy,
  onReceive,
  onSend,
  onConvert,
  onPerps,
  onPolymarket,
  onTokenSelect,
  onRefresh,
}: {
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  profile: ProfileSettings;
  onShowProfilePicker: () => void;
  onBuy: () => void;
  onReceive: () => void;
  onSend: () => void;
  onConvert: () => void;
  onPerps: () => void;
  onPolymarket: () => void;
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

      {/* Action Pill Bar - Buy, Receive, Send, Convert (long-press to toggle compact mode) */}
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
            { icon: "💳", label: "Buy", action: onBuy },
            { icon: "↓", label: "Receive", action: onReceive },
            { icon: "↑", label: "Send", action: onSend },
            { icon: "⇄", label: "Convert", action: onConvert },
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
      
      {/* Perps Menu Item */}
      <div className="px-4 mt-6">
        <button 
          onClick={onPerps}
          className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-gray-800 hover:border-accent-dynamic/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-dynamic-20 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Perps</div>
              <div className="text-gray-500 text-sm">Trade perpetual futures</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Polymarket Menu Item */}
      <div className="px-4 mt-3 mb-24">
        <button 
          onClick={onPolymarket}
          className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <span className="text-2xl">🔮</span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Prediction Markets</div>
              <div className="text-gray-500 text-sm">Bet on real-world events</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
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

  const searchTokens = async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.mobula.io/api/1/search?input=${encodeURIComponent(q)}`, {
        headers: { 
          "Authorization": MOBULA_API_KEY,
          "Content-Type": "application/json",
        }
      });
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Map Mobula response to our format with defensive checks
      // Mobula returns contracts as string[] and blockchains as string[]
      const rawTokens = data?.data || [];
      const tokens: TokenResult[] = rawTokens.slice(0, 15).map((t: {
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
      setResults(tokens);
    } catch (e) {
      console.error("Search failed:", e);
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchTokens(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a] px-4 pt-4">
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens or paste address..."
          className="w-full bg-gray-900 rounded-xl px-3 py-2 pr-10 text-white placeholder-gray-500 outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      
      {loading && <div className="text-gray-500 text-center py-4">Searching...</div>}
      
      {error && <div className="text-red-500 text-center py-4 text-sm">Error: {error}</div>}
      
      {/* Recent Tokens - DexScreener style list */}
      {!query && recentTokens.length > 0 && (
        <div>
          <div className="text-gray-500 text-xs uppercase mb-3">History</div>
          {recentTokens.map((token) => {
            // Get primary chain for badge
            const primaryChain = token.contracts?.[0]?.blockchain;
            const chainLogo = primaryChain ? (() => {
              const mapping: Record<string, string> = {
                ethereum: "Ethereum", base: "Base", arbitrum: "Arbitrum",
                optimism: "Optimism", polygon: "Polygon", bsc: "BNB Chain",
                bnb: "BNB Chain", solana: "Solana", avalanche: "Avalanche",
              };
              return CHAIN_LOGOS[mapping[primaryChain.toLowerCase()] || "Base"];
            })() : null;
            
            return (
            <button 
              key={token.id} 
              onClick={() => setSelectedToken(token)}
              className="w-full py-3 border-b border-gray-800/30 text-left"
            >
              {/* Top row: logo, name, price, change */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {token.logo ? (
                      <img src={token.logo} alt={token.symbol} className="w-9 h-9 rounded-full bg-gray-800" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    {/* Chain badge on logo */}
                    {chainLogo && (
                      <img 
                        src={chainLogo}
                        alt=""
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a]"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{token.symbol}</span>
                      {/* Chain badges */}
                      {token.contracts && token.contracts.length > 0 && (
                        <div className="flex gap-1">
                          {token.contracts.slice(0, 2).map((c, i) => (
                            <ChainBadge key={i} blockchain={c.blockchain} />
                          ))}
                          {token.contracts.length > 2 && (
                            <span className="text-gray-500 text-[10px]">+{token.contracts.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs truncate max-w-[120px]">{token.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-medium">{formatPrice(token.price || 0)}</div>
                  {typeof token.price_change_24h === 'number' && (
                    <span className={`text-xs ${token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                      24H {token.price_change_24h >= 0 ? "+" : ""}{token.price_change_24h.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {/* Bottom row: LIQ, VOL, MCAP */}
              <div className="flex gap-3 mt-2 ml-12 text-xs">
                {token.liquidity && token.liquidity > 0 && (
                  <span className="text-gray-500">LIQ <span className="text-gray-400">{formatMarketCap(token.liquidity)}</span></span>
                )}
                {token.volume && token.volume > 0 && (
                  <span className="text-gray-500">VOL <span className="text-gray-400">{formatMarketCap(token.volume)}</span></span>
                )}
                {token.market_cap && token.market_cap > 0 && (
                  <span className="text-gray-500">MCAP <span className="text-gray-400">{formatMarketCap(token.market_cap)}</span></span>
                )}
              </div>
            </button>
            );
          })}
        </div>
      )}
      
      {!query && recentTokens.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div>Recently Viewed</div>
          <div className="text-xs mt-1 text-gray-600">Search to add tokens here</div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          {results.map((token) => {
            // Get primary chain for badge
            const primaryChain = token.contracts?.[0]?.blockchain;
            const chainLogo = primaryChain ? (() => {
              const mapping: Record<string, string> = {
                ethereum: "Ethereum", base: "Base", arbitrum: "Arbitrum",
                optimism: "Optimism", polygon: "Polygon", bsc: "BNB Chain",
                bnb: "BNB Chain", solana: "Solana", avalanche: "Avalanche",
              };
              return CHAIN_LOGOS[mapping[primaryChain.toLowerCase()] || "Base"];
            })() : null;
            
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
                    {/* Chain badges */}
                    {token.contracts && token.contracts.length > 0 && (
                      <div className="flex gap-1">
                        {token.contracts.slice(0, 2).map((c, i) => (
                          <ChainBadge key={i} blockchain={c.blockchain} />
                        ))}
                        {token.contracts.length > 2 && (
                          <span className="text-gray-500 text-[10px]">+{token.contracts.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm uppercase">{token.symbol}</div>
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

      <TokenDetailModal 
        token={selectedToken} 
        userBalance={getUserBalance(selectedToken)}
        onClose={() => setSelectedToken(null)} 
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

// Browser Tab (dApp Browser)
const BrowserTab = () => {
  const [inputUrl, setInputUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const quickLinks = [
    { name: "Avantis", url: "https://foundation.avantisfi.com", icon: "📈", description: "Perps trading" },
    { name: "DefiLlama", url: "https://defillama.com", icon: "🦙", description: "DeFi analytics" },
    { name: "Dexscreener", url: "https://dexscreener.com", icon: "📊", description: "DEX charts" },
    { name: "CoinGecko", url: "https://coingecko.com", icon: "🦎", description: "Token data" },
    { name: "Basescan", url: "https://basescan.org", icon: "🔍", description: "Base explorer" },
    { name: "Etherscan", url: "https://etherscan.io", icon: "⟠", description: "ETH explorer" },
  ];

  const navigateTo = (url: string) => {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    setCurrentUrl(fullUrl);
    setInputUrl(fullUrl);
    setIsLoading(true);
    setLoadError(false);
  };

  const closeBrowser = () => {
    setCurrentUrl(null);
    setInputUrl("");
    setLoadError(false);
  };

  // If browsing a site, show embedded browser
  if (currentUrl) {
    return (
      <div className="flex-1 flex flex-col bg-[#0a0a0a]" style={{ marginBottom: '80px' }}>
        {/* Browser Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
          <button 
            onClick={closeBrowser}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white"
          >
            ✕
          </button>
          <div className="flex-1 bg-gray-800 rounded-full px-3 py-1.5 flex items-center gap-2">
            {isLoading && <div className="w-3 h-3 border-2 border-accent-dynamic border-t-transparent rounded-full animate-spin" />}
            <span className="text-gray-400 text-xs truncate">{currentUrl}</span>
          </div>
          <button 
            onClick={() => window.open(currentUrl, '_blank')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-white text-sm"
            title="Open in browser"
          >
            ↗
          </button>
        </div>

        {/* Browser Frame */}
        <div className="flex-1 relative">
          {loadError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6">
              <span className="text-4xl mb-4">🔒</span>
              <p className="text-white font-medium mb-2">Site cannot be embedded</p>
              <p className="text-gray-400 text-sm text-center mb-4">
                This site blocks in-app browsers for security. Open it externally instead.
              </p>
              <button
                onClick={() => window.open(currentUrl, '_blank')}
                className="bg-accent-dynamic text-white px-6 py-2 rounded-xl font-medium"
              >
                Open in Browser
              </button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full border-0 bg-white"
              title="dApp Browser"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setIsLoading(false)}
              onError={() => { setLoadError(true); setIsLoading(false); }}
            />
          )}
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] pb-24 overflow-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-white text-xl font-bold">Browser</h2>
        <p className="text-gray-500 text-sm mt-1">Explore DeFi & Web3</p>
      </div>

      {/* URL Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter URL..."
            className="flex-1 bg-gray-900 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
            onKeyPress={(e) => {
              if (e.key === "Enter" && inputUrl.trim()) {
                navigateTo(inputUrl.trim());
              }
            }}
          />
          <button 
            onClick={() => inputUrl.trim() && navigateTo(inputUrl.trim())}
            className="bg-accent-dynamic text-white px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Go
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-4">
        <div className="text-gray-500 text-xs uppercase mb-3">Quick Access</div>
        <div className="space-y-2">
          {quickLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => navigateTo(link.url)}
              className="w-full flex items-center gap-3 p-3 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg">{link.icon}</span>
              <div className="text-left flex-1">
                <span className="text-white font-medium">{link.name}</span>
                <p className="text-gray-500 text-xs">{link.description}</p>
              </div>
              <span className="text-gray-500">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="px-4 mt-4">
        <p className="text-gray-600 text-xs text-center">
          Some sites may not load due to security restrictions. Use ↗ to open externally.
        </p>
      </div>
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
    // Check for known types
    const tag = tx.tag || tx.type || tx.txType || tx.action || '';
    if (tag && tag !== 'universal') return tag;
    
    // Detect type from token changes
    if (tx.tokenChanges) {
      const hasDecr = tx.tokenChanges.decr?.length > 0;
      const hasIncr = tx.tokenChanges.incr?.length > 0;
      if (hasDecr && hasIncr) return 'Swap';
      if (hasDecr && !hasIncr) return 'Send';
      if (!hasDecr && hasIncr) return 'Receive';
    }
    
    // Check for contract interaction patterns
    if (tx.transactions?.length > 0 || tx.userOps?.length > 0) {
      return 'Contract';
    }
    
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
    if (s.includes('success') || s.includes('complete')) return 'text-green-400 bg-green-400/20';
    if (s.includes('pending') || s.includes('process')) return 'text-yellow-400 bg-yellow-400/20';
    if (s.includes('fail') || s.includes('error') || s.includes('cancel')) return 'text-red-400 bg-red-400/20';
    return 'text-gray-400 bg-gray-400/20';
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

  // Convert hex/BigInt string to human readable number
  const formatTokenAmount = (amount: string | number, decimals: number = 18): string => {
    if (!amount) return '0';
    let value: bigint;
    try {
      if (typeof amount === 'string' && amount.startsWith('0x')) {
        value = BigInt(amount);
      } else if (typeof amount === 'string') {
        // Check if it's already a decimal number
        if (amount.includes('.')) return parseFloat(amount).toFixed(4);
        value = BigInt(amount);
      } else {
        value = BigInt(Math.floor(amount));
      }
      // Convert based on decimals
      const divisor = BigInt(10 ** decimals);
      const whole = value / divisor;
      const remainder = value % divisor;
      const remainderStr = remainder.toString().padStart(decimals, '0').slice(0, 4);
      return `${whole}.${remainderStr}`.replace(/\.?0+$/, '') || '0';
    } catch {
      return String(amount);
    }
  };

  const getTxAmount = (tx: TxData): { amount: string; symbol: string; isNegative: boolean; usdValue?: string } | null => {
    // Try tokenChanges structure (Particle UA format)
    if (tx.tokenChanges?.decr?.[0]) {
      const d = tx.tokenChanges.decr[0];
      const decimals = d.token?.decimals || d.token?.realDecimals || 18;
      const symbol = d.token?.symbol || '';
      const rawAmount = d.rawAmount || d.amount;
      const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals) : (d.amount || '0');
      return { 
        amount: formattedAmount, 
        symbol, 
        isNegative: true,
        usdValue: d.amountInUSD ? `$${Number(d.amountInUSD).toFixed(2)}` : undefined
      };
    }
    if (tx.tokenChanges?.incr?.[0]) {
      const i = tx.tokenChanges.incr[0];
      const decimals = i.token?.decimals || i.token?.realDecimals || 18;
      const symbol = i.token?.symbol || '';
      const rawAmount = i.rawAmount || i.amount;
      const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals) : (i.amount || '0');
      return { 
        amount: formattedAmount, 
        symbol, 
        isNegative: false,
        usdValue: i.amountInUSD ? `$${Number(i.amountInUSD).toFixed(2)}` : undefined
      };
    }
    // Try depositTokens/lendingTokens
    if (tx.depositTokens?.[0]) {
      const d = tx.depositTokens[0];
      const decimals = d.token?.decimals || 18;
      return {
        amount: formatTokenAmount(d.rawAmount || d.amount, decimals),
        symbol: d.token?.symbol || '',
        isNegative: true,
        usdValue: d.amountInUSD ? `$${Number(d.amountInUSD).toFixed(2)}` : undefined
      };
    }
    // Fallback to simple amount field
    if (tx.amount !== undefined) {
      const decimals = tx.decimals || 18;
      return { 
        amount: formatTokenAmount(tx.amount, decimals), 
        symbol: tx.symbol || tx.token || '', 
        isNegative: tx.direction === 'out' 
      };
    }
    // Try totalDecrAmountInUSD / totalIncrAmountInUSD
    if (tx.totalDecrAmountInUSD) {
      return { amount: `$${Number(tx.totalDecrAmountInUSD).toFixed(2)}`, symbol: '', isNegative: true };
    }
    if (tx.totalIncrAmountInUSD) {
      return { amount: `$${Number(tx.totalIncrAmountInUSD).toFixed(2)}`, symbol: '', isNegative: false };
    }
    return null;
  };

  const shortenHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getChainMeta = (chainId: number | undefined) => {
    const map: Record<number, { name: string; logo: string; explorer: string }> = {
      1: { name: 'Ethereum', logo: 'https://static.particle.network/token-list/ethereum/native.png', explorer: 'https://etherscan.io/tx/' },
      10: { name: 'Optimism', logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png', explorer: 'https://optimistic.etherscan.io/tx/' },
      137: { name: 'Polygon', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png', explorer: 'https://polygonscan.com/tx/' },
      8453: { name: 'Base', logo: 'https://cryptologos.cc/logos/base-base-logo.png', explorer: 'https://basescan.org/tx/' },
      42161: { name: 'Arbitrum', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png', explorer: 'https://arbiscan.io/tx/' },
      2013: { name: 'Settlement', logo: 'https://static.particle.network/token-list/ethereum/native.png', explorer: 'https://universalx.app/activity/details?id=' },
    };
    return map[chainId || 0] || { name: `Chain ${chainId || '-'}`, logo: 'https://static.particle.network/token-list/ethereum/native.png', explorer: 'https://etherscan.io/tx/' };
  };

  const getExplorerTxUrl = (chainId: number | undefined, txHash: string | undefined) => {
    if (!chainId || !txHash) return '';
    return `${getChainMeta(chainId).explorer}${txHash}`;
  };

  // Transaction Detail View
  if (selectedTx) {
    const details = txDetails || selectedTx;
    const txType = getTxType(details);
    const status = getTxStatus(details);
    const txId = details.transactionId || details.id || details.transaction_id || '';

    return (
      <BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto">
          {/* Back button */}
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {isLoadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-accent-dynamic border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                  {getTagIcon(txType)}
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold capitalize">{txType}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Amount - with proper formatting */}
              {(() => {
                const amountData = getTxAmount(details);
                if (!amountData) return null;
                return (
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <div className="text-gray-400 text-sm mb-1">Amount</div>
                    <div className={`text-2xl font-bold ${amountData.isNegative ? 'text-red-400' : 'text-green-400'}`}>
                      {amountData.isNegative ? '-' : '+'}{amountData.amount} {amountData.symbol}
                    </div>
                    {amountData.usdValue && (
                      <div className="text-gray-400 text-sm mt-1">≈ {amountData.usdValue}</div>
                    )}
                  </div>
                );
              })()}

              {/* Details (UniversalX-style layout with dynamic theme) */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Type</div>
                      <div className="text-white font-medium capitalize">{txType}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Status</div>
                      <div className="text-white font-medium">{status}</div>
                    </div>
                    {getTxDate(details) && (
                      <>
                        <div>
                          <div className="text-gray-400">Time</div>
                          <div className="text-white">{formatFullDate(getTxDate(details))}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Tx Fee (USD)</div>
                          <div className="text-white">${formatHexUsd(details.fees?.totals?.feeTokenAmountInUSD || details.totalFeeInUSD)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {(details.tokenChanges?.decr?.length || details.tokenChanges?.incr?.length) ? (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-gray-300 font-medium mb-2">Balance change</div>
                    <div className="space-y-2 text-sm">
                      {(details.tokenChanges?.decr || []).map((d: { amount?: string; rawAmount?: string; amountInUSD?: string; token?: { symbol?: string; image?: string; realDecimals?: number } }, i: number) => (
                        <div key={`decr-${i}`} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {d.token?.image ? <img src={d.token.image} alt="" className="w-5 h-5 rounded-full" /> : null}
                            <span className="text-gray-200">{d.token?.symbol || 'Token'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-red-400">- {formatTokenAmount(d.amount || d.rawAmount || '0', d.token?.realDecimals || 6)}</div>
                            {d.amountInUSD ? <div className="text-xs text-gray-400">${formatHexUsd(d.amountInUSD)}</div> : null}
                          </div>
                        </div>
                      ))}
                      {(details.tokenChanges?.incr || []).map((inc: { amount?: string; rawAmount?: string; amountInUSD?: string; token?: { symbol?: string; image?: string; realDecimals?: number } }, i: number) => (
                        <div key={`incr-${i}`} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {inc.token?.image ? <img src={inc.token.image} alt="" className="w-5 h-5 rounded-full" /> : null}
                            <span className="text-gray-200">{inc.token?.symbol || 'Token'}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400">+ {formatTokenAmount(inc.amount || inc.rawAmount || '0', inc.token?.realDecimals || 6)}</div>
                            {inc.amountInUSD ? <div className="text-xs text-gray-400">${formatHexUsd(inc.amountInUSD)}</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2 text-sm">
                  {txId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tx ID</span>
                      <span className="text-white font-mono">{shortenHash(txId)}</span>
                    </div>
                  )}
                  {details.sender && <div className="flex justify-between"><span className="text-gray-400">From</span><span className="text-white font-mono">{shortenHash(details.sender)}</span></div>}
                  {details.receiver && <div className="flex justify-between"><span className="text-gray-400">To</span><span className="text-white font-mono">{shortenHash(details.receiver)}</span></div>}
                </div>

                {(details.depositUserOperations?.length || details.lendingUserOperations?.length || details.settlementUserOperations?.length) ? (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-gray-300 font-medium mb-3">Execution</div>

                    {([
                      { label: 'Deposit', ops: details.depositUserOperations || [] },
                      { label: 'Lending', ops: details.lendingUserOperations || [] },
                      { label: 'Settlement', ops: details.settlementUserOperations || [] },
                    ] as Array<{ label: string; ops: Array<{ chainId?: number; txHash?: string; status?: number }> }>).map((group) => (
                      group.ops.length ? (
                        <div key={group.label} className="mb-3 last:mb-0">
                          <div className="text-xs text-gray-400 mb-1">{group.label}</div>
                          <div className="space-y-2 text-sm">
                            {group.ops.map((op, i) => {
                              const href = getExplorerTxUrl(op.chainId, op.txHash);
                              const chain = getChainMeta(op.chainId);
                              const ok = op.status === 3 || op.status === 7;
                              return (
                                <div key={`${group.label}-${i}`} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <img src={chain.logo} alt={chain.name} className="w-4 h-4 rounded-full" />
                                    <span className="text-gray-200">{chain.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ok ? 'text-green-300 bg-green-500/20' : 'text-yellow-300 bg-yellow-500/20'}`}>
                                      {op.status ?? '-'}
                                    </span>
                                  </div>
                                  {op.txHash ? (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent-dynamic font-mono hover:underline"
                                    >
                                      {shortenHash(op.txHash)}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : null}

                {/* Advanced raw payload (collapsed) */}
                <details className="mt-3 bg-white/5 rounded-xl p-3">
                  <summary className="cursor-pointer text-gray-300 text-sm">Advanced</summary>
                  <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap break-all overflow-x-auto">
{JSON.stringify(details, null, 2)}
                  </pre>
                </details>
              </div>
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
  onOpenAccountSecurity,
  onOpenMasterPassword,
  onOpenAppLock
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogout: () => void;
  blindSigningEnabled: boolean;
  onToggleBlindSigning: (enabled: boolean) => void;
  onOpenAccountSecurity?: () => void;
  onOpenMasterPassword?: () => void;
  onOpenAppLock?: () => void;
}) => (
  <BottomSheet isOpen={isOpen} onClose={onClose}>
    <div className="px-6 pb-8">
      <h2 className="text-white text-xl font-bold mb-6 text-center">Settings</h2>
      <div className="space-y-4">
        {/* Security Section */}
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Security</div>
        
        <button 
          onClick={onOpenAccountSecurity}
          className="w-full flex items-center justify-between py-3 border-b border-gray-800"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
            </svg>
            <span className="text-white">Account & Security</span>
          </div>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
        
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
        
        <button 
          onClick={onOpenMasterPassword}
          className="w-full flex items-center justify-between py-3 border-b border-gray-800"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
            </svg>
            <span className="text-white">Wallet Password</span>
          </div>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
        
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

// Bottom Nav with Agent button
const BottomNav = ({ 
  active, 
  onChange,
  onAgentPress 
}: { 
  active: TabType; 
  onChange: (t: TabType) => void;
  onAgentPress: () => void;
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
      <span className="text-xl">🤖</span>
    ), isAgent: true },
    { id: "browser" as TabType, icon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>
      </svg>
    )},
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
          const isActive = active === tab.id || (tab.isAgent && false);
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
  useWallets();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openAccountAndSecurity, openSetMasterPassword } = useParticleAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [universalAccountInstance, setUniversalAccountInstance] = useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(null);
  const [mobulaAssets, setMobulaAssets] = useState<MobulaAsset[]>([]);
  
  // Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showPerpsModal, setShowPerpsModal] = useState(false);
  const [showPolymarketModal, setShowPolymarketModal] = useState(false);
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

  const universalAccountConfig = useMemo((): IUniversalAccountConfig => ({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "",
    projectAppUuid: process.env.NEXT_PUBLIC_APP_ID || "",
    rpcUrl: 'https://universal-rpc-staging.particle.network', // Bypass simulation for oracle-dependent contracts (Avantis perps)
    smartAccountOptions: {
      useEIP7702: false, // Smart Account mode - 7702 requires Particle Auth (not Connect)
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress: address!,
    },
  }), [address]);

  useEffect(() => {
    if (isConnected && address) {
      console.log("[UA] Creating UA instance for:", address);
      const ua = new UniversalAccount(universalAccountConfig);
      setUniversalAccountInstance(ua);
    } else {
      console.log("[UA] Disconnected, clearing state");
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
    try {
      console.log("[Assets] Fetching primary assets...");
      const assets = await universalAccountInstance.getPrimaryAssets();
      console.log("[Assets] Got assets:", JSON.stringify(assets).slice(0, 500));
      setPrimaryAssets(assets);
    } catch (error) {
      console.error("[Assets] Failed to fetch:", error);
    }
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

  // Fetch Mobula assets when account info is available
  useEffect(() => {
    if (accountInfo?.evmSmartAccount) {
      fetchMobulaAssets();
    }
  }, [accountInfo?.evmSmartAccount, accountInfo?.solanaSmartAccount, fetchMobulaAssets]);

  // WebSocket for real-time balance and transaction updates
  const handleAssetUpdate = useCallback((assets: Array<{ chainId: number; address: string; amountOnChain: string }>) => {
    console.log("[WSS] Real-time asset update received:", assets.length, "assets");
    // Refresh assets when we get a WebSocket update
    fetchAssets();
    fetchMobulaAssets();
  }, [fetchAssets, fetchMobulaAssets]);

  const handleTransactionUpdate = useCallback((tx: { transactionId: string; status: number }) => {
    console.log("[WSS] Transaction update:", tx.transactionId, "status:", tx.status === 7 ? "success" : tx.status === 11 ? "failed" : tx.status);
    // Refresh assets after transaction completes
    if (tx.status === 7 || tx.status === 11) {
      fetchAssets();
      fetchMobulaAssets();
    }
  }, [fetchAssets, fetchMobulaAssets]);

  // Real-time WebSocket updates (auto-refreshes assets on changes)
  useUniversalAccountWS({
    universalAccount: universalAccountInstance,
    ownerAddress: address,
    evmAddress: accountInfo?.evmSmartAccount,
    solanaAddress: accountInfo?.solanaSmartAccount,
    useEIP7702: false,
    onAssetUpdate: handleAssetUpdate,
    onTransactionUpdate: handleTransactionUpdate,
  });

  // Merge UA primary assets with Mobula external assets
  const combinedAssets = useMemo(() => {
    console.log("[CombinedAssets] primaryAssets:", primaryAssets ? `${primaryAssets.assets?.length} assets, $${primaryAssets.totalAmountInUSD}` : "null");
    console.log("[CombinedAssets] mobulaAssets:", mobulaAssets?.length || 0);
    if (!primaryAssets) return null;
    
    // Get tokenTypes from UA primary assets for dedup (UA uses tokenType, not symbol)
    // e.g., "eth", "sol", "usdc" - we uppercase for comparison with Mobula's symbols
    const primarySymbols = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (primaryAssets.assets?.map((a: any) => a.tokenType?.toUpperCase()?.trim()) || [])
        .filter((s: string | undefined) => s) // Remove empty/null
    );
    
    console.log("[CombinedAssets] primarySymbols (from tokenType):", Array.from(primarySymbols));
    
    // Filter Mobula assets to only include tokens NOT in primary assets
    const externalAssets = mobulaAssets
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
    
    // Simply merge - no dedup on primary (UA handles that)
    const mergedAssets = [...(primaryAssets.assets || []), ...externalAssets];
    
    console.log("[CombinedAssets] Final:", mergedAssets.length, "assets (", externalAssets.length, "external)");
    
    // Calculate new total
    const externalTotal = externalAssets.reduce((sum, a) => sum + a.amountInUSD, 0);
    
    return {
      ...primaryAssets,
      assets: mergedAssets,
      totalAmountInUSD: (primaryAssets.totalAmountInUSD || 0) + externalTotal,
    };
  }, [primaryAssets, mobulaAssets]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

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
          onBuy={() => setShowBuyModal(true)}
          onReceive={() => setShowReceiveModal(true)}
          onSend={() => setShowSendModal(true)}
          onConvert={() => setShowConvertModal(true)}
          onPerps={() => setShowPerpsModal(true)}
          onPolymarket={() => setShowPolymarketModal(true)}
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
      {activeTab === "browser" && <BrowserTab />}
      {activeTab === "points" && <PointsTab />}

      <BottomNav 
        active={activeTab} 
        onChange={setActiveTab} 
        onAgentPress={() => setShowAgentModal(true)}
      />

      {/* All Modals */}
      <AgentModal isOpen={showAgentModal} onClose={() => setShowAgentModal(false)} />
      
      <ProfilePickerModal
        isOpen={showProfilePicker}
        onClose={() => setShowProfilePicker(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
      />
      
      <BuyModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />
      
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
      />
      
      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        assets={primaryAssets}
        universalAccount={universalAccountInstance}
        blindSigningEnabled={profile.blindSigningEnabled}
        onTransactionCreated={(tx) => {
          console.log('[Convert] Transaction created:', tx);
        }}
        onSuccess={() => {
          // Refresh balances after successful conversion
          fetchAssets();
          fetchMobulaAssets();
        }}
      />

      <PerpsModal
        isOpen={showPerpsModal}
        onClose={() => setShowPerpsModal(false)}
        assets={combinedAssets as IAssetsResponse | null}
        universalAccount={universalAccountInstance}
        blindSigningEnabled={profile.blindSigningEnabled}
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
        onOpenAccountSecurity={openAccountAndSecurity}
        onOpenMasterPassword={openSetMasterPassword}
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
