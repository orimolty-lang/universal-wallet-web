import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {
  SUPPORTED_TOKEN_TYPE, CHAIN_ID,
  type IAssetsResponse,
} from "@particle-network/universal-account-sdk";
import { useUniversalAccount } from "../context/UniversalAccountContext";

const UA_PRIMARY_ASSETS = [
  { symbol: "USDC", name: "USD Coin", type: SUPPORTED_TOKEN_TYPE.USDC, chains: [8453, 1, 42161, 10, 137, 43114, 101] },
  { symbol: "USDT", name: "Tether USD", type: SUPPORTED_TOKEN_TYPE.USDT, chains: [8453, 1, 42161, 10, 137, 43114, 56, 101] },
  { symbol: "ETH", name: "Ethereum", type: SUPPORTED_TOKEN_TYPE.ETH, chains: [8453, 1, 42161, 10, 137, 43114] },
  { symbol: "SOL", name: "Solana", type: SUPPORTED_TOKEN_TYPE.SOL, chains: [101] },
  { symbol: "BNB", name: "BNB", type: SUPPORTED_TOKEN_TYPE.BNB, chains: [56] },
];

const CHAIN_INFO: Record<number, { name: string; icon: string }> = {
  1: { name: "Ethereum", icon: "⟠" },
  8453: { name: "Base", icon: "🔵" },
  42161: { name: "Arbitrum", icon: "🔷" },
  10: { name: "Optimism", icon: "🔴" },
  137: { name: "Polygon", icon: "🟣" },
  43114: { name: "Avalanche", icon: "🔺" },
  56: { name: "BSC", icon: "🟡" },
  101: { name: "Solana", icon: "◎" },
};

interface ConvertModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConvertModal({ visible, onClose, onSuccess }: ConvertModalProps) {
  const { universalAccount, primaryAssets, signUATransaction } = useUniversalAccount();

  const [toAsset, setToAsset] = useState("USDC");
  const [toChain, setToChain] = useState<number>(8453);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showChainPicker, setShowChainPicker] = useState(false);

  const selectedAssetDef = UA_PRIMARY_ASSETS.find((a) => a.symbol === toAsset);
  const availableChains = selectedAssetDef?.chains || [];

  const handleConvert = async () => {
    if (!universalAccount || !amount || Number(amount) <= 0) return;

    setIsLoading(true);
    setError(null);
    setTxResult(null);

    try {
      const tokenType = selectedAssetDef?.type || SUPPORTED_TOKEN_TYPE.USDC;

      const transaction = await universalAccount.createConvertTransaction({
        expectToken: { type: tokenType, amount },
        chainId: toChain as CHAIN_ID,
      });

      const signature = await signUATransaction(transaction.rootHash);
      const result = await universalAccount.sendTransaction(transaction, signature);

      setTxResult(`https://universalx.app/activity/details?id=${result.transactionId}`);
      onSuccess?.();
    } catch (err) {
      console.error("Convert failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <Text style={s.title}>Convert</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body}>
            <Text style={s.label}>Convert to</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowAssetPicker(!showAssetPicker)}>
              <Text style={s.selectorText}>{toAsset}</Text>
              <Feather name="chevron-down" size={16} color="#9ca3af" />
            </TouchableOpacity>

            {showAssetPicker && (
              <View style={s.picker}>
                {UA_PRIMARY_ASSETS.map((a) => (
                  <TouchableOpacity
                    key={a.symbol}
                    style={[s.pickerItem, toAsset === a.symbol && s.pickerItemActive]}
                    onPress={() => { setToAsset(a.symbol); setShowAssetPicker(false); setToChain(a.chains[0]); }}
                  >
                    <Text style={s.pickerItemText}>{a.symbol} - {a.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[s.label, { marginTop: 16 }]}>Destination chain</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowChainPicker(!showChainPicker)}>
              <Text style={s.selectorText}>
                {CHAIN_INFO[toChain]?.icon} {CHAIN_INFO[toChain]?.name || `Chain ${toChain}`}
              </Text>
              <Feather name="chevron-down" size={16} color="#9ca3af" />
            </TouchableOpacity>

            {showChainPicker && (
              <View style={s.picker}>
                {availableChains.map((cid) => (
                  <TouchableOpacity
                    key={cid}
                    style={[s.pickerItem, toChain === cid && s.pickerItemActive]}
                    onPress={() => { setToChain(cid); setShowChainPicker(false); }}
                  >
                    <Text style={s.pickerItemText}>
                      {CHAIN_INFO[cid]?.icon} {CHAIN_INFO[cid]?.name || `Chain ${cid}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[s.label, { marginTop: 16 }]}>Amount</Text>
            <TextInput
              style={s.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
            />

            {error && <Text style={s.error}>{error}</Text>}

            {txResult && (
              <TouchableOpacity onPress={() => Linking.openURL(txResult)}>
                <Text style={s.success}>View Transaction on Explorer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.button, (isLoading || !amount) && s.buttonDisabled]}
              onPress={handleConvert}
              disabled={isLoading || !amount}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Convert</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  content: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  title: { fontSize: 20, fontWeight: "600", color: "#fff" },
  body: { padding: 16 },
  label: { fontSize: 14, color: "#9ca3af", marginBottom: 8 },
  selector: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#333" },
  selectorText: { color: "#fff", fontSize: 16 },
  picker: { backgroundColor: "#2a2a2a", borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: "#333" },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#333" },
  pickerItemActive: { backgroundColor: "#333" },
  pickerItemText: { color: "#fff", fontSize: 14 },
  input: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, borderWidth: 1, borderColor: "#333" },
  error: { color: "#f87171", fontSize: 14, marginTop: 12, textAlign: "center" },
  success: { color: "#c084fc", fontSize: 14, marginTop: 12, textAlign: "center", textDecorationLine: "underline" },
  button: { backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 20, marginBottom: 32 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
