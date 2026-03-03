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
type TabType = "home" | "search" | "activity" | "settings";

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
  const tokens = primaryAssets?.assets?.map((asset: { symbol?: string; name?: string; balance?: string | number; amountInUSD?: number }) => ({
    symbol: asset.symbol || "???",
    name: asset.name || "Unknown",
    balance: typeof asset.balance === 'string' ? parseFloat(asset.balance) : (asset.balance || 0),
    amountInUSD: asset.amountInUSD || 0,
    change: 0, // placeholder
  })) || [];

  return (
    <div className="flex-1 overflow-auto pb-20 bg-[#0a0a0a]">
      {/* Profile & Balance */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl mb-3">
          🍊
        </div>
        <div className="text-gray-400 text-sm mb-1">
          {accountInfo ? formatAddress(accountInfo.evmSmartAccount) : "Loading..."}
        </div>
        <div className="text-white text-4xl font-bold">
          ${primaryAssets?.totalAmountInUSD?.toFixed(2) || "0.00"}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 py-4">
        <button onClick={onDeposit} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#f5a623] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l-4 4m4-4l4 4" />
            </svg>
          </div>
          <span className="text-gray-400 text-xs">Buy</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#f5a623] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className="text-gray-400 text-xs">Swap</span>
        </button>
        <button onClick={onSend} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#f5a623] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span className="text-gray-400 text-xs">Send</span>
        </button>
        <button onClick={onCopy} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-[#f5a623] flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-gray-400 text-xs">Copy</span>
        </button>
      </div>

      {/* Token List */}
      <div className="px-4 mt-2">
        {tokens.length > 0 ? (
          <div>
            {tokens.map((token, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                    {token.symbol === "ETH" ? "⟠" : token.symbol === "USDC" ? "$" : token.symbol === "SOL" ? "◎" : "•"}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{token.name}</div>
                    <div className="text-gray-500 text-xs">{token.balance.toFixed(4)} {token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm">${token.amountInUSD.toFixed(2)}</div>
                  <div className={`text-xs ${token.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {token.change >= 0 ? "+" : ""}{token.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            <button className="text-gray-500 text-sm py-3 flex items-center gap-1">
              All <span>›</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-600 text-sm">No tokens yet</div>
            <button onClick={onDeposit} className="text-[#f5a623] text-sm mt-2">
              Deposit to get started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Search Tab
const SearchTab = () => {
  const [query, setQuery] = useState("");
  
  return (
    <div className="flex-1 overflow-auto pb-20 bg-[#0a0a0a] px-4 pt-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens"
        className="w-full bg-gray-900 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 border-none outline-none"
      />
      <div className="mt-6">
        <div className="text-gray-500 text-xs uppercase mb-3">Popular</div>
        {["ETH", "SOL", "USDC", "ARB"].map(symbol => (
          <div key={symbol} className="flex items-center justify-between py-3 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                {symbol === "ETH" ? "⟠" : symbol === "SOL" ? "◎" : symbol === "USDC" ? "$" : "🔵"}
              </div>
              <div className="text-white text-sm">{symbol}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Tab
const ActivityTab = () => (
  <div className="flex-1 overflow-auto pb-20 bg-[#0a0a0a] px-4 pt-4">
    <div className="text-white font-medium mb-4">Activity</div>
    <div className="text-center py-12 text-gray-600 text-sm">
      No transactions yet
    </div>
  </div>
);

// Settings Tab
const SettingsTab = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex-1 overflow-auto pb-20 bg-[#0a0a0a] px-4 pt-4">
    <div className="text-white font-medium mb-4">Settings</div>
    <button 
      onClick={onLogout}
      className="w-full text-left py-3 text-red-500 text-sm"
    >
      Log out
    </button>
  </div>
);

// Bottom Nav
const BottomNav = ({ active, onChange }: { active: TabType; onChange: (t: TabType) => void }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-gray-800/50 px-8 py-3 pb-6 flex justify-between">
    <button onClick={() => onChange("home")} className={active === "home" ? "text-[#f5a623]" : "text-gray-500"}>
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </button>
    <button onClick={() => onChange("search")} className={active === "search" ? "text-[#f5a623]" : "text-gray-500"}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </button>
    <button onClick={() => onChange("activity")} className={active === "activity" ? "text-[#f5a623]" : "text-gray-500"}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </button>
    <button onClick={() => onChange("settings")} className={active === "settings" ? "text-[#f5a623]" : "text-gray-500"}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </button>
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full">
          Copied!
        </div>
      )}
    </div>
  );
};

export default App;
