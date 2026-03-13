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
import * as particleConnect from "@particle-network/rn-connect";
import { WalletType, type AccountInfo as ParticleAccountInfo } from "@particle-network/rn-connect";
import Constants from "expo-constants";
import { Buffer } from "buffer";

interface AccountInfo {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
}

interface UniversalAccountContextType {
  universalAccount: UniversalAccount | null;
  address: string | undefined;
  accountInfo: AccountInfo | null;
  primaryAssets: IAssetsResponse | null;
  isLoading: boolean;
  connectedAccount: ParticleAccountInfo | null;
  fetchAssets: () => Promise<void>;
  signUATransaction: (rootHash: Uint8Array) => Promise<string>;
}

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
  const [isLoading, setIsLoading] = useState(false);

  const address = connectedAccount?.publicAddress;
  const extra = Constants.expoConfig?.extra;

  const universalAccountConfig = useMemo((): IUniversalAccountConfig | null => {
    if (!address || !extra?.particleProjectId) return null;
    return {
      projectId: extra.particleProjectId,
      projectClientKey: extra.particleClientKey || "",
      projectAppUuid: extra.particleAppId || "",
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
    try {
      const assets = await universalAccount.getPrimaryAssets();
      setPrimaryAssets(assets);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    }
  }, [universalAccount]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const signUATransaction = useCallback(
    async (rootHash: Uint8Array): Promise<string> => {
      if (!address) throw new Error("No wallet connected");

      const hexMessage = "0x" + Buffer.from(rootHash).toString("hex");
      const signature = await particleConnect.signMessage(
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
        isLoading,
        connectedAccount,
        fetchAssets,
        signUATransaction,
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
        const accounts = await particleConnect.getAccounts(WalletType.AuthCore);
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
    throw new Error(
      "useUniversalAccount must be used within a UniversalAccountProvider"
    );
  }
  return context;
};

export { WalletType, type ParticleAccountInfo };
