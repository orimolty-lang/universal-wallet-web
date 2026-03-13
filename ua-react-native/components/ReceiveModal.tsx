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
import * as Clipboard from "expo-clipboard";
import { supportedChains } from "../lib/chains";
import { dummyTokens } from "../lib/tokens";

interface ReceiveModalProps {
  visible: boolean;
  onClose: () => void;
  evmAddress: string;
  solanaAddress: string;
}

const SUPPORTED_TOKENS = ["USDC", "USDT", "ETH", "BNB", "SOL", "BTC"];

const RECEIVE_CHAINS = [
  "Solana",
  "Ethereum",
  "Base",
  "BNB Chain",
  "Arbitrum",
  "Polygon",
  "Optimism",
  "Avalanche",
];

function truncateAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getTokenIcon(symbol: string): string | undefined {
  return dummyTokens.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  )?.icon;
}

function getAddressForChain(
  chainName: string,
  evmAddress: string,
  solanaAddress: string
): string {
  return chainName === "Solana" ? solanaAddress : evmAddress;
}

export default function ReceiveModal({
  visible,
  onClose,
  evmAddress,
  solanaAddress,
}: ReceiveModalProps) {
  const [copiedChain, setCopiedChain] = useState<string | null>(null);

  const handleCopy = async (address: string, chainName: string) => {
    try {
      await Clipboard.setStringAsync(address);
      setCopiedChain(chainName);
      setTimeout(() => setCopiedChain(null), 2000);
    } catch {
      // silently fail
    }
  };

  const chains = RECEIVE_CHAINS.map((name) => {
    const chain = supportedChains.find((c) => c.name === name);
    return {
      name,
      icon: chain?.icon,
      address: getAddressForChain(name, evmAddress, solanaAddress),
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Receive</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            <Text style={styles.description}>
              Deposit any token on supported networks. You may use the following
              tokens for trading/gas:
            </Text>

            {/* Supported Tokens */}
            <View style={styles.tokensRow}>
              {SUPPORTED_TOKENS.map((sym) => (
                <View key={sym} style={styles.tokenBadge}>
                  {getTokenIcon(sym) ? (
                    <Image
                      source={{ uri: getTokenIcon(sym) }}
                      style={styles.tokenBadgeIcon}
                    />
                  ) : (
                    <View style={styles.tokenBadgeIconFallback}>
                      <Text style={styles.tokenBadgeIconFallbackText}>
                        {sym[0]}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.tokenBadgeText}>{sym}</Text>
                </View>
              ))}
            </View>

            {/* Supported Chains Grid */}
            <Text style={styles.sectionLabel}>SUPPORTED CHAINS</Text>
            <View style={styles.chainGrid}>
              {chains.map((chain) => (
                <View key={chain.name} style={styles.chainGridItem}>
                  {chain.icon ? (
                    <Image
                      source={{ uri: chain.icon }}
                      style={styles.chainGridIcon}
                    />
                  ) : (
                    <View style={styles.chainGridIconFallback}>
                      <Text style={styles.chainGridIconFallbackText}>
                        {chain.name[0]}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.chainGridName}>{chain.name}</Text>
                </View>
              ))}
            </View>

            {/* Addresses */}
            <Text style={styles.sectionLabel}>YOUR RECEIVE ADDRESSES</Text>
            <View style={styles.addressList}>
              {chains.map((chain) => (
                <View key={chain.name} style={styles.addressRow}>
                  <View style={styles.addressRowLeft}>
                    {chain.icon ? (
                      <Image
                        source={{ uri: chain.icon }}
                        style={styles.addressChainIcon}
                      />
                    ) : (
                      <View style={styles.addressChainIconFallback}>
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          {chain.name[0]}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.addressChainName}>{chain.name}</Text>
                  </View>
                  <View style={styles.addressRowRight}>
                    <Text style={styles.addressText}>
                      {truncateAddress(chain.address)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopy(chain.address, chain.name)}
                      style={styles.copyButton}
                    >
                      <Feather
                        name={copiedChain === chain.name ? "check" : "copy"}
                        size={16}
                        color={
                          copiedChain === chain.name ? "#4ade80" : "#9ca3af"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
    marginBottom: 12,
  },
  tokensRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#252525",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tokenBadgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tokenBadgeIconFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenBadgeIconFallbackText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  tokenBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  sectionLabel: {
    color: "#6b7280",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  chainGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  chainGridItem: {
    alignItems: "center",
    width: 60,
  },
  chainGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chainGridIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  chainGridIconFallbackText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  chainGridName: {
    color: "#d1d5db",
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  addressList: {
    gap: 8,
    paddingBottom: 32,
  },
  addressRow: {
    backgroundColor: "#252525",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addressChainIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  addressChainIconFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  addressChainName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  addressRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addressText: {
    color: "#9ca3af",
    fontSize: 13,
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 6,
  },
});
