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
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";
import { supportedChains } from "../lib/chains";
import { dummyTokens } from "../lib/tokens";
import { formatAmount, formatUSD } from "../lib/utils";

interface AssetBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  assets: IAssetsResponse | null;
}

type TabType = "by-asset" | "by-chain";

const getChainName = (chainId: number): string => {
  const chain = supportedChains.find((c) => Number(c.chainId) === chainId);
  return chain ? chain.name : `Chain ${chainId}`;
};

const getChainIcon = (chainId: number): string | undefined => {
  const chain = supportedChains.find((c) => Number(c.chainId) === chainId);
  return chain?.icon;
};

const getTokenInfo = (tokenType: string) => {
  const token = dummyTokens.find((t) => t.id === tokenType.toLowerCase());
  return {
    name: token?.name || tokenType.toUpperCase(),
    symbol: token?.symbol || tokenType.toUpperCase(),
    icon: token?.icon || "",
  };
};

export default function AssetBreakdownModal({
  visible,
  onClose,
  assets,
}: AssetBreakdownModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("by-asset");
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [expandedChain, setExpandedChain] = useState<number | null>(null);

  if (!assets) return null;

  const chainMap: Record<
    number,
    {
      chainId: number;
      totalValue: number;
      assets: Array<{
        tokenType: string;
        amount: number;
        amountInUSD: number;
      }>;
    }
  > = {};

  assets.assets.forEach((asset) => {
    asset.chainAggregation.forEach((chain) => {
      if (chain.amount > 0) {
        if (!chainMap[chain.token.chainId]) {
          chainMap[chain.token.chainId] = {
            chainId: chain.token.chainId,
            totalValue: 0,
            assets: [],
          };
        }
        chainMap[chain.token.chainId].assets.push({
          tokenType: asset.tokenType,
          amount: chain.amount,
          amountInUSD: chain.amountInUSD,
        });
        chainMap[chain.token.chainId].totalValue += chain.amountInUSD;
      }
    });
  });

  const sortedChains = Object.values(chainMap).sort(
    (a, b) => b.totalValue - a.totalValue
  );

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
            <Text style={styles.headerTitle}>Asset Breakdown</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Total */}
          <Text style={styles.totalBalance}>
            Total Balance: {formatUSD(assets.totalAmountInUSD)}
          </Text>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "by-asset" && styles.tabActive]}
              onPress={() => setActiveTab("by-asset")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "by-asset" && styles.tabTextActive,
                ]}
              >
                By Asset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "by-chain" && styles.tabActive]}
              onPress={() => setActiveTab("by-chain")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "by-chain" && styles.tabTextActive,
                ]}
              >
                By Chain
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {activeTab === "by-asset" && (
              <View style={styles.listContainer}>
                {assets.assets
                  .filter((asset) => asset.amount > 0)
                  .map((asset) => {
                    const tokenInfo = getTokenInfo(asset.tokenType);
                    const isExpanded = expandedAsset === asset.tokenType;

                    return (
                      <View key={asset.tokenType} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={styles.cardLeft}>
                            {tokenInfo.icon ? (
                              <Image
                                source={{ uri: tokenInfo.icon }}
                                style={styles.tokenIcon}
                              />
                            ) : (
                              <View style={styles.tokenIconFallback}>
                                <Text style={styles.tokenIconFallbackText}>
                                  {asset.tokenType.substring(0, 1)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.cardTitle}>
                              {tokenInfo.name}
                            </Text>
                          </View>
                          <View style={styles.cardRight}>
                            <Text style={styles.cardAmount}>
                              {formatAmount(asset.amount)}{" "}
                              {asset.tokenType.toUpperCase()}
                            </Text>
                            <Text style={styles.cardUSD}>
                              {formatUSD(asset.amountInUSD)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={() =>
                            setExpandedAsset(isExpanded ? null : asset.tokenType)
                          }
                        >
                          <Text style={styles.expandButtonText}>
                            Chain Distribution
                          </Text>
                          <Feather
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            {asset.chainAggregation
                              .filter((chain) => chain.amount > 0)
                              .map((chain) => (
                                <View
                                  key={`${asset.tokenType}-${chain.token.chainId}`}
                                  style={styles.chainRow}
                                >
                                  <View style={styles.chainRowLeft}>
                                    {getChainIcon(chain.token.chainId) ? (
                                      <Image
                                        source={{
                                          uri: getChainIcon(chain.token.chainId),
                                        }}
                                        style={styles.chainRowIcon}
                                      />
                                    ) : (
                                      <View style={styles.chainRowIconFallback}>
                                        <Text style={{ color: "#fff", fontSize: 10 }}>
                                          {chain.token.chainId
                                            .toString()
                                            .substring(0, 1)}
                                        </Text>
                                      </View>
                                    )}
                                    <Text style={styles.chainRowName}>
                                      {getChainName(chain.token.chainId)}
                                    </Text>
                                  </View>
                                  <View style={styles.chainRowRight}>
                                    <Text style={styles.chainRowAmount}>
                                      {formatAmount(chain.amount)}
                                    </Text>
                                    <Text style={styles.chainRowUSD}>
                                      {formatUSD(chain.amountInUSD)}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            )}

            {activeTab === "by-chain" && (
              <View style={styles.listContainer}>
                {sortedChains.length > 0 ? (
                  sortedChains.map((chain) => {
                    const isExpanded = expandedChain === chain.chainId;

                    return (
                      <View key={chain.chainId} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={styles.cardLeft}>
                            {getChainIcon(chain.chainId) ? (
                              <Image
                                source={{ uri: getChainIcon(chain.chainId) }}
                                style={styles.tokenIcon}
                              />
                            ) : (
                              <View style={styles.tokenIconFallback}>
                                <Text style={styles.tokenIconFallbackText}>
                                  {chain.chainId.toString().substring(0, 1)}
                                </Text>
                              </View>
                            )}
                            <Text style={styles.cardTitle}>
                              {getChainName(chain.chainId)}
                            </Text>
                          </View>
                          <Text style={styles.cardAmount}>
                            {formatUSD(chain.totalValue)}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={() =>
                            setExpandedChain(isExpanded ? null : chain.chainId)
                          }
                        >
                          <Text style={styles.expandButtonText}>Assets</Text>
                          <Feather
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            {chain.assets.map((asset) => {
                              const tokenInfo = getTokenInfo(asset.tokenType);
                              return (
                                <View
                                  key={`${chain.chainId}-${asset.tokenType}`}
                                  style={styles.chainRow}
                                >
                                  <View style={styles.chainRowLeft}>
                                    {tokenInfo.icon ? (
                                      <Image
                                        source={{ uri: tokenInfo.icon }}
                                        style={styles.chainRowIcon}
                                      />
                                    ) : (
                                      <View style={styles.chainRowIconFallback}>
                                        <Text style={{ color: "#fff", fontSize: 10 }}>
                                          {asset.tokenType.substring(0, 1)}
                                        </Text>
                                      </View>
                                    )}
                                    <Text style={styles.chainRowName}>
                                      {tokenInfo.symbol}
                                    </Text>
                                  </View>
                                  <View style={styles.chainRowRight}>
                                    <Text style={styles.chainRowAmount}>
                                      {formatAmount(asset.amount)}
                                    </Text>
                                    <Text style={styles.chainRowUSD}>
                                      {formatUSD(asset.amountInUSD)}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>
                    No assets found on any chain
                  </Text>
                )}
              </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#C084FC",
  },
  totalBalance: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e5e7eb",
    textAlign: "center",
    paddingVertical: 12,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#3A3A5A",
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  body: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#2A2A4A",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4A4A6A",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e5e7eb",
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
  },
  cardUSD: {
    fontSize: 14,
    color: "#9ca3af",
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tokenIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3A3A5A",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenIconFallbackText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3A3A5A",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
  },
  expandedContent: {
    marginTop: 8,
    gap: 6,
  },
  chainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  chainRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chainRowRight: {
    alignItems: "flex-end",
  },
  chainRowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chainRowIconFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7A7A8C",
    alignItems: "center",
    justifyContent: "center",
  },
  chainRowName: {
    fontSize: 14,
    color: "#d1d5db",
  },
  chainRowAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#e5e7eb",
  },
  chainRowUSD: {
    fontSize: 12,
    color: "#9ca3af",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 32,
  },
});
