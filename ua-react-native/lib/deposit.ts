import { UniversalAccount } from "@particle-network/universal-account-sdk";
import * as Clipboard from "expo-clipboard";

export const formatAddress = (address: string, chars = 6): string => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const getDepositAddresses = async (
  universalAccount: UniversalAccount
) => {
  if (!universalAccount) {
    throw new Error("Universal Account is not initialized");
  }

  const options = await universalAccount.getSmartAccountOptions();

  return {
    evmSmartAccount: options.smartAccountAddress || "",
    solanaSmartAccount: options.solanaSmartAccountAddress || "",
  };
};

export const copyToClipboard = async (
  text: string,
  callback?: (copied: boolean) => void
): Promise<void> => {
  try {
    await Clipboard.setStringAsync(text);
    if (callback) callback(true);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    if (callback) callback(false);
  }
};
