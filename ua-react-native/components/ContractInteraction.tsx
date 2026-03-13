import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Linking from "expo-linking";
import { CHAIN_ID } from "@particle-network/universal-account-sdk";
import { Interface } from "ethers";
import { useUniversalAccount } from "../context/UniversalAccountContext";

export default function ContractInteraction() {
  const { universalAccount, address, signUATransaction } =
    useUniversalAccount();

  const [txResult, setTxResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTransaction = async () => {
    if (!universalAccount) return;
    setIsLoading(true);
    setTxResult(null);

    const CONTRACT_ADDRESS = "0x0287f57A1a17a725428689dfD9E65ECA01d82510";

    try {
      const contractInterface = new Interface(["function mint() external"]);

      const transaction =
        await universalAccount.createUniversalTransaction({
          chainId: CHAIN_ID.POLYGON_MAINNET,
          expectTokens: [],
          transactions: [
            {
              to: CONTRACT_ADDRESS,
              data: contractInterface.encodeFunctionData("mint"),
            },
          ],
        });

      const signature = await signUATransaction(transaction.rootHash);
      const result = await universalAccount.sendTransaction(
        transaction,
        signature
      );

      setTxResult(
        `https://universalx.app/activity/details?id=${result.transactionId}`
      );
    } catch (error) {
      console.error("Transaction failed:", error);
      setTxResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Contract Interaction</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Mint NFT on Polygon</Text>
        <Text style={styles.description}>
          Mint an NFT on Polygon Mainnet using tokens held in your Universal
          Account, even if they are not on Polygon.
        </Text>

        <View style={styles.contractInfo}>
          <Text style={styles.contractLabel}>NFT Collection</Text>
          <Text style={styles.contractValue}>Particle Demo NFT</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runTransaction}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Mint NFT</Text>
          )}
        </TouchableOpacity>

        {txResult && (
          <View style={styles.resultContainer}>
            {txResult.startsWith("Error") ? (
              <Text style={styles.errorText}>{txResult}</Text>
            ) : (
              <TouchableOpacity onPress={() => Linking.openURL(txResult)}>
                <Text style={styles.successText}>
                  View Transaction on Explorer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>SDK Functions Used:</Text>
          <Text style={styles.footerCode}>createUniversalTransaction</Text>
          <Text style={styles.footerCode}>sendTransaction</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e5e7eb",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A6A",
    paddingBottom: 8,
  },
  card: {
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: "#4A4A6A",
    gap: 12,
  },
  subtitle: { fontSize: 18, fontWeight: "500", color: "#c4b5fd" },
  description: { fontSize: 14, color: "#d1d5db", lineHeight: 20 },
  contractInfo: {
    backgroundColor: "#1A1A2A",
    borderWidth: 1,
    borderColor: "#4A4A6A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contractLabel: { fontSize: 14, color: "#d1d5db", marginBottom: 4 },
  contractValue: { fontSize: 16, color: "#9ca3af" },
  button: {
    backgroundColor: "#9333EA",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  resultContainer: { marginTop: 12, alignItems: "center" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "center" },
  successText: {
    color: "#c084fc",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#4A4A6A",
    paddingTop: 12,
    marginTop: 8,
  },
  footerLabel: { fontSize: 12, color: "#d1d5db", fontWeight: "500" },
  footerCode: {
    fontSize: 12,
    color: "#c4b5fd",
    backgroundColor: "#1A1A2A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    overflow: "hidden",
  },
});
