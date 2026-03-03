/* eslint-disable @next/next/no-img-element */
"use client";
import {
  ConnectButton,
  useAccount,
  useWallets,
  useDisconnect,
} from "@particle-network/connectkit";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IAssetsResponse,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import DepositDialog from "./components/DepositDialog";
import AssetBreakdownDialog from "./components/AssetBreakdownDialog";

// Types
type TabType = "home" | "search" | "agent" | "activity" | "settings";

interface AccountInfo {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

interface TokenResult {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
}

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

// Home Tab
const HomeTab = ({ 
  accountInfo, 
  primaryAssets, 
  onDeposit,
  onSend,
  onCopy
}: {
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  onDeposit: () => void;
  onSend: () => void;
  onCopy: () => void;
}) => {
  const tokens = primaryAssets?.assets?.map((asset: { symbol?: string; name?: string; balance?: string | number; amountInUSD?: number; chainId?: number }) => ({
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
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl mb-3">
          🍊
        </div>
        <div className="text-gray-400 text-sm mb-2">
          {accountInfo ? formatAddress(accountInfo.evmSmartAccount) : "Loading..."}
        </div>
        <div className="text-white text-5xl font-bold">
          ${primaryAssets?.totalAmountInUSD?.toFixed(2) || "0.00"}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-8 py-6">
        {[
          { icon: "↑", label: "Buy", action: onDeposit },
          { icon: "⇄", label: "Swap", action: () => {} },
          { icon: "↗", label: "Send", action: onSend },
          { icon: "⧉", label: "Copy", action: onCopy },
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
            <button onClick={onDeposit} className="text-[#f5a623] mt-2">
              Deposit to get started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Search Tab with Token Lookup
const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const recentSearches = ["ethereum", "solana", "arbitrum"];

  const searchTokens = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.coins?.slice(0, 10) || []);
    } catch (e) {
      console.error("Search failed:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchTokens(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex-1 overflow-auto pb-24 bg-[#0a0a0a] px-4 pt-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens..."
        className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none mb-4"
      />
      
      {loading && <div className="text-gray-500 text-center py-4">Searching...</div>}
      
      {!query && (
        <div className="mb-4">
          <div className="text-gray-500 text-xs uppercase mb-2">Recent</div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(s => (
              <button key={s} onClick={() => setQuery(s)} className="px-3 py-1 bg-gray-800 rounded-full text-white text-sm">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          {results.map((token) => (
            <div key={token.id} className="flex items-center justify-between py-3 border-b border-gray-800/30">
              <div className="flex items-center gap-3">
                {token.image ? (
                  <img src={token.image} alt={token.symbol} className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                    {getTokenIcon(token.symbol)}
                  </div>
                )}
                <div>
                  <div className="text-white">{token.name}</div>
                  <div className="text-gray-500 text-sm uppercase">{token.symbol}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Agent Tab
const AgentTab = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: "user" | "agent"; text: string}[]>([]);

  const suggestions = [
    "Swap 10 USDC to ETH",
    "What's my balance?",
    "Bridge to Arbitrum",
  ];

  return (
    <div className="flex-1 flex flex-col pb-24 bg-[#0a0a0a]">
      {chat.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
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
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === "user" ? "bg-[#f5a623] text-black" : "bg-gray-800 text-white"}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-gray-900 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none"
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
            →
          </button>
        </div>
      </div>
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

// Bottom Nav with Agent button popping out
const BottomNav = ({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800/50 px-4 pt-2 pb-6">
    <div className="flex justify-around items-end">
      <button onClick={() => onChange("home")} className={`flex flex-col items-center py-2 ${active === "home" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
      </button>
      <button onClick={() => onChange("search")} className={`flex flex-col items-center py-2 ${active === "search" ? "text-[#f5a623]" : "text-gray-500"}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </button>
      
      {/* Agent button - popping out */}
      <button 
        onClick={() => onChange("agent")} 
        className={`flex flex-col items-center -mt-6 ${active === "agent" ? "" : ""}`}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg ${active === "agent" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-purple-600 to-pink-600"}`}>
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
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (accountInfo?.evmSmartAccount) {
      copyToClipboard(accountInfo.evmSmartAccount);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) return <LoginScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      {activeTab === "home" && (
        <HomeTab 
          accountInfo={accountInfo}
          primaryAssets={primaryAssets}
          onDeposit={() => setShowDepositDialog(true)}
          onSend={() => {}}
          onCopy={handleCopy}
        />
      )}
      {activeTab === "search" && <SearchTab />}
      {activeTab === "agent" && <AgentTab />}
      {activeTab === "activity" && <ActivityTab />}
      {activeTab === "settings" && <SettingsTab onLogout={disconnect} />}

      <BottomNav active={activeTab} onChange={setActiveTab} />

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

      {copied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full z-50">
          Copied!
        </div>
      )}
    </div>
  );
};

export default App;
