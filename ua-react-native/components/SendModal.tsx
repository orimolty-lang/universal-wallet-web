import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { CHAIN_ID } from "@particle-network/universal-account-sdk";
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { useUniversalAccount } from "../context/UniversalAccountContext";
import { supportedChains } from "../lib/chains";
import { dummyTokens } from "../lib/tokens";

interface SendModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  56: "BNB Chain",
  101: "Solana",
  43114: "Avalanche",
};

const CHAIN_ID_MAP: Record<number, number> = {
  1: CHAIN_ID.ETHEREUM_MAINNET,
  8453: CHAIN_ID.BASE_MAINNET,
  42161: CHAIN_ID.ARBITRUM_MAINNET_ONE,
  10: CHAIN_ID.OPTIMISM_MAINNET,
  137: CHAIN_ID.POLYGON_MAINNET,
  56: CHAIN_ID.BSC_MAINNET,
  101: CHAIN_ID.SOLANA_MAINNET,
  43114: CHAIN_ID.AVALANCHE_MAINNET,
};

function isEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

function isSolanaAddress(addr: string): boolean {
  const a = addr.trim();
  return a.length >= 32 && a.length <= 44 && !a.startsWith("0x");
}

function getTokenIcon(symbol: string): string | undefined {
  return dummyTokens.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  )?.icon;
}

function getChainIcon(chainId: number): string | undefined {
  return supportedChains.find((c) => Number(c.chainId) === chainId)?.icon;
}

interface TransferOption {
  key: string;
  symbol: string;
  chainId: number;
  address: string;
  balance: number;
}

