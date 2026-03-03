/* eslint-disable @next/next/no-img-element */
"use client";
import {
  ConnectButton,
  useAccount,
  useWallets,
  useDisconnect,
} from "@particle-network/connectkit";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IAssetsResponse,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import DepositDialog from "./components/DepositDialog";
import AssetBreakdownDialog from "./components/AssetBreakdownDialog";

// Mobula API for token search
const MOBULA_API_KEY = "a8e6a174-9dfd-4929-b0e0-9f6ece767923";

// Types
type TabType = "home" | "search" | "activity" | "settings";

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
}

interface ProfileSettings {
  emoji: string;
  customImage: string | null;
  displayName: string;
}

// Common emojis for profile selection
const PROFILE_EMOJIS = [
  "🍊", "😀", "😎", "🤠", "👻", "👽", "🤖", "👾", "🦊", "🐶", "🐱", "🦁",
  "🐯", "🐻", "🐼", "🐨", "🐸", "🐵", "🦄", "🐲", "🔥", "⚡", "🌟", "💎",
  "🚀", "🎮", "🎨", "🎵", "💰", "🏆", "👑", "🌈", "🌙", "☀️", "🪐", "🌊",
];

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

// Login Screen
const LoginScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] p-6">
    <div className="text-6xl mb-4">🍊</div>
    <h1 className="text-2xl font-bold text-white mb-1">Universal Wallet</h1>
    <p className="text-gray-500 text-sm mb-12">One account. Any chain.</p>
    <div className="w-full max-w-xs">
      <ConnectButton label="Get Started" />
    </div>
  </div>
);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-white text-xl font-bold mb-6">Customize Profile</h2>
          
          {/* Display Name */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter a custom name..."
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
              maxLength={20}
            />
          </div>

          {/* Current Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl overflow-hidden">
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

          {/* Emoji Grid */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">Or pick an emoji</label>
            <div className="grid grid-cols-8 gap-2">
              {PROFILE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onUpdateProfile({ ...profile, emoji, customImage: null })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                    profile.emoji === emoji && !profile.customImage ? "bg-orange-500" : "bg-gray-800"
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
              onUpdateProfile({ ...profile, displayName });
              onClose();
            }}
            className="w-full bg-[#f5a623] text-black font-bold py-3 rounded-xl"
          >
            Save
          </button>
        </div>
      </div>
    </div>
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

  if (!isOpen) return null;

  const handleCopy = (addr: string, type: string) => {
    copyToClipboard(addr);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const chains = [
    { name: "Ethereum", icon: "⟠", address: evmAddress, type: "evm" },
    { name: "Base", icon: "🔵", address: evmAddress, type: "evm" },
    { name: "Arbitrum", icon: "🔷", address: evmAddress, type: "evm" },
    { name: "Optimism", icon: "🔴", address: evmAddress, type: "evm" },
    { name: "Polygon", icon: "💜", address: evmAddress, type: "evm" },
    { name: "Solana", icon: "◎", address: solanaAddress, type: "sol" },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Receive</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Your Universal Account works across all chains. Use the same address for EVM chains.
          </p>

          <div className="space-y-3">
            {chains.map((chain) => (
              <div key={chain.name} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{chain.icon}</span>
                    <span className="text-white">{chain.name}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(chain.address, chain.name)}
                    className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    {copied === chain.name ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="text-gray-500 text-xs mt-2 font-mono break-all">
                  {chain.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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

  if (!isOpen) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = assets?.assets?.filter((a: any) => {
    const bal = typeof a.balance === 'string' ? parseFloat(a.balance) : (a.balance || 0);
    return bal > 0.0001;
  }) || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Send</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
          </div>

          {/* Token Selection */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Token</label>
            <select
              value={selectedToken || ""}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
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
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
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
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
            />
          </div>

          <button className="w-full bg-[#f5a623] text-black font-bold py-4 rounded-xl">
            Review Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Convert/Swap Modal
const ConvertModal = ({
  isOpen,
  onClose,
  assets,
}: {
  isOpen: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
}) => {
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = assets?.assets?.filter((a: any) => {
    const bal = typeof a.balance === 'string' ? parseFloat(a.balance) : (a.balance || 0);
    return bal > 0.0001;
  }) || [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Convert</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
          </div>

          {/* From */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">From</label>
            <div className="flex gap-2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
              >
                <option value="">Select token</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {tokens.map((t: any, i: number) => (
                  <option key={i} value={t.symbol}>{t.symbol}</option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-32 bg-gray-800 rounded-xl px-4 py-3 text-white outline-none text-right"
              />
            </div>
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center my-4">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">
              ↕
            </div>
          </div>

          {/* To */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-2 block">To</label>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white outline-none"
            >
              <option value="">Select token</option>
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
              <option value="SOL">SOL</option>
              <option value="ARB">ARB</option>
              <option value="OP">OP</option>
            </select>
          </div>

          <button className="w-full bg-[#f5a623] text-black font-bold py-4 rounded-xl">
            Review Swap
          </button>
        </div>
      </div>
    </div>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">Buy Crypto</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
          </div>

          <div className="text-center py-8">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-white text-lg mb-2">Coming Soon</h3>
            <p className="text-gray-500 text-sm">
              Onramp integration with card payments will be available soon.
            </p>
          </div>

          <button onClick={onClose} className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            🤖
          </div>
          <div>
            <div className="text-white font-bold">AI Agent</div>
            <div className="text-green-500 text-xs">Online</div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 text-3xl">×</button>
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
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-[#f5a623] text-black" : "bg-gray-800 text-white"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-gray-900 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
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
            className="bg-[#f5a623] rounded-xl px-4 text-black font-medium"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

// Token Detail Modal
const TokenDetailModal = ({
  token,
  onClose,
}: {
  token: TokenResult | null;
  onClose: () => void;
}) => {
  if (!token) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {token.logo ? (
                <img src={token.logo} alt={token.symbol} className="w-12 h-12 rounded-full" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
                  {getTokenIcon(token.symbol)}
                </div>
              )}
              <div>
                <div className="text-white font-bold text-xl">{token.name}</div>
                <div className="text-gray-500 uppercase">{token.symbol}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-sm">Price</div>
              <div className="text-white text-2xl font-bold">{formatPrice(token.price || 0)}</div>
              {token.price_change_24h !== undefined && (
                <div className={`text-sm ${token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {token.price_change_24h >= 0 ? "+" : ""}{token.price_change_24h.toFixed(2)}% (24h)
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <div className="text-gray-500 text-sm">Market Cap</div>
              <div className="text-white text-xl font-bold">{formatMarketCap(token.market_cap || 0)}</div>
            </div>

            {token.contracts && token.contracts.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-gray-500 text-sm mb-2">Contracts</div>
                {token.contracts.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-gray-400 text-sm">{c.blockchain}</span>
                    <span className="text-white text-xs font-mono">{formatAddress(c.address)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={onClose} className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl mt-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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
}: {
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  profile: ProfileSettings;
  onShowProfilePicker: () => void;
  onBuy: () => void;
  onReceive: () => void;
  onSend: () => void;
  onConvert: () => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens = primaryAssets?.assets?.map((asset: any) => ({
    symbol: asset.symbol || "???",
    name: asset.name || asset.symbol || "Token",
    balance: typeof asset.balance === 'string' ? parseFloat(asset.balance) : (asset.balance || 0),
    amountInUSD: asset.amountInUSD || 0,
    change: 0,
  })).filter((t: { balance: number }) => t.balance > 0.0001) || [];

  return (
    <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a]">
      {/* Profile & Balance */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <button 
          onClick={onShowProfilePicker}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mb-3 overflow-hidden relative group"
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

      {/* Action Buttons - Buy, Receive, Send, Convert */}
      <div className="flex justify-center gap-6 py-6">
        {[
          { icon: "💳", label: "Buy", action: onBuy },
          { icon: "↓", label: "Receive", action: onReceive },
          { icon: "↑", label: "Send", action: onSend },
          { icon: "⇄", label: "Convert", action: onConvert },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-[#f5a623] flex items-center justify-center text-black text-xl font-bold">
              {icon}
            </div>
            <span className="text-gray-400 text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Token List */}
      <div className="px-4 mt-2">
        {tokens.length > 0 ? (
          <div>
            {tokens.map((token: { symbol: string; name: string; balance: number; amountInUSD: number; change: number }, i: number) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-gray-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg">
                    {getTokenIcon(token.symbol)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{token.name}</div>
                    <div className="text-gray-500 text-sm">{token.balance.toFixed(4)} {token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">${token.amountInUSD.toFixed(2)}</div>
                  <div className="text-green-500 text-sm">+0.00%</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-600">No tokens yet</div>
            <button onClick={onReceive} className="text-[#f5a623] mt-2">
              Deposit to get started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Search Tab with Mobula API
const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);
  const recentSearches = ["bitcoin", "ethereum", "solana"];

  const searchTokens = async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.mobula.io/api/1/search?name=${encodeURIComponent(q)}`, {
        headers: { "Authorization": MOBULA_API_KEY }
      });
      const data = await res.json();
      
      // Map Mobula response to our format
      const tokens: TokenResult[] = (data.data || []).slice(0, 15).map((t: {
        id?: string;
        name?: string;
        symbol?: string;
        logo?: string;
        price?: number;
        price_change_24h?: number;
        market_cap?: number;
        contracts?: Array<{ address: string; blockchain: string }>;
      }) => ({
        id: t.id || t.name,
        name: t.name,
        symbol: t.symbol,
        logo: t.logo,
        price: t.price,
        price_change_24h: t.price_change_24h,
        market_cap: t.market_cap,
        contracts: t.contracts,
      }));
      setResults(tokens);
    } catch (e) {
      console.error("Search failed:", e);
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
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens or paste address..."
        className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none mb-4"
      />
      
      {loading && <div className="text-gray-500 text-center py-4">Searching...</div>}
      
      {!query && (
        <div className="mb-4">
          <div className="text-gray-500 text-xs uppercase mb-2">Trending</div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(s => (
              <button key={s} onClick={() => setQuery(s)} className="px-3 py-1 bg-gray-800 rounded-full text-white text-sm capitalize">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          {results.map((token) => (
            <button 
              key={token.id} 
              onClick={() => setSelectedToken(token)}
              className="w-full flex items-center justify-between py-3 border-b border-gray-800/30 hover:bg-gray-900/50 rounded-lg px-2 transition-colors"
            >
              <div className="flex items-center gap-3">
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
                <div className="text-left">
                  <div className="text-white">{token.name}</div>
                  <div className="text-gray-500 text-sm uppercase">{token.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                {token.price !== undefined && (
                  <>
                    <div className="text-white">{formatPrice(token.price)}</div>
                    {token.price_change_24h !== undefined && (
                      <div className={`text-sm ${token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {token.price_change_24h >= 0 ? "+" : ""}{token.price_change_24h.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <TokenDetailModal token={selectedToken} onClose={() => setSelectedToken(null)} />
    </div>
  );
};

// Activity Tab
const ActivityTab = () => (
  <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a] px-4 pt-4">
    <div className="text-white font-medium text-lg mb-4">Activity</div>
    <div className="text-center py-16 text-gray-600">
      No transactions yet
    </div>
  </div>
);

// Settings Tab
const SettingsTab = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a] px-4 pt-4">
    <div className="text-white font-medium text-lg mb-4">Settings</div>
    <button onClick={onLogout} className="text-red-500">
      Log out
    </button>
  </div>
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
}) => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800/50 px-4 pt-2 pb-6">
    <div className="flex justify-around items-end">
      <button onClick={() => onChange("home")} className={`flex flex-col items-center py-2 ${active === "home" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      </button>
      <button onClick={() => onChange("search")} className={`flex flex-col items-center py-2 ${active === "search" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </button>
      
      {/* Agent button - popping out, opens modal */}
      <button 
        onClick={onAgentPress} 
        className="flex flex-col items-center -mt-6"
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br from-purple-600 to-pink-600">
          🤖
        </div>
      </button>
      
      <button onClick={() => onChange("activity")} className={`flex flex-col items-center py-2 ${active === "activity" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </button>
      <button onClick={() => onChange("settings")} className={`flex flex-col items-center py-2 ${active === "settings" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      </button>
    </div>
  </div>
);

// Main App
const App = () => {
  useWallets();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [universalAccountInstance, setUniversalAccountInstance] = useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(null);
  
  // Modals
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);

  // Profile settings (persisted to localStorage)
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('walletProfile');
      if (saved) return JSON.parse(saved);
    }
    return { emoji: "🍊", customImage: null, displayName: "" };
  });

  const updateProfile = (p: ProfileSettings) => {
    setProfile(p);
    localStorage.setItem('walletProfile', JSON.stringify(p));
  };

  const universalAccountConfig = useMemo((): IUniversalAccountConfig => ({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "",
    projectAppUuid: process.env.NEXT_PUBLIC_APP_ID || "",
    smartAccountOptions: {
      useEIP7702: false,
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress: address!,
    },
  }), [address]);

  useEffect(() => {
    if (isConnected && address) {
      const ua = new UniversalAccount(universalAccountConfig);
      setUniversalAccountInstance(ua);
    } else {
      setUniversalAccountInstance(null);
      setAccountInfo(null);
      setPrimaryAssets(null);
    }
  }, [isConnected, address, universalAccountConfig]);

  useEffect(() => {
    if (!universalAccountInstance || !address) return;
    const fetchAddresses = async () => {
      try {
        const options = await universalAccountInstance.getSmartAccountOptions();
        setAccountInfo({
          ownerAddress: address,
          evmSmartAccount: options.smartAccountAddress || "",
          solanaSmartAccount: options.solanaSmartAccountAddress || "",
        });
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
    };
    fetchAddresses();
  }, [universalAccountInstance, address]);

  const fetchAssets = useCallback(async () => {
    if (!universalAccountInstance) return;
    try {
      const assets = await universalAccountInstance.getPrimaryAssets();
      setPrimaryAssets(assets);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    }
  }, [universalAccountInstance]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  if (!isConnected) return <LoginScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {activeTab === "home" && (
        <HomeTab 
          accountInfo={accountInfo}
          primaryAssets={primaryAssets}
          profile={profile}
          onShowProfilePicker={() => setShowProfilePicker(true)}
          onBuy={() => setShowBuyModal(true)}
          onReceive={() => setShowReceiveModal(true)}
          onSend={() => setShowSendModal(true)}
          onConvert={() => setShowConvertModal(true)}
        />
      )}
      {activeTab === "search" && <SearchTab />}
      {activeTab === "activity" && <ActivityTab />}
      {activeTab === "settings" && <SettingsTab onLogout={disconnect} />}

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
      />

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
    </div>
  );
};

export default App;
