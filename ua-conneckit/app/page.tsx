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

// Helper functions
const formatAddress = (addr: string) => {
  if (!addr) return "";
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

// Login Screen Component
const LoginScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
    <div className="text-7xl mb-6">🍊</div>
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

  return (
    <div className="flex-1 overflow-auto pb-24">
      {/* Balance Card */}
      <div 
        className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl p-6 mx-4 mt-4 cursor-pointer"
        onClick={onViewAssets}
      >
        <div className="text-sm text-purple-200 mb-1">Universal Balance</div>
        <div className="text-4xl font-bold text-white mb-4">
          ${primaryAssets?.totalAmountInUSD.toFixed(2) || "0.00"}
        </div>
        <div className="text-xs text-purple-300">Tap to view breakdown</div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 px-4 mt-6">
        <button 
          onClick={onDeposit}
          className="flex-1 bg-zinc-900 rounded-xl p-4 flex flex-col items-center gap-2 border border-zinc-800"
        >
          <ArrowDownToLine className="w-6 h-6 text-purple-400" />
          <span className="text-white text-sm">Receive</span>
        </button>
        <button 
          onClick={onSend}
          className="flex-1 bg-zinc-900 rounded-xl p-4 flex flex-col items-center gap-2 border border-zinc-800"
        >
          <Send className="w-6 h-6 text-purple-400" />
          <span className="text-white text-sm">Send</span>
        </button>
      </div>

      {/* Account Addresses */}
      {accountInfo && (
        <div className="px-4 mt-6 space-y-3">
          <h3 className="text-gray-400 text-sm font-medium">Your Addresses</h3>
          
          {/* EVM UA */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-purple-400 mb-1">🌐 EVM Universal Account</div>
                <div className="text-white font-mono text-sm">
                  {formatAddress(accountInfo.evmSmartAccount)}
                </div>
              </div>
              <button 
                onClick={() => handleCopy(accountInfo.evmSmartAccount)}
                className="p-2 rounded-lg bg-zinc-800"
              >
                {copiedAddress === accountInfo.evmSmartAccount ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Solana UA */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-green-400 mb-1">☀️ Solana Universal Account</div>
                <div className="text-white font-mono text-sm">
                  {formatAddress(accountInfo.solanaSmartAccount)}
                </div>
              </div>
              <button 
                onClick={() => handleCopy(accountInfo.solanaSmartAccount)}
                className="p-2 rounded-lg bg-zinc-800"
              >
                {copiedAddress === accountInfo.solanaSmartAccount ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets List */}
      {primaryAssets && primaryAssets.assets && primaryAssets.assets.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-gray-400 text-sm font-medium mb-3">Assets</h3>
          <div className="space-y-2">
            {primaryAssets.assets.slice(0, 5).map((asset: { symbol?: string; name?: string; balance?: string | number; amountInUSD?: number }, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                    {asset.symbol === "USDC" ? "💵" : asset.symbol === "ETH" ? "⟠" : "🪙"}
                  </div>
                  <div>
                    <div className="text-white font-medium">{asset.symbol || "Token"}</div>
                    <div className="text-gray-500 text-sm">{asset.name || ""}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">{asset.balance ? parseFloat(String(asset.balance)).toFixed(4) : "0"}</div>
                  <div className="text-gray-500 text-sm">${asset.amountInUSD?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search Tab Component
const SearchTab = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-6">
    <Search className="w-16 h-16 text-zinc-700 mb-4" />
    <h2 className="text-xl text-white font-bold mb-2">Search</h2>
    <p className="text-gray-500 text-center">Search tokens, NFTs, and addresses across all chains</p>
    <div className="mt-6 w-full max-w-sm">
      <input 
        type="text" 
        placeholder="Search..." 
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-gray-500"
      />
    </div>
  </div>
);

// Agent Tab Component
const AgentTab = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-6">
    <Bot className="w-16 h-16 text-purple-500 mb-4" />
    <h2 className="text-xl text-white font-bold mb-2">AI Agent</h2>
    <p className="text-gray-500 text-center mb-6">Your personal crypto assistant</p>
    <div className="w-full max-w-sm bg-zinc-900 rounded-xl p-4 border border-zinc-800">
      <p className="text-gray-400 text-sm mb-4">Try asking:</p>
      <div className="space-y-2">
        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-gray-300">&quot;Swap 10 USDC to ETH&quot;</div>
        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-gray-300">&quot;Send 5 SOL to vitalik.eth&quot;</div>
        <div className="bg-zinc-800 rounded-lg p-3 text-sm text-gray-300">&quot;What&apos;s my total balance?&quot;</div>
      </div>
    </div>
  </div>
);

// Activity Tab Component  
const ActivityTab = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-6">
    <Activity className="w-16 h-16 text-zinc-700 mb-4" />
    <h2 className="text-xl text-white font-bold mb-2">Activity</h2>
    <p className="text-gray-500 text-center">Your transaction history will appear here</p>
  </div>
);

// Bottom Tab Bar Component
const TabBar = ({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-6 py-3 flex justify-around items-center">
    <button 
      onClick={() => onTabChange("home")}
      className={`flex flex-col items-center gap-1 ${activeTab === "home" ? "text-purple-400" : "text-gray-500"}`}
    >
      <Home className="w-6 h-6" />
      <span className="text-xs">Home</span>
    </button>
    <button 
      onClick={() => onTabChange("search")}
      className={`flex flex-col items-center gap-1 ${activeTab === "search" ? "text-purple-400" : "text-gray-500"}`}
    >
      <Search className="w-6 h-6" />
      <span className="text-xs">Search</span>
    </button>
    <button 
      onClick={() => onTabChange("agent")}
      className={`flex flex-col items-center gap-1 ${activeTab === "agent" ? "text-purple-400" : "text-gray-500"}`}
    >
      <Bot className="w-6 h-6" />
      <span className="text-xs">Agent</span>
    </button>
    <button 
      onClick={() => onTabChange("activity")}
      className={`flex flex-col items-center gap-1 ${activeTab === "activity" ? "text-purple-400" : "text-gray-500"}`}
    >
      <Activity className="w-6 h-6" />
      <span className="text-xs">Activity</span>
    </button>
  </div>
);

// Main App Component
const App = () => {
  useWallets(); // Keep hook active
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [universalAccountInstance, setUniversalAccountInstance] = useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);

  // Initialize Universal Account
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

  // Fetch account addresses
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

  // Fetch assets
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

  // Show login screen if not connected
  if (!isConnected) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-900">
        <div className="text-2xl">🍊</div>
        <button 
          onClick={() => disconnect()}
          className="text-gray-400 text-sm"
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

      {/* Bottom Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Dialogs */}
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
