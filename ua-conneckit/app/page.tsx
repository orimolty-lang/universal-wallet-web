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
  Home,
  Search,
  Bot,
  Activity,
  Copy,
  Check,
  Send,
  ArrowDownToLine,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  Star,
  X,
  ChevronRight,
} from "lucide-react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IAssetsResponse,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import DepositDialog from "./components/DepositDialog";
import AssetBreakdownDialog from "./components/AssetBreakdownDialog";

// Types
type TabType = "home" | "search" | "agent" | "activity";

interface AccountInfo {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  logo?: string;
  balance?: number;
  amountInUSD?: number;
}

// Popular tokens for search
const POPULAR_TOKENS: Token[] = [
  { symbol: "ETH", name: "Ethereum", price: 3450.23, change24h: 2.5, logo: "⟠" },
  { symbol: "BTC", name: "Bitcoin", price: 67234.50, change24h: 1.8, logo: "₿" },
  { symbol: "SOL", name: "Solana", price: 178.45, change24h: -0.5, logo: "◎" },
  { symbol: "USDC", name: "USD Coin", price: 1.00, change24h: 0.01, logo: "💵" },
  { symbol: "ARB", name: "Arbitrum", price: 1.23, change24h: 4.2, logo: "🔵" },
  { symbol: "OP", name: "Optimism", price: 2.89, change24h: 3.1, logo: "🔴" },
  { symbol: "MATIC", name: "Polygon", price: 0.72, change24h: -1.2, logo: "💜" },
  { symbol: "LINK", name: "Chainlink", price: 18.45, change24h: 2.8, logo: "⬡" },
];

// Helper functions
const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const formatPrice = (price: number) => {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

// Login Screen Component
const LoginScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
    <div className="text-7xl mb-6 animate-bounce">🍊</div>
    <h1 className="text-3xl font-bold text-white mb-2 tracking-wider">UNIVERSAL WALLET</h1>
    
    <div className="my-12 space-y-5 w-full max-w-xs">
      <div className="flex items-center gap-4">
        <div className="border-2 border-purple-500 rounded-lg px-4 py-2">
          <span className="text-purple-500 font-bold">One</span>
        </div>
        <span className="text-white text-2xl font-bold">Account</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="border-2 border-purple-500 rounded-lg px-4 py-2">
          <span className="text-purple-500 font-bold">One</span>
        </div>
        <span className="text-white text-2xl font-bold">Balance</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="border-2 border-purple-500 rounded-lg px-4 py-2">
          <span className="text-purple-500 font-bold">Any</span>
        </div>
        <span className="text-white text-2xl font-bold">Chain</span>
      </div>
    </div>

    <div className="mt-8 w-full max-w-xs">
      <ConnectButton label="Get Started" />
    </div>
  </div>
);