export default function SendModal({
  visible,
  onClose,
  onSuccess,
}: SendModalProps) {
  const { universalAccount, primaryAssets, signUATransaction } =
    useUniversalAccount();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<{ txId: string } | null>(null);
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  const transferOptions = useMemo((): TransferOption[] => {
    if (!primaryAssets?.assets) return [];
    const out: TransferOption[] = [];
    for (const a of primaryAssets.assets) {
      const asset = a as {
        tokenType?: string;
        chainAggregation?: Array<{
          token?: { chainId?: number; address?: string };
          amount?: number;
        }>;
      };
      const chainAgg = asset.chainAggregation;
      if (!chainAgg?.length) continue;
      for (const c of chainAgg) {
        const chainId = Number(c.token?.chainId);
        const tokenAddr = c.token?.address || "";
        const bal = Number(c.amount || 0);
        if (bal < 0.0001 || !chainId) continue;
        const key = `${asset.tokenType}-${chainId}`;
        out.push({
          key,
          symbol: asset.tokenType?.toUpperCase() || "?",
          chainId,
          address: tokenAddr,
          balance: bal,
        });
      }
    }
    return out;
  }, [primaryAssets]);

  const selected = transferOptions.find((o) => o.key === selectedOption);
  const canSend =
    selected &&
    recipient.trim() &&
    amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= (selected?.balance ?? 0);

  const handleSend = async () => {
    if (!universalAccount || !selected || !canSend) return;
    setError(null);
    setIsLoading(true);
    try {
      const rec = recipient.trim();
      const isEVM = isEvmAddress(rec);
      const isSOL = isSolanaAddress(rec);
      if (!isEVM && !isSOL) {
        setError("Invalid address. Use 0x... for EVM or base58 for Solana.");
        return;
      }
      if (selected.chainId === 101 && !isSOL) {
        setError("Solana asset must be sent to a Solana address.");
        return;
      }
      if (selected.chainId !== 101 && !isEVM) {
        setError("EVM asset must be sent to an EVM (0x...) address.");
        return;
      }

      const uaChainId = CHAIN_ID_MAP[selected.chainId] ?? selected.chainId;
      const tokenAddr =
        selected.address || "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

      const tx = await universalAccount.createTransferTransaction({
        token: { chainId: uaChainId, address: tokenAddr },
        amount: amount,
        receiver: rec,
      });

      const signature = await signUATransaction(tx.rootHash);
      const result = await universalAccount.sendTransaction(tx, signature);
      setTxResult({ txId: result.transactionId });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTxResult(null);
    setRecipient("");
    setAmount("");
    setSelectedOption("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const detectedType = recipient.trim()
    ? isEvmAddress(recipient.trim())
      ? "EVM"
      : isSolanaAddress(recipient.trim())
        ? "Solana"
        : null
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Send</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.description}>
              Transfer UA primary assets to another EVM or Solana wallet.
            </Text>

            {txResult ? (
              <View style={styles.resultSection}>
                <View style={styles.successBox}>
                  <Feather name="check-circle" size={32} color="#4ade80" />
                  <Text style={styles.successText}>Transfer sent!</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://universalx.app/activity/details?id=${txResult.txId}`
                      )
                    }
                  >
                    <Text style={styles.linkText}>View transaction</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={resetForm}
                >
                  <Text style={styles.secondaryButtonText}>Send another</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Token & Chain Selection */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Token & Network</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowTokenPicker(!showTokenPicker)}
                  >
                    {selected ? (
                      <View style={styles.selectorContent}>
                        {getTokenIcon(selected.symbol) && (
                          <Image
                            source={{ uri: getTokenIcon(selected.symbol) }}
                            style={styles.selectorIcon}
                          />
                        )}
                        <Text style={styles.selectorText}>
                          {selected.symbol} on{" "}
                          {CHAIN_ID_TO_NAME[selected.chainId] ||
                            `Chain ${selected.chainId}`}
                        </Text>
                        <Text style={styles.selectorBalance}>
                          {selected.balance.toFixed(4)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.selectorPlaceholder}>
                        Select token and chain
                      </Text>
                    )}
                    <Feather name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>

                  {showTokenPicker && (
                    <View style={styles.dropdownList}>
                      <ScrollView
                        style={styles.dropdownScroll}
                        nestedScrollEnabled
                      >
                        {transferOptions.map((o) => (
                          <TouchableOpacity
                            key={o.key}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedOption(o.key);
                              setShowTokenPicker(false);
                            }}
                          >
                            <View style={styles.dropdownItemLeft}>
                              {getTokenIcon(o.symbol) ? (
                                <Image
                                  source={{ uri: getTokenIcon(o.symbol) }}
                                  style={styles.dropdownItemIcon}
                                />
                              ) : (
                                <View style={styles.dropdownItemIconFallback}>
                                  <Text style={{ color: "#fff", fontSize: 10 }}>
                                    {o.symbol[0]}
                                  </Text>
                                </View>
                              )}
                              <View>
                                <Text style={styles.dropdownItemText}>
                                  {o.symbol}
                                </Text>
                                <Text style={styles.dropdownItemChain}>
                                  {CHAIN_ID_TO_NAME[o.chainId] ||
                                    `Chain ${o.chainId}`}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.dropdownItemBalance}>
                              {o.balance.toFixed(4)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {transferOptions.length === 0 && (
                          <Text style={styles.dropdownEmpty}>
                            No assets available
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Recipient */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Recipient Address</Text>
                  <TextInput
                    style={styles.input}
                    value={recipient}
                    onChangeText={setRecipient}
                    placeholder="0x... (EVM) or base58 (Solana)"
                    placeholderTextColor="#6b7280"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {detectedType && (
                    <Text style={styles.detectedText}>
                      Detected: {detectedType} address
                    </Text>
                  )}
                </View>

                {/* Amount */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={styles.amountRow}>
                    <TextInput
                      style={[styles.input, styles.amountInput]}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.00"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                    />
                    {selected && (
                      <TouchableOpacity
                        style={styles.maxButton}
                        onPress={() => setAmount(selected.balance.toString())}
                      >
                        <Text style={styles.maxButtonText}>MAX</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {selected && (
                    <Text style={styles.balanceHint}>
                      Available: {selected.balance.toFixed(4)} {selected.symbol}
                    </Text>
                  )}
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!canSend || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!canSend || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 10, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  description: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Error
  errorBox: {
    backgroundColor: "rgba(127, 29, 29, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },

  // Success
  resultSection: {
    gap: 16,
  },
  successBox: {
    backgroundColor: "rgba(20, 83, 45, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.5)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  successText: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    color: "#c084fc",
    fontSize: 14,
    textDecorationLine: "underline",
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: "#374151",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },

  // Fields
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 6,
  },

  // Selector
  selector: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  selectorIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectorText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  selectorBalance: {
    color: "#9ca3af",
    fontSize: 13,
  },
  selectorPlaceholder: {
    color: "#6b7280",
    fontSize: 14,
  },

  // Dropdown
  dropdownList: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  dropdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dropdownItemIconFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownItemChain: {
    color: "#6b7280",
    fontSize: 11,
  },
  dropdownItemBalance: {
    color: "#9ca3af",
    fontSize: 13,
  },
  dropdownEmpty: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },

  // Input
  input: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 15,
  },
  detectedText: {
    color: "#4ade80",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },

  // Amount
  amountRow: {
    flexDirection: "row",
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  maxButton: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  maxButtonText: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "600",
  },
  balanceHint: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },

  // Send button
  sendButton: {
    backgroundColor: "#9333ea",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
