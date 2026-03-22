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
  SUPPORTED_TOKEN_TYPE,
  serializeInstruction,
} from "@particle-network/universal-account-sdk";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useUniversalAccount } from "../context/UniversalAccountContext";

const SOL_DECIMALS = 9;
const SOL_FACTOR = BigInt("1" + "0".repeat(SOL_DECIMALS));
const SOL_AMOUNT_REGEX = /^\d+(\.\d{0,9})?$/;

function parseSolAmount(amount: string): bigint {
  const [wholeRaw, fracRaw = ""] = amount.split(".");
  const whole = wholeRaw || "0";
  const fracPadded = (fracRaw + "0".repeat(SOL_DECIMALS)).slice(
    0,
    SOL_DECIMALS
  );
  return BigInt(whole) * SOL_FACTOR + BigInt(fracPadded || "0");
}

export default function SendSolana() {
  const { universalAccount, address, accountInfo, signUATransaction } =
    useUniversalAccount();

  const [txResult, setTxResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const runTransaction = async () => {
    if (!universalAccount) return;

    setIsLoading(true);
    setTxResult(null);

    try {
      if (!amount || !SOL_AMOUNT_REGEX.test(amount) || Number(amount) <= 0) {
        throw new Error(
          "Please enter a valid SOL amount (e.g., 0.5 or 1.25)."
        );
      }
      if (!address) {
        throw new Error("Missing EVM address to sign.");
      }
      if (!accountInfo?.solanaSmartAccount) {
        throw new Error("Missing Solana smart account address.");
      }
      if (!recipient) {
        throw new Error("Please enter a valid recipient Solana address.");
      }

      const ownerPubkey = new PublicKey(accountInfo.solanaSmartAccount);
      const recipientPubkey = new PublicKey(recipient);
      const lamports = parseSolAmount(amount);

      const transferIx = SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: recipientPubkey,
        lamports,
      });

      const serializedInstruction = serializeInstruction(transferIx);

      const transaction =
        await universalAccount.createUniversalTransaction({
          chainId: CHAIN_ID.SOLANA_MAINNET,
          expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.SOL, amount }],
          transactions: [serializedInstruction],
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
      console.error("Solana SOL transfer failed:", error);
      setTxResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solana SOL Transfer</Text>
      <View style={styles.card}>
        <Text style={styles.subtitle}>Send Native SOL</Text>

        <Text style={styles.inputLabel}>Amount (SOL)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 0.5"
          placeholderTextColor="#6b7280"
          keyboardType="decimal-pad"
        />

        <Text style={styles.inputLabel}>Recipient (Solana address)</Text>
        <TextInput
          style={styles.input}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="e.g. 7uY2...wod8Hm"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[
            styles.button,
            (isLoading || !amount || !recipient || !universalAccount) &&
              styles.buttonDisabled,
          ]}
          onPress={runTransaction}
          disabled={isLoading || !amount || !recipient || !universalAccount}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send SOL on Solana</Text>
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