// Token Row Component (Rainbow style)
const TokenRow = ({ token, showBalance = false }: { token: Token; showBalance?: boolean }) => (
  <div className="flex items-center justify-between py-4 px-4 hover:bg-zinc-900/50 rounded-2xl transition-all cursor-pointer active:scale-98">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xl border border-zinc-700">
        {token.logo || "🪙"}
      </div>
      <div>
        <div className="text-white font-semibold">{token.symbol}</div>
        <div className="text-gray-500 text-sm">{token.name}</div>
      </div>
    </div>
    <div className="text-right">
      {showBalance && token.balance !== undefined ? (
        <>
          <div className="text-white font-medium">{token.balance.toFixed(4)}</div>
          <div className="text-gray-500 text-sm">{formatPrice(token.amountInUSD || 0)}</div>
        </>
      ) : (
        <>
          <div className="text-white font-medium">{formatPrice(token.price)}</div>
          <div className={`text-sm flex items-center justify-end gap-1 ${token.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
            {token.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(token.change24h).toFixed(2)}%
          </div>
        </>
      )}
    </div>
  </div>
);

// Home Tab Component
const HomeTab = ({ 
  accountInfo, 
  primaryAssets, 
  onDeposit,
  onSend,
  onViewAssets
}: {
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  onDeposit: () => void;
  onSend: () => void;
  onViewAssets: () => void;
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    copyToClipboard(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Convert assets to Token format
  const tokens: Token[] = primaryAssets?.assets?.map((asset: { symbol?: string; name?: string; balance?: string | number; amountInUSD?: number }) => ({
    symbol: asset.symbol || "???",
    name: asset.name || "Unknown",
    price: 0,
    change24h: 0,
    logo: asset.symbol === "ETH" ? "⟠" : asset.symbol === "USDC" ? "💵" : asset.symbol === "SOL" ? "◎" : "🪙",
    balance: typeof asset.balance === 'string' ? parseFloat(asset.balance) : asset.balance,
    amountInUSD: asset.amountInUSD,
  })) || [];

  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Balance Card - Rainbow Style */}
      <div 
        className="relative overflow-hidden rounded-3xl mx-4 mt-4 cursor-pointer"
        onClick={onViewAssets}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
        <div className="relative p-6">
          <div className="text-sm text-white/70 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Universal Balance
          </div>
          <div className="text-5xl font-bold text-white mb-2 tracking-tight">
            ${primaryAssets?.totalAmountInUSD.toFixed(2) || "0.00"}
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <span>Across all chains</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 px-4 mt-6">
        <button 
          onClick={onDeposit}
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 border border-zinc-800 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-white font-medium">Receive</span>
        </button>
        <button 
          onClick={onSend}
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-2 border border-zinc-800 transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Send className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-white font-medium">Send</span>
        </button>
      </div>

      {/* Your Tokens */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Your Tokens</h3>
          {tokens.length > 0 && (
            <span className="text-gray-500 text-sm">{tokens.length} tokens</span>
          )}
        </div>
        
        {tokens.length > 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
            {tokens.map((token, i) => (
              <TokenRow key={i} token={token} showBalance />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-8 text-center">
            <div className="text-4xl mb-3">🪙</div>
            <div className="text-gray-400">No tokens yet</div>
            <button 
              onClick={onDeposit}
              className="mt-4 text-purple-400 font-medium"
            >
              Deposit to get started →
            </button>
          </div>
        )}
      </div>

      {/* Account Addresses (collapsible) */}
      {accountInfo && (
        <div className="px-4 mt-8">
          <h3 className="text-gray-500 text-sm font-medium mb-3">Your Addresses</h3>
          <div className="space-y-2">
            {/* EVM */}
            <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌐</span>
                <span className="text-gray-400 text-sm">EVM</span>
                <span className="text-white font-mono text-sm">{formatAddress(accountInfo.evmSmartAccount)}</span>
              </div>
              <button 
                onClick={() => handleCopy(accountInfo.evmSmartAccount)}
                className="p-1.5 rounded-lg hover:bg-zinc-800"
              >
                {copiedAddress === accountInfo.evmSmartAccount ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            {/* Solana */}
            <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">◎</span>
                <span className="text-gray-400 text-sm">Solana</span>
                <span className="text-white font-mono text-sm">{formatAddress(accountInfo.solanaSmartAccount)}</span>
              </div>
              <button 
                onClick={() => handleCopy(accountInfo.solanaSmartAccount)}
                className="p-1.5 rounded-lg hover:bg-zinc-800"
              >
                {copiedAddress === accountInfo.solanaSmartAccount ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Search Tab Component
const SearchTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(["ETH", "SOL", "ARB"]);

  const filteredTokens = searchQuery 
    ? POPULAR_TOKENS.filter(t => 
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_TOKENS;

  const addToRecent = (symbol: string) => {
    setRecentSearches(prev => [symbol, ...prev.filter(s => s !== symbol)].slice(0, 5));
  };

  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Search Input */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search tokens..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-sm font-medium">Recent</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(symbol => (
              <button
                key={symbol}
                onClick={() => setSearchQuery(symbol)}
                className="px-4 py-2 bg-zinc-900 rounded-full text-white text-sm border border-zinc-800 hover:border-purple-500 transition-colors"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending / Results */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          {searchQuery ? (
            <span className="text-gray-500 text-sm font-medium">Results</span>
          ) : (
            <>
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-500 text-sm font-medium">Popular</span>
            </>
          )}
        </div>
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
          {filteredTokens.map((token, i) => (
            <div key={i} onClick={() => addToRecent(token.symbol)}>
              <TokenRow token={token} />
            </div>
          ))}
        </div>
        {filteredTokens.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tokens found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
};

// Agent Tab Component
const AgentTab = () => {
  const [message, setMessage] = useState("");

  const suggestions = [
    "Swap 10 USDC to ETH",
    "Bridge to Arbitrum",
    "What's my SOL balance?",
    "Send 0.1 ETH to vitalik.eth",
  ];

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl text-white font-bold mb-2">AI Agent</h2>
        <p className="text-gray-500 text-center mb-6">Your personal crypto assistant</p>
        
        {/* Suggestions */}
        <div className="w-full max-w-sm space-y-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setMessage(suggestion)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 text-left text-gray-300 border border-zinc-800 transition-all flex items-center gap-3"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button className="bg-purple-500 hover:bg-purple-600 rounded-xl px-4 py-3 text-white font-medium transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// Activity Tab Component  
const ActivityTab = () => {
  const mockActivity = [
    { type: "receive", token: "ETH", amount: 0.5, time: "2 hours ago", status: "completed" },
    { type: "send", token: "USDC", amount: 100, time: "Yesterday", status: "completed" },
    { type: "swap", from: "ETH", to: "ARB", amount: 0.1, time: "3 days ago", status: "completed" },
  ];

  return (
    <div className="flex-1 overflow-auto pb-24">
      <div className="px-4 pt-4">
        <h2 className="text-xl text-white font-bold mb-4">Activity</h2>
        
        {mockActivity.length > 0 ? (
          <div className="space-y-3">
            {mockActivity.map((tx, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "receive" ? "bg-green-500/20" : 
                      tx.type === "send" ? "bg-red-500/20" : "bg-purple-500/20"
                    }`}>
                      {tx.type === "receive" ? (
                        <ArrowDownToLine className="w-5 h-5 text-green-400" />
                      ) : tx.type === "send" ? (
                        <Send className="w-5 h-5 text-red-400" />
                      ) : (
                        <Activity className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium capitalize">{tx.type}</div>
                      <div className="text-gray-500 text-sm">{tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${tx.type === "receive" ? "text-green-400" : "text-white"}`}>
                      {tx.type === "receive" ? "+" : tx.type === "send" ? "-" : ""}
                      {tx.amount} {tx.token || `${tx.from}→${tx.to}`}
                    </div>
                    <div className="text-gray-500 text-sm capitalize">{tx.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Activity className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-gray-500 text-center">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Bottom Tab Bar Component
const TabBar = ({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 px-6 py-2 pb-6 flex justify-around items-center">
    {[
      { id: "home" as TabType, icon: Home, label: "Home" },
      { id: "search" as TabType, icon: Search, label: "Search" },
      { id: "agent" as TabType, icon: Bot, label: "Agent" },
      { id: "activity" as TabType, icon: Activity, label: "Activity" },
    ].map(({ id, icon: Icon, label }) => (
      <button 
        key={id}
        onClick={() => onTabChange(id)}
        className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
          activeTab === id 
            ? "text-purple-400" 
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    ))}
  </div>
);

// Main App Component
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

  if (!isConnected) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍊</span>
          <span className="text-white font-bold">Universal</span>
        </div>
        <button 
          onClick={() => disconnect()}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "home" && (
        <HomeTab 
          accountInfo={accountInfo}
          primaryAssets={primaryAssets}
          onDeposit={() => setShowDepositDialog(true)}
          onSend={() => {}}
          onViewAssets={() => setShowAssetBreakdown(true)}
        />
      )}
      {activeTab === "search" && <SearchTab />}
      {activeTab === "agent" && <AgentTab />}
      {activeTab === "activity" && <ActivityTab />}

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

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
