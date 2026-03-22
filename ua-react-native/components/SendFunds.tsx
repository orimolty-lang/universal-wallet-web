import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as Linking from "expo-linking";
import {
  CHAIN_ID,
} from "@particle-network/universal-account-sdk";
import { useUniversalAccount } from "../context/UniversalAccountContext";

export default function SendFunds() {
  const { universalAccount, address, signUATransaction } =
    useUniversalAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");

  const sendTransaction = async () => {
    if (!universalAccount || !address) {
      setTxResult("Error: Universal Account or wallet address not available");
      return;
    }

    setIsLoading(true);
    setTxResult(null);

    const usdcArbContract = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

    try {
      const transaction =
        await universalAccount.createTransferTransaction({
          token: {
            chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
            address: usdcArbContract,
          },
          amount,
          receiver: recipientAddress,
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
      console.error("Error sending funds:", error);
      setTxResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Funds</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Send Funds to another account</Text>
        <Text style={styles.description}>
          Send USDC from your Universal Account to another account on Arbitrum.
        </Text>

        <Text style={styles.inputLabel}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.1"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
        />

        <Text style={styles.inputLabel}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="0x..."
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={sendTransaction}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send Funds</Text>
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
          <Text style={styles.footerCode}>createTransferTransaction</Text>
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
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#c4b5fd",
  },
  description: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#d1d5db",
    marginTop: 4,
  },
  input: {
    backgroundColor: "#1A1A2A",
    borderWidth: 1,
    borderColor: "#4A4A6A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#e5e7eb",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#9333EA",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultContainer: { marginTop: 12, alignItems: "center" },
  errorText: { color: "#f87171", fontSize: 14, textAlign: "center" },
  successText: { color: "#c084fc", fontSize: 14, textDecorationLine: "underline" },
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
