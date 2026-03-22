import {
  UniversalAccount,
  CHAIN_ID,
} from "@particle-network/universal-account-sdk";
import { Interface } from "ethers";

type TransactionResult = {
  success: boolean;
  transactionId?: string;
  explorerUrl?: string;
  error?: string;
};

export const executeTransaction = async (
  universalAccount: UniversalAccount,
  signUATransaction: (rootHash: string) => Promise<string>,
  options: {
    contractAddress: string;
    chainId: CHAIN_ID;
    functionName: string;
    functionInterface: string[];
    functionArgs?: unknown[];
    value?: string;
  }
): Promise<TransactionResult> => {
  if (!universalAccount) {
    throw new Error("Universal Account is not initialized");
  }

  try {
    const contractInterface = new Interface(options.functionInterface);

    const data = options.functionArgs
      ? contractInterface.encodeFunctionData(
          options.functionName,
          options.functionArgs
        )
      : contractInterface.encodeFunctionData(options.functionName);

    const transaction = await universalAccount.createUniversalTransaction({
      chainId: options.chainId,
      expectTokens: [],
      transactions: [
        {
          to: options.contractAddress,
          data,
          value: options.value || "0x0",
        },
      ],
    });

    const signature = await signUATransaction(transaction.rootHash);

    const result = await universalAccount.sendTransaction(
      transaction,
      signature
    );

    return {
      success: true,
      transactionId: result.transactionId,
      explorerUrl: `https://universalx.app/activity/details?id=${result.transactionId}`,
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const mintNFT = async (
  universalAccount: UniversalAccount,
  signUATransaction: (rootHash: string) => Promise<string>
): Promise<TransactionResult> => {
  const CONTRACT_ADDRESS = "0x0287f57A1a17a725428689dfD9E65ECA01d82510";

  return executeTransaction(universalAccount, signUATransaction, {
    contractAddress: CONTRACT_ADDRESS,
    chainId: CHAIN_ID.POLYGON_MAINNET,
    functionName: "mint",
    functionInterface: ["function mint() external"],
  });
};
