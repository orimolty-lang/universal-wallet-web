import React, { useState } from "react";
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
import { supportedChains } from "../lib/chains";
import { formatAddress, copyToClipboard } from "../lib/deposit";

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  evmAddress: string;
  solanaAddress: string;
}

const AddressBlock = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value, (success) => {
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    });
  };

  return (
    <View style={styles.addressBlock}>
      <View style={styles.addressBlockInfo}>
        <Text style={styles.addressBlockLabel}>{label}:</Text>
        <Text style={styles.addressBlockValue}>{formatAddress(value)}</Text>
      </View>
      <TouchableOpacity onPress={handleCopy} style={styles.addressCopyBtn}>
        <Feather
          name={copied ? "check" : "copy"}
          size={16}
          color={copied ? "#4ade80" : "#C084FC"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function DepositModal({
  visible,
  onClose,
  evmAddress,
  solanaAddress,
}: DepositModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Feather name="arrow-down" size={16} color="#ffffff" />
              </View>
              <Text style={styles.headerTitle}>Deposit Assets</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {/* Supported Networks */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="globe" size={16} color="#C084FC" />
                <Text style={styles.sectionLabel}>Supported Networks</Text>
              </View>
              <Text style={styles.sectionHint}>
                Use the EVM UA for EVM assets or Solana UA for Solana assets.
              </Text>
              <View style={styles.chainGrid}>
                {supportedChains.map((chain) => (
                  <View key={chain.name} style={styles.chainItem}>
                    <Image
                      source={{ uri: chain.icon }}
                      style={styles.chainIcon}
                    />
                    <Text style={styles.chainName}>{chain.name}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.depositNote}>
                Deposit <Text style={styles.bold}>USDC, USDT, ETH, BNB, SOL, BTC</Text> to your universal account.
              </Text>
              <Text style={styles.depositNote}>
                After depositing, you can use your universal account to interact with the app.
              </Text>
            </View>

            {/* Addresses */}
            <View style={styles.addressesSection}>
              <AddressBlock label="EVM UA" value={evmAddress} />
              <AddressBlock label="Solana UA" value={solanaAddress} />
            </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9333ea",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C084FC",
  },
  body: {
    padding: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
  },
  sectionHint: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
  },
  chainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  chainItem: {
    alignItems: "center",
    width: 56,
  },
  chainIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chainName: {
    fontSize: 9,
    color: "#d1d5db",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 12,
  },
  depositNote: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
    paddingVertical: 4,
  },
  bold: {
    fontWeight: "bold",
    color: "#d1d5db",
  },
  addressesSection: {
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  addressBlock: {
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressBlockInfo: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  addressBlockLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  addressBlockValue: {
    fontSize: 14,
    color: "#e5e7eb",
  },
  addressCopyBtn: {
    padding: 8,
  },
});
