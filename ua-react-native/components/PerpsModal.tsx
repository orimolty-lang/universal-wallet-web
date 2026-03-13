import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { encodeFunctionData, decodeFunctionResult } from "viem";
import { toBeHex } from "ethers";
import { CHAIN_ID, SUPPORTED_TOKEN_TYPE } from "@particle-network/universal-account-sdk";
import { useUniversalAccount } from "../context/UniversalAccountContext";
import {
  PERPS_MARKETS, AVANTIS_TRADING_ADDRESS, AVANTIS_TRADING_STORAGE_ADDRESS,
  BASE_USDC_ADDRESS, AVANTIS_TRADING_ABI, AVANTIS_TRADING_STORAGE_ABI,
  ERC20_APPROVE_ABI, ERC20_ALLOWANCE_ABI, AVANTIS_APPROVAL_CAP_USDC,
  AVANTIS_SOCKET_API_URL, type PerpsMarket,
} from "../lib/perpsConfig";

interface PerpsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = "markets" | "trade" | "positions";
type TradeDirection = "long" | "short";
type MarketGroup = "crypto" | "forex" | "commodities" | "equity" | "all";

export default function PerpsModal({ visible, onClose, onSuccess }: PerpsModalProps) {
  const { universalAccount, accountInfo, signUATransaction } = useUniversalAccount();

  const [viewMode, setViewMode] = useState<ViewMode>("markets");
  const [selectedMarket, setSelectedMarket] = useState<PerpsMarket | null>(null);
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [leverage, setLeverage] = useState("10");
  const [positionSize, setPositionSize] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [marketGroup, setMarketGroup] = useState<MarketGroup>("all");
  const wsRef = useRef<WebSocket | null>(null);

  // Live prices from Avantis WebSocket
  useEffect(() => {
    if (!visible) return;

    const ws = new WebSocket(AVANTIS_SOCKET_API_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.prices) {
          const newPrices: Record<string, number> = {};
          Object.entries(data.prices).forEach(([symbol, price]) => {
            newPrices[symbol] = Number(price);
          });
          setLivePrices((prev) => ({ ...prev, ...newPrices }));
        }
      } catch {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [visible]);

  const filteredMarkets = PERPS_MARKETS.filter(
    (m) => marketGroup === "all" || m.group === marketGroup
  );

  const currentPrice = selectedMarket
    ? livePrices[selectedMarket.symbol] || selectedMarket.defaultPrice || 0
    : 0;

  const handleOpenPosition = async () => {
    if (!universalAccount || !selectedMarket || !positionSize || !accountInfo?.evmSmartAccount) return;

    setIsSubmitting(true);
    setError(null);
    setTxResult(null);

    try {
      const leverageNum = Number(leverage);
      const sizeUSDC = Number(positionSize);
      const sizeRaw = BigInt(Math.floor(sizeUSDC * 1e6));
      const isLong = direction === "long";

      // Step 1: Approve USDC
      const allowanceData = encodeFunctionData({
        abi: ERC20_ALLOWANCE_ABI,
        functionName: "allowance",
        args: [accountInfo.evmSmartAccount as `0x${string}`, AVANTIS_TRADING_ADDRESS as `0x${string}`],
      });

      const approveData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: "approve",
        args: [AVANTIS_TRADING_ADDRESS as `0x${string}`, AVANTIS_APPROVAL_CAP_USDC],
      });

      // Step 2: Open trade
      const tpPrice = takeProfit ? BigInt(Math.floor(Number(takeProfit) * 1e10)) : BigInt(0);
      const slPrice = stopLoss ? BigInt(Math.floor(Number(stopLoss) * 1e10)) : BigInt(0);

      const openTradeData = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: "openTrade",
        args: [
          {
            trader: accountInfo.evmSmartAccount as `0x${string}`,
            pairIndex: BigInt(selectedMarket.pairIndex),
            index: BigInt(0),
            initialPosToken: BigInt(0),
            positionSizeUSDC: sizeRaw,
            openPrice: BigInt(Math.floor(currentPrice * 1e10)),
            buy: isLong,
            leverage: BigInt(leverageNum),
            tp: tpPrice,
            sl: slPrice,
          },
          0, // orderType: market
          BigInt(Math.floor(currentPrice * 1e10 * (isLong ? 1.01 : 0.99))), // slippage 1%
          "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // referrer
        ],
      });

      const transactions = [
        { to: BASE_USDC_ADDRESS, data: approveData },
        { to: AVANTIS_TRADING_ADDRESS, data: openTradeData },
      ];

      const tx = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        expectTokens: [{ type: SUPPORTED_TOKEN_TYPE.USDC, amount: positionSize }],
        transactions,
      });

      const sig = await signUATransaction(tx.rootHash);
      const result = await universalAccount.sendTransaction(tx, sig);

      setTxResult(`https://universalx.app/activity/details?id=${result.transactionId}`);
      onSuccess?.();
    } catch (err) {
      console.error("Open position failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            {viewMode !== "markets" ? (
              <TouchableOpacity onPress={() => setViewMode("markets")}>
                <Feather name="arrow-left" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ) : <View style={{ width: 24 }} />}
            <Text style={s.title}>
              {viewMode === "markets" ? "Perpetuals" : viewMode === "trade" ? selectedMarket?.symbol || "Trade" : "Positions"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Market Groups */}
          {viewMode === "markets" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.groupBar}>
              {(["all", "crypto", "forex", "commodities", "equity"] as MarketGroup[]).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[s.groupChip, marketGroup === g && s.groupChipActive]}
                  onPress={() => setMarketGroup(g)}
                >
                  <Text style={[s.groupChipText, marketGroup === g && s.groupChipTextActive]}>
                    {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ScrollView style={s.body}>
            {/* Market List */}
            {viewMode === "markets" && (
              <>
                {filteredMarkets.map((market) => (
                  <TouchableOpacity
                    key={market.pairIndex}
                    style={s.marketCard}
                    onPress={() => { setSelectedMarket(market); setViewMode("trade"); }}
                  >
                    <View style={s.marketLeft}>
                      <Text style={s.marketIcon}>{market.icon}</Text>
                      <View>
                        <Text style={s.marketSymbol}>{market.symbol}/USD</Text>
                        <Text style={s.marketLeverage}>Up to {market.maxLeverage}x</Text>
                      </View>
                    </View>
                    <Text style={s.marketPrice}>
                      ${(livePrices[market.symbol] || market.defaultPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Trade View */}
            {viewMode === "trade" && selectedMarket && (
              <View style={s.tradeSection}>
                {/* Price */}
                <View style={s.priceCard}>
                  <Text style={s.priceLabel}>{selectedMarket.symbol}/USD</Text>
                  <Text style={s.priceValue}>
                    ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Direction Toggle */}
                <View style={s.directionRow}>
                  <TouchableOpacity
                    style={[s.directionBtn, direction === "long" && s.longActive]}
                    onPress={() => setDirection("long")}
                  >
                    <Text style={[s.directionText, direction === "long" && s.directionTextActive]}>Long</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.directionBtn, direction === "short" && s.shortActive]}
                    onPress={() => setDirection("short")}
                  >
                    <Text style={[s.directionText, direction === "short" && s.directionTextActive]}>Short</Text>
                  </TouchableOpacity>
                </View>

                {/* Leverage */}
                <Text style={s.label}>Leverage</Text>
                <View style={s.leverageRow}>
                  {["5", "10", "25", "50", "100"].map((lev) => (
                    <TouchableOpacity
                      key={lev}
                      style={[s.leverageChip, leverage === lev && s.leverageChipActive]}
                      onPress={() => setLeverage(lev)}
                    >
                      <Text style={[s.leverageChipText, leverage === lev && s.leverageChipTextActive]}>{lev}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Position Size */}
                <Text style={[s.label, { marginTop: 16 }]}>Position Size (USDC)</Text>
                <TextInput
                  style={s.input}
                  value={positionSize}
                  onChangeText={setPositionSize}
                  placeholder="100"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                />

                {/* TP/SL */}
                <View style={s.tpslRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.labelSmall}>Take Profit ($)</Text>
                    <TextInput
                      style={s.inputSmall}
                      value={takeProfit}
                      onChangeText={setTakeProfit}
                      placeholder="Optional"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.labelSmall}>Stop Loss ($)</Text>
                    <TextInput
                      style={s.inputSmall}
                      value={stopLoss}
                      onChangeText={setStopLoss}
                      placeholder="Optional"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Summary */}
                {positionSize && (
                  <View style={s.summaryCard}>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Collateral</Text>
                      <Text style={s.summaryValue}>{positionSize} USDC</Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Leverage</Text>
                      <Text style={s.summaryValue}>{leverage}x</Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Size</Text>
                      <Text style={s.summaryValue}>
                        ${(Number(positionSize) * Number(leverage)).toLocaleString()}
                      </Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>Entry Price</Text>
                      <Text style={s.summaryValue}>~${currentPrice.toLocaleString()}</Text>
                    </View>
                  </View>
                )}

                {error && <Text style={s.error}>{error}</Text>}

                {txResult && (
                  <TouchableOpacity onPress={() => import("expo-linking").then(m => m.openURL(txResult))}>
                    <Text style={s.success}>View Transaction</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    s.tradeButton,
                    direction === "long" ? s.longButton : s.shortButton,
                    (isSubmitting || !positionSize) && s.buttonDisabled,
                  ]}
                  onPress={handleOpenPosition}
                  disabled={isSubmitting || !positionSize}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.tradeButtonText}>
                      {direction === "long" ? "Open Long" : "Open Short"} {selectedMarket.symbol}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={s.disclaimer}>
                  Trading perpetuals involves significant risk. Powered by Avantis on Base.
                </Text>
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
  groupBar: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 0 },
  groupChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#2a2a2a", marginRight: 8 },
  groupChipActive: { backgroundColor: "#f97316" },
  groupChipText: { color: "#9ca3af", fontSize: 13 },
  groupChipTextActive: { color: "#fff" },
  body: { padding: 16 },
  marketCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: "#333" },
  marketLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  marketIcon: { fontSize: 24 },
  marketSymbol: { fontSize: 16, fontWeight: "600", color: "#fff" },
  marketLeverage: { fontSize: 12, color: "#6b7280" },
  marketPrice: { fontSize: 16, fontWeight: "600", color: "#fff" },
  tradeSection: { gap: 12 },
  priceCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, alignItems: "center" },
  priceLabel: { fontSize: 14, color: "#9ca3af" },
  priceValue: { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 4 },
  directionRow: { flexDirection: "row", gap: 8 },
  directionBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: "#2a2a2a", borderWidth: 1, borderColor: "#333" },
  longActive: { backgroundColor: "#166534", borderColor: "#22c55e" },
  shortActive: { backgroundColor: "#7f1d1d", borderColor: "#ef4444" },
  directionText: { fontSize: 16, fontWeight: "600", color: "#9ca3af" },
  directionTextActive: { color: "#fff" },
  label: { fontSize: 14, color: "#9ca3af" },
  labelSmall: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  leverageRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  leverageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: "#2a2a2a", borderWidth: 1, borderColor: "#333" },
  leverageChipActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  leverageChipText: { color: "#9ca3af", fontSize: 13 },
  leverageChipTextActive: { color: "#fff" },
  input: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, borderWidth: 1, borderColor: "#333" },
  inputSmall: { backgroundColor: "#2a2a2a", borderRadius: 8, padding: 10, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: "#333" },
  tpslRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  summaryCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, gap: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#9ca3af" },
  summaryValue: { fontSize: 13, color: "#fff", fontWeight: "500" },
  error: { color: "#f87171", fontSize: 14, textAlign: "center" },
  success: { color: "#c084fc", fontSize: 14, textAlign: "center", textDecorationLine: "underline" },
  tradeButton: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  longButton: { backgroundColor: "#22c55e" },
  shortButton: { backgroundColor: "#ef4444" },
  buttonDisabled: { opacity: 0.5 },
  tradeButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disclaimer: { fontSize: 11, color: "#6b7280", textAlign: "center", marginTop: 8, marginBottom: 32 },
});
