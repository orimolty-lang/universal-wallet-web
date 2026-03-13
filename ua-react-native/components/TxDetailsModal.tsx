import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { formatHexAmount } from "../lib/utils";

interface TxDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transactionDetails: any | null;
  isLoading: boolean;
}

export default function TxDetailsModal({
  visible,
  onClose,
  transactionDetails,
  isLoading,
}: TxDetailsModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Loading...</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9333ea" />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (!transactionDetails) return null;

  const tx = transactionDetails;
  const truncate = (s: string) =>
    s ? `${s.substring(0, 10)}...${s.substring(s.length - 8)}` : "";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Transaction ID */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Transaction ID</Text>
              <View style={styles.copyRow}>
                <Text style={styles.monoText}>{tx.transactionId}</Text>
                <TouchableOpacity onPress={() => handleCopy(tx.transactionId)}>
                  <Feather
                    name={copiedText === tx.transactionId ? "check" : "copy"}
                    size={16}
                    color={copiedText === tx.transactionId ? "#4ade80" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status and Type */}
            <View style={styles.row}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Type</Text>
                <Text style={styles.purpleText}>{tx.tag}</Text>
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Status</Text>
                <Text style={styles.greenText}>
                  {tx.status === 7 ? "Completed" : `Status ${tx.status}`}
                </Text>
              </View>
            </View>

            {/* Sender and Receiver */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>From</Text>
              <View style={styles.copyRow}>
                <Text style={[styles.monoText, { flex: 1 }]}>{tx.sender}</Text>
                <TouchableOpacity onPress={() => handleCopy(tx.sender)}>
                  <Feather
                    name={copiedText === tx.sender ? "check" : "copy"}
                    size={16}
                    color={copiedText === tx.sender ? "#4ade80" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardLabel, { marginTop: 12 }]}>To</Text>
              <View style={styles.copyRow}>
                <Text style={[styles.monoText, { flex: 1 }]}>{tx.receiver}</Text>
                <TouchableOpacity onPress={() => handleCopy(tx.receiver)}>
                  <Feather
                    name={copiedText === tx.receiver ? "check" : "copy"}
                    size={16}
                    color={copiedText === tx.receiver ? "#4ade80" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Token Changes */}
            {tx.tokenChanges && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Token Changes</Text>

                {tx.tokenChanges.decr?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.cardLabel}>Sent</Text>
                    {tx.tokenChanges.decr.map((item: any, idx: number) => (
                      <View key={idx} style={styles.tokenChangeRow}>
                        {item.token?.image && (
                          <Image source={{ uri: item.token.image }} style={styles.tokenChangeIcon} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.redText}>
                            -{formatHexAmount(item.amount, item.token.realDecimals)}{" "}
                            {item.token.symbol}
                          </Text>
                          <Text style={styles.smallGray}>
                            ${formatHexAmount(item.amountInUSD, 6)} USD
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {tx.tokenChanges.incr?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.cardLabel}>Received</Text>
                    {tx.tokenChanges.incr.map((item: any, idx: number) => (
                      <View key={idx} style={styles.tokenChangeRow}>
                        {item.token?.image && (
                          <Image source={{ uri: item.token.image }} style={styles.tokenChangeIcon} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.greenText}>
                            +{formatHexAmount(item.amount, item.token.realDecimals)}{" "}
                            {item.token.symbol}
                          </Text>
                          <Text style={styles.smallGray}>
                            ${formatHexAmount(item.amountInUSD, 6)} USD
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* User Operations */}
            {tx.lendingUserOperations?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>User Operations</Text>
                {tx.lendingUserOperations.map((userOp: any, idx: number) => (
                  <View key={idx} style={styles.userOpCard}>
                    <View style={styles.userOpRow}>
                      <Text style={styles.smallGray}>Chain ID</Text>
                      <Text style={styles.monoSmall}>{userOp.chainId}</Text>
                    </View>
                    <View style={styles.userOpRow}>
                      <Text style={styles.smallGray}>Status</Text>
                      <Text style={userOp.status === 3 ? styles.greenText : styles.yellowText}>
                        {userOp.status === 3 ? "Completed" : `Status ${userOp.status}`}
                      </Text>
                    </View>
                    {userOp.txHash && (
                      <View style={styles.userOpRow}>
                        <Text style={styles.smallGray}>Tx Hash</Text>
                        <TouchableOpacity onPress={() => handleCopy(userOp.txHash)}>
                          <Text style={styles.monoSmall}>{truncate(userOp.txHash)}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Fees */}
            {tx.fees && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Fees</Text>
                <View style={styles.feeRow}>
                  <Text style={styles.smallGray}>Gas Fee</Text>
                  <Text style={styles.feeValue}>
                    ${formatHexAmount(tx.fees.totals.gasFeeTokenAmountInUSD, 6)} USD
                  </Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.smallGray}>Service Fee</Text>
                  <Text style={styles.feeValue}>
                    ${formatHexAmount(tx.fees.totals.transactionServiceFeeTokenAmountInUSD, 6)} USD
                  </Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.smallGray}>LP Fee</Text>
                  <Text style={styles.feeValue}>
                    ${formatHexAmount(tx.fees.totals.transactionLPFeeTokenAmountInUSD, 6)} USD
                  </Text>
                </View>
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Fee</Text>
                  <Text style={styles.yellowText}>
                    ${formatHexAmount(tx.fees.totals.feeTokenAmountInUSD, 6)} USD
                  </Text>
                </View>
              </View>
            )}

            {/* Timestamps */}
            <View style={styles.row}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Created At</Text>
                <Text style={styles.dateText}>
                  {new Date(tx.created_at).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>Updated At</Text>
                <Text style={styles.dateText}>
                  {new Date(tx.updated_at).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Explorer Link */}
            <TouchableOpacity
              style={styles.explorerButton}
              onPress={() =>
                Linking.openURL(
                  `https://universalx.app/activity/details?id=${tx.transactionId}`
                )
              }
            >
              <Feather name="external-link" size={16} color="#ffffff" />
              <Text style={styles.explorerButtonText}>
                View on UniversalX Explorer
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1F1F3A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#4A4A6A",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A6A",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#C084FC" },
  loadingContainer: { paddingVertical: 40, alignItems: "center" },
  body: { padding: 16 },
  card: {
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4A4A6A",
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 12 },
  cardLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#d1d5db" },
  copyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monoText: { fontFamily: "monospace", fontSize: 13, color: "#e5e7eb" },
  monoSmall: { fontFamily: "monospace", fontSize: 12, color: "#e5e7eb" },
  purpleText: { fontSize: 14, fontWeight: "600", color: "#c4b5fd" },
  greenText: { fontSize: 14, fontWeight: "600", color: "#4ade80" },
  redText: { fontSize: 14, fontWeight: "600", color: "#f87171" },
  yellowText: { fontSize: 14, fontWeight: "600", color: "#facc15" },
  smallGray: { fontSize: 12, color: "#9ca3af" },
  dateText: { fontSize: 14, color: "#e5e7eb" },
  tokenChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1F1F3A",
    padding: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  tokenChangeIcon: { width: 32, height: 32, borderRadius: 16 },
  userOpCard: {
    backgroundColor: "#1F1F3A",
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  userOpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  feeValue: { fontSize: 14, color: "#e5e7eb" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#4A4A6A",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: { fontSize: 14, fontWeight: "600", color: "#d1d5db" },
  explorerButton: {
    backgroundColor: "#9333ea",
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  explorerButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
