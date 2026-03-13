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
import { SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { useUniversalAccount } from "../context/UniversalAccountContext";

export default function Conversions() {
  const { universalAccount, signUATransaction } = useUniversalAccount();

  const [amount, setAmount] = useState("1");
  const [txResult, setTxResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runConversion = async () => {
    if (!universalAccount) return;
    setIsLoading(true);
    setTxResult(null);

    try {
      if (!amount || Number(amount) <= 0) {
        throw new Error("Please enter a valid USDC amount.");
      }

      const transaction =
        await universalAccount.createConvertTransaction({
          expectToken: { type: SUPPORTED_TOKEN_TYPE.USDC, amount: "0.1" },
          chainId: 143,
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
      console.error("Convert transaction failed:", error);
      setTxResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cross-Chain Conversion</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Convert to USDC</Text>
        <Text style={styles.description}>
          Convert assets from any chain to USDC on Solana. UA handles sourcing
          and swapping from assets you hold on other chains.
        </Text>

        <Text style={styles.inputLabel}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 1.00"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runConversion}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Convert to USDC</Text>
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
          <Text style={styles.footerCode}>createConvertTransaction</Text>
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
  inputLabel: { fontSize: 14, color: "#d1d5db", marginTop: 4 },
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
