import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IAssetsResponse,
  type IUniversalAccountConfig,
} from "@particle-network/universal-account-sdk";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";
import { getParticleConnect } from "../lib/particleSafe";

type ParticleAccountInfo = {
  icons: string[];
  name: string;
  publicAddress: string;
  url: string;
  description?: string;
  chainId?: number;
  mnemonic?: string;
  walletType?: string;
};

const WalletType = { AuthCore: "AuthCore" as const };

interface AccountInfo {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

interface ProfileInfo {
  emoji: string;
  customImage: string | null;
  displayName: string;
  backgroundColor: string;
  blindSigningEnabled: boolean;
}

interface MobulaAsset {
  asset: {
    name: string;
    symbol: string;
    logo: string;
    price: number;
    contracts: string[];
    blockchains: string[];
  };
  token_balance: number;
  estimated_balance: number;
  cross_chain_balances?: Record<
    string,
    { token_balance: number; estimated_balance: number; address: string }
  >;
}

interface UniversalAccountContextType {
  universalAccount: UniversalAccount | null;
  address: string | undefined;
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  mobulaAssets: MobulaAsset[];
  combinedAssets: any[];
  isLoading: boolean;
  profile: ProfileInfo;
  updateProfile: (profile: ProfileInfo) => void;
  fetchAssets: () => Promise<void>;
  fetchMobulaAssets: () => Promise<void>;
  signUATransaction: (rootHash: string) => Promise<string>;
  connectedAccount: ParticleAccountInfo | null;
  setShowDepositModal: (show: boolean) => void;
  setShowAssetBreakdown: (show: boolean) => void;
  setShowTxHistory: (show: boolean) => void;
  setShowSendModal: (show: boolean) => void;
  showDepositModal: boolean;
  showAssetBreakdown: boolean;
  showTxHistory: boolean;
  showSendModal: boolean;
}

const DEFAULT_PROFILE: ProfileInfo = {
  emoji: "🟠",
  customImage: null,
  displayName: "Anon",
  backgroundColor: "#f97316",
  blindSigningEnabled: false,
};

const MOBULA_PROXY_URL =
  "https://lifi-proxy.orimolty.workers.dev/mobula/api/1/wallet/portfolio";

const UniversalAccountContext = createContext<
  UniversalAccountContextType | undefined
>(undefined);

export const UniversalAccountProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [connectedAccount, setConnectedAccount] =
    useState<ParticleAccountInfo | null>(null);
  const [universalAccount, setUniversalAccount] =
    useState<UniversalAccount | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [primaryAssets, setPrimaryAssets] = useState<IAssetsResponse | null>(
    null
  );
  const [mobulaAssets, setMobulaAssets] = useState<MobulaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfileState] = useState<ProfileInfo>(DEFAULT_PROFILE);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [showTxHistory, setShowTxHistory] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const address = connectedAccount?.publicAddress;
  const extra = Constants.expoConfig?.extra;

  // Load persisted profile on mount
  useEffect(() => {
    SecureStore.getItemAsync("walletProfile").then((saved) => {
      if (saved) {
        try {
          setProfileState({ ...DEFAULT_PROFILE, ...JSON.parse(saved) });
        } catch {}
      }
    });
  }, []);

  const updateProfile = useCallback((p: ProfileInfo) => {
    setProfileState(p);
    SecureStore.setItemAsync("walletProfile", JSON.stringify(p)).catch(() => {});
  }, []);

  const universalAccountConfig = useMemo((): IUniversalAccountConfig | null => {
    if (!address || !extra?.particleProjectId) return null;
    return {
      projectId: extra.particleProjectId,
      projectClientKey: extra.particleClientKey || "",
      projectAppUuid: extra.particleAppId || "",
      rpcUrl: "https://universal-rpc-staging.particle.network",
      smartAccountOptions: {
        useEIP7702: false,
        name: "UNIVERSAL",
        version: UNIVERSAL_ACCOUNT_VERSION,
        ownerAddress: address,
      },
    };
  }, [address, extra]);

  useEffect(() => {
    if (!address || !universalAccountConfig) {
      setUniversalAccount(null);
      setAccountInfo(null);
      setPrimaryAssets(null);
      setMobulaAssets([]);
      return;
    }

    try {
      const ua = new UniversalAccount(universalAccountConfig);
      setUniversalAccount(ua);
    } catch (err) {
      console.error("Error initializing Universal Account:", err);
    }
  }, [address, universalAccountConfig]);

  useEffect(() => {
    if (!universalAccount || !address) return;

    const fetchAddresses = async () => {
      try {
        const options = await universalAccount.getSmartAccountOptions();
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
  }, [universalAccount, address]);

  const fetchAssets = useCallback(async () => {
    if (!universalAccount) return;
    setIsLoading(true);
    try {
      const assets = await universalAccount.getPrimaryAssets();
      setPrimaryAssets(assets);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [universalAccount]);

  const fetchMobulaAssets = useCallback(async () => {
    if (!accountInfo?.evmSmartAccount) return;
    try {
      const response = await fetch(
        `${MOBULA_PROXY_URL}?wallet=${accountInfo.evmSmartAccount}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data?.data?.assets) {
        setMobulaAssets(data.data.assets);
      }
    } catch (error) {
      console.error("Failed to fetch Mobula assets:", error);
    }
  }, [accountInfo?.evmSmartAccount]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    if (accountInfo?.evmSmartAccount) {
      fetchMobulaAssets();
    }
  }, [accountInfo?.evmSmartAccount, fetchMobulaAssets]);

  const combinedAssets = useMemo(() => {
    const primarySymbols = new Set<string>();
    const merged: any[] = [];

    if (primaryAssets?.assets) {
      for (const asset of primaryAssets.assets) {
        primarySymbols.add((asset as any).symbol?.toUpperCase());
        merged.push({
          symbol: (asset as any).symbol,
          name: (asset as any).name,
          balance: (asset as any).balance,
          amountInUSD: (asset as any).amountInUSD,
          logo: (asset as any).image || (asset as any).logo,
          source: "primary" as const,
        });
      }
    }

    for (const mAsset of mobulaAssets) {
      if (!primarySymbols.has(mAsset.asset.symbol.toUpperCase())) {
        merged.push({
          symbol: mAsset.asset.symbol,
          name: mAsset.asset.name,
          balance: mAsset.token_balance,
          amountInUSD: mAsset.estimated_balance,
          logo: mAsset.asset.logo,
          price: mAsset.asset.price,
          source: "mobula" as const,
        });
      }
    }

    return merged;
  }, [primaryAssets, mobulaAssets]);

  const signUATransaction = useCallback(
    async (rootHash: string | Uint8Array): Promise<string> => {
      if (!address) throw new Error("No wallet connected");

      let hexMessage: string;
      if (typeof rootHash === "string") {
        hexMessage = rootHash.startsWith("0x")
          ? rootHash
          : "0x" + Buffer.from(rootHash).toString("hex");
      } else {
        hexMessage = "0x" + Buffer.from(rootHash).toString("hex");
      }

      // Uses personal_sign via Particle's native signMessage
      // This matches the webapp's signUniversalRootHash which also uses personal_sign
      // (both blind-sign and non-blind-sign paths produce the same EIP-191 signature)
      const pc = getParticleConnect();
      if (!pc) throw new Error("Particle Connect not available");
      const signature = await pc.signMessage(
        WalletType.AuthCore,
        address,
        hexMessage
      );
      return signature;
    },
    [address]
  );

  const setAccount = useCallback((account: ParticleAccountInfo | null) => {
    setConnectedAccount(account);
  }, []);

  return (
    <UniversalAccountContext.Provider
      value={{
        universalAccount,
        address,
        accountInfo,
        primaryAssets,
        mobulaAssets,
        combinedAssets,
        isLoading,
        profile,
        updateProfile,
        connectedAccount,
        fetchAssets,
        fetchMobulaAssets,
        signUATransaction,
        setShowDepositModal,
        setShowAssetBreakdown,
        setShowTxHistory,
        setShowSendModal,
        showDepositModal,
        showAssetBreakdown,
        showTxHistory,
        showSendModal,
      }}
    >
      <AccountSetter onSetAccount={setAccount} />
      {children}
    </UniversalAccountContext.Provider>
  );
};

const AccountSetter: React.FC<{
  onSetAccount: (account: ParticleAccountInfo | null) => void;
}> = ({ onSetAccount }) => {
  useEffect(() => {
    const checkExistingAccount = async () => {
      try {
        const pc = getParticleConnect();
        if (!pc) return;
        const accounts = await pc.getAccounts(WalletType.AuthCore);
        if (accounts.length > 0) {
          onSetAccount(accounts[0]);
        }
      } catch {
        // No existing connection
      }
    };
    checkExistingAccount();
  }, [onSetAccount]);

  return null;
};

export const useUniversalAccount = () => {
  const context = useContext(UniversalAccountContext);
  if (context === undefined) {
    // Return safe defaults instead of crashing the app in production.
    return {
      universalAccount: null,
      address: undefined,
      accountInfo: null,
      primaryAssets: null,
      mobulaAssets: [],
      combinedAssets: [],
      isLoading: false,
      profile: DEFAULT_PROFILE,
      updateProfile: () => {},
      fetchAssets: async () => {},
      fetchMobulaAssets: async () => {},
      signUATransaction: async () => "",
      connectedAccount: null,
      setShowDepositModal: () => {},
      setShowAssetBreakdown: () => {},
      setShowTxHistory: () => {},
      setShowSendModal: () => {},
      showDepositModal: false,
      showAssetBreakdown: false,
      showTxHistory: false,
      showSendModal: false,
    } as UniversalAccountContextType;
  }
  return context;
};

export { WalletType, type ParticleAccountInfo };
