import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";

interface TokenContract {
  address: string;
  blockchain: string;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  price?: number;
  price_change_24h?: number;
  market_cap?: number;
  contracts?: TokenContract[];
  liquidity?: number;
  volume?: number;
  twitter?: string;
  website?: string;
  totalSupply?: number;
  circulatingSupply?: number;
  description?: string;
}

interface UserBalance {
  amount: number;
  amountInUSD: number;
}

interface TokenDetailModalProps {
  visible: boolean;
  token: TokenData | null;
  userBalance?: UserBalance | null;
  onClose: () => void;
  onSwap?: (token: TokenData) => void;
  onSend?: (token: TokenData) => void;
}

const formatPrice = (price: number): string => {
  if (price === 0) return "$0.00";
  if (price < 0.000001) return `$${price.toFixed(10).replace(/\.?0+$/, "")}`;
  if (price < 0.01) return `$${price.toFixed(8).replace(/\.?0+$/, "")}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 1000) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatMC = (mc: number): string => {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  if (mc >= 1e3) return `$${(mc / 1e3).toFixed(1)}K`;
  return `$${mc.toFixed(0)}`;
};

export default function TokenDetailModal({
  visible, token, userBalance, onClose, onSwap, onSend,
}: TokenDetailModalProps) {
  const [detail, setDetail] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setDetail(null); return; }

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const url = `https://lifi-proxy.orimolty.workers.dev/mobula/api/1/market/data?symbol=${token.symbol}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          const d = json.data;
          setDetail({
            ...token,
            price: d?.price || token.price,
            price_change_24h: d?.price_change_24h || token.price_change_24h,
            market_cap: d?.market_cap || token.market_cap,
            volume: d?.volume || token.volume,
            liquidity: d?.liquidity,
            twitter: d?.twitter,
            website: d?.website,
            totalSupply: d?.total_supply,
            circulatingSupply: d?.circulating_supply,
            description: d?.description,
          });
        } else {
          setDetail(token);
        }
      } catch {
        setDetail(token);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [token]);

  if (!token) return null;
  const d = detail || token;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose}>
              <Feather name="arrow-left" size={24} color="#9ca3af" />
            </TouchableOpacity>
            <Text style={s.title}>{d.symbol}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={s.body}>
            {/* Token Header */}
            <View style={s.tokenHeader}>
              {d.logo ? (
                <Image source={{ uri: d.logo }} style={s.tokenLogo} />
              ) : (
                <View style={[s.tokenLogo, s.tokenLogoFallback]}>
                  <Text style={s.tokenLogoText}>{d.symbol?.[0]}</Text>
                </View>
              )}
              <Text style={s.tokenName}>{d.name}</Text>
              <Text style={s.tokenSymbol}>{d.symbol}</Text>
            </View>

            {/* Price */}
            <View style={s.priceSection}>
              <Text style={s.price}>
                {d.price ? formatPrice(d.price) : "—"}
              </Text>
              {d.price_change_24h != null && (
                <Text style={[s.change, d.price_change_24h >= 0 ? s.changeUp : s.changeDown]}>
                  {d.price_change_24h >= 0 ? "+" : ""}
                  {d.price_change_24h.toFixed(2)}% (24h)
                </Text>
              )}
            </View>

            {/* User Balance */}
            {userBalance && userBalance.amount > 0 && (
              <View style={s.balanceCard}>
                <Text style={s.balanceLabel}>Your Balance</Text>
                <Text style={s.balanceAmount}>
                  {userBalance.amount.toFixed(4)} {d.symbol}
                </Text>
                <Text style={s.balanceUSD}>
                  ${userBalance.amountInUSD.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Price Chart Placeholder */}
            <View style={s.chartPlaceholder}>
              <Feather name="trending-up" size={32} color="#6b7280" />
              <Text style={s.chartPlaceholderText}>Price chart available in web version</Text>
            </View>

            {/* Market Data */}
            <View style={s.statsGrid}>
              {d.market_cap ? (
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Market Cap</Text>
                  <Text style={s.statValue}>{formatMC(d.market_cap)}</Text>
                </View>
              ) : null}
              {d.volume ? (
                <View style={s.statItem}>
                  <Text style={s.statLabel}>24h Volume</Text>
                  <Text style={s.statValue}>{formatMC(d.volume)}</Text>
                </View>
              ) : null}
              {d.liquidity ? (
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Liquidity</Text>
                  <Text style={s.statValue}>{formatMC(d.liquidity)}</Text>
                </View>
              ) : null}
              {d.circulatingSupply ? (
                <View style={s.statItem}>
                  <Text style={s.statLabel}>Circulating Supply</Text>
                  <Text style={s.statValue}>{formatMC(d.circulatingSupply)}</Text>
                </View>
              ) : null}
            </View>

            {/* Contracts */}
            {d.contracts && d.contracts.length > 0 && (
              <View style={s.contractsSection}>
                <Text style={s.contractsTitle}>Contracts</Text>
                {d.contracts.map((c, i) => (
                  <View key={i} style={s.contractRow}>
                    <Text style={s.contractChain}>{c.blockchain}</Text>
                    <Text style={s.contractAddr} numberOfLines={1}>
                      {c.address.slice(0, 8)}...{c.address.slice(-6)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Links */}
            <View style={s.linksRow}>
              {d.website && (
                <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(d.website!)}>
                  <Feather name="globe" size={16} color="#9ca3af" />
                  <Text style={s.linkText}>Website</Text>
                </TouchableOpacity>
              )}
              {d.twitter && (
                <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(`https://twitter.com/${d.twitter}`)}>
                  <Feather name="twitter" size={16} color="#9ca3af" />
                  <Text style={s.linkText}>Twitter</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Description */}
            {d.description && (
              <View style={s.descSection}>
                <Text style={s.descTitle}>About</Text>
                <Text style={s.descText} numberOfLines={6}>{d.description}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={s.actionRow}>
            {onSwap && (
              <TouchableOpacity style={s.actionBtn} onPress={() => onSwap(d)}>
                <Feather name="repeat" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Swap</Text>
              </TouchableOpacity>
            )}
            {onSend && (
              <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={() => onSend(d)}>
                <Feather name="send" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Send</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  content: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "95%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  title: { fontSize: 18, fontWeight: "600", color: "#fff" },
  body: { padding: 16 },
  tokenHeader: { alignItems: "center", marginBottom: 16 },
  tokenLogo: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  tokenLogoFallback: { backgroundColor: "#333", alignItems: "center", justifyContent: "center" },
  tokenLogoText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  tokenName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  tokenSymbol: { fontSize: 14, color: "#9ca3af" },
  priceSection: { alignItems: "center", marginBottom: 20 },
  price: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  change: { fontSize: 16, marginTop: 4 },
  changeUp: { color: "#22c55e" },
  changeDown: { color: "#ef4444" },
  balanceCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" },
  balanceLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  balanceAmount: { fontSize: 18, fontWeight: "600", color: "#fff" },
  balanceUSD: { fontSize: 14, color: "#9ca3af" },
  chartPlaceholder: { height: 120, backgroundColor: "#2a2a2a", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  chartPlaceholderText: { color: "#6b7280", fontSize: 12, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statItem: { backgroundColor: "#2a2a2a", borderRadius: 8, padding: 12, width: "48%" as any },
  statLabel: { fontSize: 12, color: "#9ca3af" },
  statValue: { fontSize: 16, fontWeight: "600", color: "#fff", marginTop: 2 },
  contractsSection: { marginBottom: 16 },
  contractsTitle: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 8 },
  contractRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  contractChain: { fontSize: 13, color: "#9ca3af", textTransform: "capitalize" },
  contractAddr: { fontSize: 13, color: "#6b7280", fontFamily: "monospace", flex: 1, textAlign: "right" },
  linksRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2a2a2a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  linkText: { color: "#9ca3af", fontSize: 13 },
  descSection: { marginBottom: 24 },
  descTitle: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 6 },
  descText: { fontSize: 13, color: "#9ca3af", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: "#2a2a2a" },
  actionBtn: { flex: 1, backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionBtnSecondary: { backgroundColor: "#333" },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
