import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ITransactionHistory } from "../types/transaction-history";

interface TxHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: ITransactionHistory[];
  onTransactionClick: (transactionId: string) => void;
}

export default function TxHistoryModal({
  visible,
  onClose,
  transactions,
  onTransactionClick,
}: TxHistoryModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {transactions?.length > 0 ? (
              transactions.map((tx) => {
                const amount = tx.change?.amount || "0";
                const amountInUSD = tx.change?.amountInUSD || "0.00";
                const isNegative = amount.startsWith("-");

                return (
                  <TouchableOpacity
                    key={tx.transactionId}
                    style={styles.txCard}
                    onPress={() => onTransactionClick(tx.transactionId)}
                  >
                    <View style={styles.txLeft}>
                      {tx.targetToken?.image && (
                        <Image
                          source={{ uri: tx.targetToken.image }}
                          style={styles.txIcon}
                        />
                      )}
                      <View>
                        <Text style={styles.txTag}>{tx.tag}</Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isNegative ? "#ef4444" : "#22c55e" },
                        ]}
                      >
                        {amount} {tx.targetToken?.symbol || ""}
                      </Text>
                      <Text style={styles.txUSD}>{amountInUSD} USD</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No transactions found.</Text>
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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1F1F3A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#4A4A6A",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A6A",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#C084FC",
  },
  body: {
    padding: 16,
  },
  txCard: {
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4A4A6A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  txTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  txDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  txUSD: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 32,
  },
});
