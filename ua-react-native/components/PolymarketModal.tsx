import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Image, RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { encodeFunctionData } from "viem";
import { useUniversalAccount } from "../context/UniversalAccountContext";

interface PolymarketEvent {
  id: string;
  title: string;
  description?: string;
  image?: string;
  endDate?: string;
  volume?: number;
  liquidity?: number;
  outcomes: PolymarketOutcome[];
  category?: string;
}

interface PolymarketOutcome {
  id: string;
  title: string;
  price: number;
  icon?: string;
}

interface PolymarketModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = "markets" | "detail" | "bet";

const POLYMARKET_API = "https://lifi-proxy.orimolty.workers.dev/polymarket";
const CATEGORIES = ["All", "Politics", "Sports", "Crypto", "Science", "Culture"];

export default function PolymarketModal({ visible, onClose, onSuccess }: PolymarketModalProps) {
  const { universalAccount, accountInfo, signUATransaction } = useUniversalAccount();

  const [viewMode, setViewMode] = useState<ViewMode>("markets");
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PolymarketEvent | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<PolymarketOutcome | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) fetchMarkets();
  }, [visible]);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${POLYMARKET_API}/events?limit=50&active=true`);
      if (res.ok) {
        const data = await res.json();
        const parsed: PolymarketEvent[] = (data || []).map((e: any) => ({
          id: e.id || e.condition_id,
          title: e.title || e.question,
          description: e.description,
          image: e.image,
          endDate: e.end_date_iso,
          volume: e.volume || 0,
          liquidity: e.liquidity || 0,
          category: e.category || "Other",
          outcomes: (e.outcomes || []).map((o: any, i: number) => ({
            id: o.id || `${e.id}-${i}`,
            title: o.title || o.value || (i === 0 ? "Yes" : "No"),
            price: o.price || 0.5,
          })),
        }));
        setEvents(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch Polymarket events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events
    .filter((e) => category === "All" || e.category === category)
    .filter((e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePlaceBet = async () => {
    if (!universalAccount || !selectedOutcome || !betAmount || !accountInfo?.evmSmartAccount) return;

    setIsSubmitting(true);
    setError(null);
    setTxResult(null);

    try {
      // Polymarket bets go through their CLOB on Polygon
      // For now, use the UA to send USDC to the Polymarket contract
      Alert.alert(
        "Coming Soon",
        "Direct Polymarket betting via Universal Accounts is being integrated. " +
        "For now, you can view markets and place bets on polymarket.com"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVolume = (v: number) => {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            {viewMode !== "markets" ? (
              <TouchableOpacity onPress={() => { setViewMode("markets"); setSelectedEvent(null); }}>
                <Feather name="arrow-left" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}
            <Text style={s.title}>
              {viewMode === "markets" ? "Polymarket" : selectedEvent?.title ? "Market" : "Place Bet"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {viewMode === "markets" && (
            <View style={s.searchContainer}>
              <Feather name="search" size={16} color="#6b7280" />
              <TextInput
                style={s.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search markets..."
                placeholderTextColor="#6b7280"
              />
            </View>
          )}

          {/* Category Filter */}
          {viewMode === "markets" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryBar}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.categoryChip, category === cat && s.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[s.categoryChipText, category === cat && s.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ScrollView
            style={s.body}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchMarkets(); setRefreshing(false); }} tintColor="#f97316" />
            }
          >
            {/* Market List */}
            {viewMode === "markets" && (
              loading ? (
                <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
              ) : (
                filteredEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={s.eventCard}
                    onPress={() => { setSelectedEvent(event); setViewMode("detail"); }}
                  >
                    <Text style={s.eventTitle} numberOfLines={2}>{event.title}</Text>
                    <View style={s.outcomesRow}>
                      {event.outcomes.slice(0, 2).map((outcome) => (
                        <View key={outcome.id} style={s.outcomeChip}>
                          <Text style={s.outcomeTitle}>{outcome.title}</Text>
                          <Text style={[s.outcomePrice, { color: outcome.price > 0.5 ? "#22c55e" : "#9ca3af" }]}>
                            {(outcome.price * 100).toFixed(0)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                    {event.volume ? (
                      <Text style={s.eventVolume}>Vol: {formatVolume(event.volume)}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))
              )
            )}

            {/* Market Detail */}
            {viewMode === "detail" && selectedEvent && (
              <View style={s.detailSection}>
                {selectedEvent.image && (
                  <Image source={{ uri: selectedEvent.image }} style={s.eventImage} />
                )}
                <Text style={s.detailTitle}>{selectedEvent.title}</Text>
                {selectedEvent.description && (
                  <Text style={s.detailDescription}>{selectedEvent.description}</Text>
                )}

                <Text style={[s.label, { marginTop: 16 }]}>Outcomes</Text>
                {selectedEvent.outcomes.map((outcome) => (
                  <TouchableOpacity
                    key={outcome.id}
                    style={[s.outcomeCard, selectedOutcome?.id === outcome.id && s.outcomeCardSelected]}
                    onPress={() => { setSelectedOutcome(outcome); setViewMode("bet"); }}
                  >
                    <Text style={s.outcomeCardTitle}>{outcome.title}</Text>
                    <View style={s.outcomeCardRight}>
                      <Text style={s.outcomeCardPrice}>
                        {(outcome.price * 100).toFixed(0)}%
                      </Text>
                      <Text style={s.outcomeCardCost}>
                        ${outcome.price.toFixed(2)}/share
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={s.externalLink}
                  onPress={() => Linking.openURL(`https://polymarket.com/event/${selectedEvent.id}`)}
                >
                  <Feather name="external-link" size={14} color="#9ca3af" />
                  <Text style={s.externalLinkText}>View on Polymarket</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bet View */}
            {viewMode === "bet" && selectedOutcome && selectedEvent && (
              <View style={s.betSection}>
                <View style={s.betHeader}>
                  <Text style={s.betQuestion} numberOfLines={2}>{selectedEvent.title}</Text>
                  <Text style={s.betOutcome}>{selectedOutcome.title} at {(selectedOutcome.price * 100).toFixed(0)}%</Text>
                </View>

                <Text style={[s.label, { marginTop: 16 }]}>Amount (USDC)</Text>
                <TextInput
                  style={s.input}
                  value={betAmount}
                  onChangeText={setBetAmount}
                  placeholder="10"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                />

                {betAmount && (
                  <View style={s.betSummary}>
                    <View style={s.betSummaryRow}>
                      <Text style={s.betSummaryLabel}>Shares</Text>
                      <Text style={s.betSummaryValue}>
                        ~{(Number(betAmount) / selectedOutcome.price).toFixed(1)}
                      </Text>
                    </View>
                    <View style={s.betSummaryRow}>
                      <Text style={s.betSummaryLabel}>Potential Payout</Text>
                      <Text style={[s.betSummaryValue, { color: "#22c55e" }]}>
                        ${(Number(betAmount) / selectedOutcome.price).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}

                {error && <Text style={s.error}>{error}</Text>}

                <TouchableOpacity
                  style={[s.betButton, (isSubmitting || !betAmount) && s.buttonDisabled]}
                  onPress={handlePlaceBet}
                  disabled={isSubmitting || !betAmount}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.betButtonText}>Place Bet</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  content: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "95%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  title: { fontSize: 20, fontWeight: "600", color: "#fff" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 12, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 10 },
  categoryBar: { paddingHorizontal: 16, paddingTop: 10, flexGrow: 0 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#2a2a2a", marginRight: 8 },
  categoryChipActive: { backgroundColor: "#f97316" },
  categoryChipText: { color: "#9ca3af", fontSize: 13 },
  categoryChipTextActive: { color: "#fff" },
  body: { padding: 16 },
  eventCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#333" },
  eventTitle: { fontSize: 15, fontWeight: "600", color: "#fff", marginBottom: 8 },
  outcomesRow: { flexDirection: "row", gap: 8 },
  outcomeChip: { flex: 1, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#333", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  outcomeTitle: { fontSize: 13, color: "#d1d5db" },
  outcomePrice: { fontSize: 13, fontWeight: "bold" },
  eventVolume: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  detailSection: { gap: 8 },
  eventImage: { width: "100%", height: 150, borderRadius: 12, marginBottom: 8 },
  detailTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  detailDescription: { fontSize: 14, color: "#9ca3af", lineHeight: 20 },
  label: { fontSize: 14, color: "#9ca3af", marginBottom: 6 },
  outcomeCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: "#333" },
  outcomeCardSelected: { borderColor: "#f97316" },
  outcomeCardTitle: { fontSize: 16, fontWeight: "500", color: "#fff" },
  outcomeCardRight: { alignItems: "flex-end" },
  outcomeCardPrice: { fontSize: 18, fontWeight: "bold", color: "#22c55e" },
  outcomeCardCost: { fontSize: 12, color: "#6b7280" },
  externalLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 8 },
  externalLinkText: { color: "#9ca3af", fontSize: 13 },
  betSection: { gap: 8 },
  betHeader: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14 },
  betQuestion: { fontSize: 14, color: "#9ca3af" },
  betOutcome: { fontSize: 18, fontWeight: "bold", color: "#fff", marginTop: 4 },
  input: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, borderWidth: 1, borderColor: "#333" },
  betSummary: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, gap: 8 },
  betSummaryRow: { flexDirection: "row", justifyContent: "space-between" },
  betSummaryLabel: { fontSize: 13, color: "#9ca3af" },
  betSummaryValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  error: { color: "#f87171", fontSize: 14, textAlign: "center" },
  betButton: { backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 32 },
  buttonDisabled: { opacity: 0.5 },
  betButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
