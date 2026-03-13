import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useUniversalAccount } from "../context/UniversalAccountContext";

type TxData = Record<string, any>;

const PAGE_SIZE = 20;

interface ActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

const CHAIN_META: Record<number, { name: string; logo: string; explorer: string }> = {
  1: { name: "Ethereum", logo: "https://static.particle.network/token-list/ethereum/native.png", explorer: "https://etherscan.io/tx/" },
  10: { name: "Optimism", logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png", explorer: "https://optimistic.etherscan.io/tx/" },
  137: { name: "Polygon", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", explorer: "https://polygonscan.com/tx/" },
  8453: { name: "Base", logo: "https://cryptologos.cc/logos/base-base-logo.png", explorer: "https://basescan.org/tx/" },
  42161: { name: "Arbitrum", logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.png", explorer: "https://arbiscan.io/tx/" },
  2013: { name: "Settlement", logo: "https://static.particle.network/token-list/ethereum/native.png", explorer: "https://universalx.app/activity/details?id=" },
};

function getChainMeta(chainId: number | undefined) {
  return CHAIN_META[chainId || 0] || {
    name: `Chain ${chainId || "-"}`,
    logo: "https://static.particle.network/token-list/ethereum/native.png",
    explorer: "https://etherscan.io/tx/",
  };
}

function shortenHash(hash: string | undefined) {
  if (!hash || hash.length < 12) return hash || "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function formatDate(dateInput: string | number | undefined): string {
  if (!dateInput) return "";
  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput > 1e12 ? dateInput : dateInput * 1000);
  } else {
    date = new Date(dateInput);
  }
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatFullDate(dateInput: string | number | undefined): string {
  if (!dateInput) return "";
  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput > 1e12 ? dateInput : dateInput * 1000);
  } else {
    date = new Date(dateInput);
  }
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function formatHexUsd(value: string | number | undefined): string {
  if (value === undefined || value === null) return "0.00";
  try {
    const n =
      typeof value === "string" && value.startsWith("0x")
        ? Number(BigInt(value)) / 1e18
        : Number(value);
    if (!Number.isFinite(n)) return "0.00";
    return n.toFixed(4);
  } catch {
    return "0.00";
  }
}

function formatTokenAmount(amount: string | number, decimals: number = 18): string {
  if (!amount) return "0";
  let value: bigint;
  try {
    if (typeof amount === "string" && amount.startsWith("0x")) {
      value = BigInt(amount);
    } else if (typeof amount === "string") {
      if (amount.includes(".")) return parseFloat(amount).toFixed(4);
      value = BigInt(amount);
    } else {
      value = BigInt(Math.floor(amount));
    }
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const remainderStr = remainder.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole}.${remainderStr}`.replace(/\.?0+$/, "") || "0";
  } catch {
    return String(amount);
  }
}

function getTxType(tx: TxData): string {
  const tag = tx.tag || tx.type || tx.txType || tx.action || "";
  if (tag && tag !== "universal") return tag;
  if (tx.tokenChanges) {
    const hasDecr = tx.tokenChanges.decr?.length > 0;
    const hasIncr = tx.tokenChanges.incr?.length > 0;
    if (hasDecr && hasIncr) return "Swap";
    if (hasDecr && !hasIncr) return "Send";
    if (!hasDecr && hasIncr) return "Receive";
  }
  if (tx.transactions?.length > 0 || tx.userOps?.length > 0) return "Contract";
  return "Transaction";
}

function getTxStatus(tx: TxData): string {
  const s = tx.status || tx.state || "";
  if (typeof s === "string" && s.length > 0) {
    const sl = s.toLowerCase();
    if (sl === "failed" || sl === "error" || sl === "reverted") return "Failed";
    if (sl === "pending" || sl === "processing" || sl === "submitted") return "Pending";
    if (sl === "completed" || sl === "success" || sl === "confirmed" || sl === "done") return "Completed";
  }
  if (typeof s === "number") {
    if (s === 0) return "Pending";
    if (s > 0) return "Completed";
    if (s < 0) return "Failed";
  }
  if ((tx.transactionId || tx.id) && (tx.created_at || tx.createdAt || tx.timestamp)) return "Completed";
  if (tx.tokenChanges?.decr?.length > 0 || tx.tokenChanges?.incr?.length > 0) return "Completed";
  return "Pending";
}

function getTxDate(tx: TxData): string | number | undefined {
  return tx.created_at || tx.createdAt || tx.timestamp || tx.time || tx.updated_at;
}

function getTagIcon(txType: string): string {
  const t = txType.toLowerCase();
  if (t.includes("buy") || t.includes("swap")) return "⇄";
  if (t.includes("send") || t.includes("transfer") || t.includes("universal")) return "↑";
  if (t.includes("receive") || t.includes("deposit")) return "↓";
  if (t.includes("convert")) return "🔄";
  return "•";
}

function getStatusColors(status: string): { text: string; bg: string } {
  const s = status.toLowerCase();
  if (s.includes("success") || s.includes("complete")) return { text: "#4ade80", bg: "rgba(74,222,128,0.15)" };
  if (s.includes("pending") || s.includes("process")) return { text: "#facc15", bg: "rgba(250,204,21,0.15)" };
  if (s.includes("fail") || s.includes("error") || s.includes("cancel")) return { text: "#f87171", bg: "rgba(248,113,113,0.15)" };
  return { text: "#9ca3af", bg: "rgba(156,163,175,0.15)" };
}

function getTxAmount(tx: TxData): { amount: string; symbol: string; isNegative: boolean; usdValue?: string } | null {
  if (tx.tokenChanges?.decr?.[0]) {
    const d = tx.tokenChanges.decr[0];
    const decimals = d.token?.decimals || d.token?.realDecimals || 18;
    const symbol = d.token?.symbol || "";
    const rawAmount = d.rawAmount || d.amount;
    const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals) : d.amount || "0";
    return { amount: formattedAmount, symbol, isNegative: true, usdValue: d.amountInUSD ? `$${Number(d.amountInUSD).toFixed(2)}` : undefined };
  }
  if (tx.tokenChanges?.incr?.[0]) {
    const i = tx.tokenChanges.incr[0];
    const decimals = i.token?.decimals || i.token?.realDecimals || 18;
    const symbol = i.token?.symbol || "";
    const rawAmount = i.rawAmount || i.amount;
    const formattedAmount = rawAmount ? formatTokenAmount(rawAmount, decimals) : i.amount || "0";
    return { amount: formattedAmount, symbol, isNegative: false, usdValue: i.amountInUSD ? `$${Number(i.amountInUSD).toFixed(2)}` : undefined };
  }
  if (tx.depositTokens?.[0]) {
    const d = tx.depositTokens[0];
    const decimals = d.token?.decimals || 18;
    return { amount: formatTokenAmount(d.rawAmount || d.amount, decimals), symbol: d.token?.symbol || "", isNegative: true, usdValue: d.amountInUSD ? `$${Number(d.amountInUSD).toFixed(2)}` : undefined };
  }
  if (tx.amount !== undefined) {
    const decimals = tx.decimals || 18;
    return { amount: formatTokenAmount(tx.amount, decimals), symbol: tx.symbol || tx.token || "", isNegative: tx.direction === "out" };
  }
  if (tx.totalDecrAmountInUSD) return { amount: `$${Number(tx.totalDecrAmountInUSD).toFixed(2)}`, symbol: "", isNegative: true };
  if (tx.totalIncrAmountInUSD) return { amount: `$${Number(tx.totalIncrAmountInUSD).toFixed(2)}`, symbol: "", isNegative: false };
  return null;
}

export default function ActivityModal({ visible, onClose }: ActivityModalProps) {
  const { universalAccount } = useUniversalAccount();

  const [transactions, setTransactions] = useState<TxData[]>([]);
  const [selectedTx, setSelectedTx] = useState<TxData | null>(null);
  const [txDetails, setTxDetails] = useState<TxData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (!universalAccount) return;
      if (reset) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await (universalAccount as any).getTransactions(pageNum, PAGE_SIZE);
        const txList = result?.transactions || result?.data || result || [];

        if (reset) {
          setTransactions(txList);
        } else {
          setTransactions((prev) => {
            const merged = [...prev, ...txList];
            const seen = new Set<string>();
            return merged.filter((tx: TxData, idx: number) => {
              const key = String(tx.transactionId || tx.id || tx.transaction_id || tx.hash || idx);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          });
        }
        setHasMore(txList.length === PAGE_SIZE);
        setPage(pageNum);
      } catch (err) {
        console.error("[Activity] Failed to fetch transactions:", err);
        setError("Failed to load transactions");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [universalAccount]
  );

  useEffect(() => {
    if (visible && universalAccount && !selectedTx) {
      fetchTransactions(1, true);
    }
  }, [visible, universalAccount, selectedTx, fetchTransactions]);

  useEffect(() => {
    if (!visible || !universalAccount || selectedTx) return;
    const interval = setInterval(() => fetchTransactions(1, true), 15000);
    return () => clearInterval(interval);
  }, [visible, universalAccount, selectedTx, fetchTransactions]);

  const fetchTxDetails = async (txId: string) => {
    if (!universalAccount) return;
    setIsLoadingDetails(true);
    try {
      const details = await (universalAccount as any).getTransaction(txId);
      setTxDetails(details);
    } catch (err) {
      console.error("[Activity] Failed to fetch tx details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleTxClick = (tx: TxData) => {
    setSelectedTx(tx);
    const txId = tx.transactionId || tx.id || tx.transaction_id;
    if (txId) fetchTxDetails(txId);
  };

  const handleBack = () => {
    setSelectedTx(null);
    setTxDetails(null);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) fetchTransactions(page + 1, false);
  };

  const openExplorer = (txId: string) => {
    const url = `https://universalx.app/activity/details?id=${txId}`;
    Linking.openURL(url).catch(() => {});
  };

  // --- Detail View ---
  if (selectedTx) {
    const details = txDetails || selectedTx;
    const txType = getTxType(details);
    const status = getTxStatus(details);
    const txId = details.transactionId || details.id || details.transaction_id || "";
    const statusColors = getStatusColors(status);
    const amountData = getTxAmount(details);

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            {/* Back */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <Feather name="chevron-left" size={20} color="#9ca3af" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
              {isLoadingDetails ? (
                <View style={styles.loadingCenter}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              ) : (
                <>
                  {/* Header */}
                  <View style={styles.detailHeader}>
                    <View style={styles.txIconLarge}>
                      <Text style={styles.txIconLargeText}>{getTagIcon(txType)}</Text>
                    </View>
                    <View>
                      <Text style={styles.detailTxType}>{txType}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>{status}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount */}
                  {amountData && (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>Amount</Text>
                      <Text style={[styles.detailAmount, { color: amountData.isNegative ? "#f87171" : "#4ade80" }]}>
                        {amountData.isNegative ? "-" : "+"}{amountData.amount} {amountData.symbol}
                      </Text>
                      {amountData.usdValue && <Text style={styles.detailCardSubtext}>≈ {amountData.usdValue}</Text>}
                    </View>
                  )}

                  {/* Info Grid */}
                  <View style={styles.detailCard}>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{txType}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={styles.infoValue}>{status}</Text>
                      </View>
                      {getTxDate(details) ? (
                        <>
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Time</Text>
                            <Text style={styles.infoValue}>{formatFullDate(getTxDate(details))}</Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Fee (USD)</Text>
                            <Text style={styles.infoValue}>${formatHexUsd(details.fees?.totals?.feeTokenAmountInUSD || details.totalFeeInUSD)}</Text>
                          </View>
                        </>
                      ) : null}
                    </View>
                  </View>

                  {/* Balance Changes */}
                  {(details.tokenChanges?.decr?.length || details.tokenChanges?.incr?.length) ? (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardTitle}>Balance Change</Text>
                      {(details.tokenChanges?.decr || []).map((d: any, i: number) => (
                        <View key={`decr-${i}`} style={styles.balanceChangeRow}>
                          <View style={styles.balanceChangeLeft}>
                            {d.token?.image ? <Image source={{ uri: d.token.image }} style={styles.tokenMiniIcon} /> : null}
                            <Text style={styles.tokenSymbol}>{d.token?.symbol || "Token"}</Text>
                          </View>
                          <View style={styles.balanceChangeRight}>
                            <Text style={styles.balanceDecr}>- {formatTokenAmount(d.amount || d.rawAmount || "0", d.token?.realDecimals || 6)}</Text>
                            {d.amountInUSD ? <Text style={styles.balanceUsd}>${formatHexUsd(d.amountInUSD)}</Text> : null}
                          </View>
                        </View>
                      ))}
                      {(details.tokenChanges?.incr || []).map((inc: any, i: number) => (
                        <View key={`incr-${i}`} style={styles.balanceChangeRow}>
                          <View style={styles.balanceChangeLeft}>
                            {inc.token?.image ? <Image source={{ uri: inc.token.image }} style={styles.tokenMiniIcon} /> : null}
                            <Text style={styles.tokenSymbol}>{inc.token?.symbol || "Token"}</Text>
                          </View>
                          <View style={styles.balanceChangeRight}>
                            <Text style={styles.balanceIncr}>+ {formatTokenAmount(inc.amount || inc.rawAmount || "0", inc.token?.realDecimals || 6)}</Text>
                            {inc.amountInUSD ? <Text style={styles.balanceUsd}>${formatHexUsd(inc.amountInUSD)}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Tx ID / From / To */}
                  <View style={styles.detailCard}>
                    {txId ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tx ID</Text>
                        <Text style={styles.infoValueMono}>{shortenHash(txId)}</Text>
                      </View>
                    ) : null}
                    {details.sender ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>From</Text>
                        <Text style={styles.infoValueMono}>{shortenHash(details.sender)}</Text>
                      </View>
                    ) : null}
                    {details.receiver ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>To</Text>
                        <Text style={styles.infoValueMono}>{shortenHash(details.receiver)}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Execution Ops */}
                  {(details.depositUserOperations?.length || details.lendingUserOperations?.length || details.settlementUserOperations?.length) ? (
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardTitle}>Execution</Text>
                      {([
                        { label: "Deposit", ops: details.depositUserOperations || [] },
                        { label: "Lending", ops: details.lendingUserOperations || [] },
                        { label: "Settlement", ops: details.settlementUserOperations || [] },
                      ] as Array<{ label: string; ops: Array<{ chainId?: number; txHash?: string; status?: number }> }>).map((group) =>
                        group.ops.length ? (
                          <View key={group.label} style={styles.opsGroup}>
                            <Text style={styles.opsGroupLabel}>{group.label}</Text>
                            {group.ops.map((op, i) => {
                              const chain = getChainMeta(op.chainId);
                              const ok = op.status === 3 || op.status === 7;
                              return (
                                <View key={`${group.label}-${i}`} style={styles.opsRow}>
                                  <View style={styles.opsRowLeft}>
                                    <Image source={{ uri: chain.logo }} style={styles.chainMiniIcon} />
                                    <Text style={styles.chainName}>{chain.name}</Text>
                                    <View style={[styles.opsStatusBadge, { backgroundColor: ok ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.15)" }]}>
                                      <Text style={{ fontSize: 10, color: ok ? "#86efac" : "#fde047" }}>{op.status ?? "-"}</Text>
                                    </View>
                                  </View>
                                  {op.txHash ? (
                                    <TouchableOpacity onPress={() => Linking.openURL(`${chain.explorer}${op.txHash}`).catch(() => {})}>
                                      <Text style={styles.explorerLink}>{shortenHash(op.txHash)}</Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <Text style={styles.infoLabel}>-</Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        ) : null
                      )}
                    </View>
                  ) : null}

                  {/* Explorer link */}
                  {txId ? (
                    <TouchableOpacity style={styles.explorerBtn} onPress={() => openExplorer(txId)}>
                      <Feather name="external-link" size={16} color="#f97316" />
                      <Text style={styles.explorerBtnText}>View on UniversalX</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ height: 40 }} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // --- List View ---
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Activity</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => fetchTransactions(1, true)}
                disabled={isLoading || isRefreshing}
                style={styles.refreshBtn}
              >
                <Text style={[styles.refreshText, (isLoading || isRefreshing) && { opacity: 0.5 }]}>
                  {isRefreshing ? "Refreshing…" : "Refresh"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.listBody} showsVerticalScrollIndicator={false}>
            {isLoading && transactions.length === 0 ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : (
              <>
                {transactions.map((tx, idx) => {
                  const txType = getTxType(tx);
                  const status = getTxStatus(tx);
                  const dateStr = formatDate(getTxDate(tx));
                  const amount = getTxAmount(tx);
                  const statusColors = getStatusColors(status);

                  return (
                    <TouchableOpacity
                      key={tx.transactionId || tx.id || idx}
                      style={styles.txRow}
                      onPress={() => handleTxClick(tx)}
                    >
                      <View style={styles.txIcon}>
                        <Text style={styles.txIconText}>{getTagIcon(txType)}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <View style={styles.txInfoTop}>
                          <Text style={styles.txType}>{txType}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>{status}</Text>
                          </View>
                        </View>
                        {amount && (
                          <Text style={[styles.txAmount, { color: amount.isNegative ? "#f87171" : "#4ade80" }]}>
                            {amount.isNegative ? "-" : "+"}{amount.amount} {amount.symbol}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.txDate}>{dateStr}</Text>
                    </TouchableOpacity>
                  );
                })}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={loadMore}
                    disabled={isLoading}
                  >
                    <Text style={styles.loadMoreText}>
                      {isLoading ? "Loading..." : "Load more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <View style={{ height: 40 }} />
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
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshText: {
    color: "#d1d5db",
    fontSize: 13,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#9ca3af",
    fontSize: 15,
  },
  listBody: {
    padding: 16,
  },
  detailBody: {
    padding: 16,
  },
  loadingCenter: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    color: "#6b7280",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: "#f87171",
    textAlign: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: "#4b5563",
    textAlign: "center",
    paddingVertical: 48,
    fontSize: 15,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  txIconText: {
    fontSize: 18,
    color: "#fff",
  },
  txInfo: {
    flex: 1,
  },
  txInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txType: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    textTransform: "capitalize",
  },
  txAmount: {
    fontSize: 13,
    marginTop: 2,
  },
  txDate: {
    color: "#6b7280",
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#f97316",
    fontSize: 15,
    fontWeight: "600",
  },
  // Detail styles
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  txIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  txIconLargeText: {
    fontSize: 24,
  },
  detailTxType: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  detailCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  detailCardLabel: {
    color: "#9ca3af",
    fontSize: 13,
    marginBottom: 4,
  },
  detailCardTitle: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  detailCardSubtext: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
  },
  detailAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  infoValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  infoValueMono: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "monospace",
  },
  balanceChangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  balanceChangeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceChangeRight: {
    alignItems: "flex-end",
  },
  tokenMiniIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tokenSymbol: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  balanceDecr: {
    color: "#f87171",
    fontSize: 14,
  },
  balanceIncr: {
    color: "#4ade80",
    fontSize: 14,
  },
  balanceUsd: {
    color: "#9ca3af",
    fontSize: 11,
  },
  opsGroup: {
    marginBottom: 12,
  },
  opsGroupLabel: {
    color: "#9ca3af",
    fontSize: 11,
    marginBottom: 6,
  },
  opsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  opsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opsStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chainMiniIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  chainName: {
    color: "#e5e7eb",
    fontSize: 13,
  },
  explorerLink: {
    color: "#f97316",
    fontFamily: "monospace",
    fontSize: 13,
  },
  explorerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "rgba(249,115,22,0.1)",
    borderRadius: 12,
    marginTop: 4,
  },
  explorerBtnText: {
    color: "#f97316",
    fontSize: 15,
    fontWeight: "600",
  },
});
