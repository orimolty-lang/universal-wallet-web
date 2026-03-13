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

interface OpenPosition {
  id: string;
  pairName: string;
  symbol: string;
  pairIndex: number;
  positionIndex: number;
  isLong: boolean;
  collateralUsd: number;
  sizeUsd: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  pnlPercent: number;
  liquidationPrice: number;
  tpPrice: number;
  slPrice: number;
  timestamp: number;
}

interface PerpsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = "markets" | "trade" | "positions";
type TradeDirection = "long" | "short";
type MarketGroup = "crypto" | "forex" | "commodities" | "equity" | "all";

const BASE_RPC = "https://mainnet.base.org";

async function baseRpcCall(method: string, params: unknown[]): Promise<string | null> {
  try {
    const res = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = await res.json();
    return json.result || null;
  } catch { return null; }
}

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
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
  const livePricesRef = useRef<Record<string, number>>({});
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

  // Keep ref in sync for position PnL calculation
  useEffect(() => { livePricesRef.current = livePrices; }, [livePrices]);

  // Fetch open positions from Avantis contract via Base RPC
  const fetchOpenPositions = useCallback(async () => {
    const trader = accountInfo?.evmSmartAccount;
    if (!trader) return;

    setPositionsLoading(true);
    try {
      const positions: OpenPosition[] = [];

      for (const market of PERPS_MARKETS) {
        const countCallData = encodeFunctionData({
          abi: AVANTIS_TRADING_STORAGE_ABI,
          functionName: "openTradesCount",
          args: [trader as `0x${string}`, BigInt(market.index)],
        });
        const countHex = await baseRpcCall("eth_call", [
          { to: AVANTIS_TRADING_STORAGE_ADDRESS, data: countCallData },
          "latest",
        ]);
        const openCount = countHex ? Number(BigInt(countHex)) : 0;
        if (openCount <= 0) continue;

        const scanLimit = Math.min(60, Math.max(20, openCount * 3));
        for (let i = 0; i < scanLimit; i++) {
          const tradeCallData = encodeFunctionData({
            abi: AVANTIS_TRADING_STORAGE_ABI,
            functionName: "openTrades",
            args: [trader as `0x${string}`, BigInt(market.index), BigInt(i)],
          });
          const tradeHex = await baseRpcCall("eth_call", [
            { to: AVANTIS_TRADING_STORAGE_ADDRESS, data: tradeCallData },
            "latest",
          ]);
          if (!tradeHex) continue;

          const trade = decodeFunctionResult({
            abi: AVANTIS_TRADING_STORAGE_ABI,
            functionName: "openTrades",
            data: tradeHex as `0x${string}`,
          }) as any;
          if (!trade || trade.trader?.toLowerCase() === "0x0000000000000000000000000000000000000000") continue;

          const positionIndex = Number(trade.index);
          const leverageNum = Number(trade.leverage) / 1e10;
          const initialCollateral = Number(trade.initialPosToken) / 1e6;
          const rawPosition = Number(trade.positionSizeUSDC) / 1e6;
          const collateralUsd = initialCollateral > 0 ? initialCollateral : leverageNum > 0 ? rawPosition / leverageNum : rawPosition;
          if (collateralUsd <= 0) continue;

          const sizeUsd = collateralUsd * Math.max(leverageNum, 0);
          const entryPrice = Number(trade.openPrice) / 1e10;
          const markPrice = livePricesRef.current[market.pairName] || livePricesRef.current[market.symbol] || entryPrice;
          const pnlUsd = trade.buy
            ? ((markPrice - entryPrice) / Math.max(entryPrice, 1e-9)) * sizeUsd
            : ((entryPrice - markPrice) / Math.max(entryPrice, 1e-9)) * sizeUsd;
          const pnlPercent = collateralUsd > 0 ? (pnlUsd / collateralUsd) * 100 : 0;
          const liqDistance = (entryPrice / Math.max(leverageNum, 1e-9)) * 0.9;
          const liquidationPrice = trade.buy ? entryPrice - liqDistance : entryPrice + liqDistance;

          positions.push({
            id: `${market.index}-${positionIndex}`,
            pairName: market.pairName,
            symbol: market.symbol,
            pairIndex: market.index,
            positionIndex,
            isLong: trade.buy,
            collateralUsd,
            sizeUsd,
            leverage: leverageNum,
            entryPrice,
            markPrice,
            pnlUsd,
            pnlPercent,
            liquidationPrice,
            tpPrice: Number(trade.tp) > 0 ? Number(trade.tp) / 1e10 : 0,
            slPrice: Number(trade.sl) > 0 ? Number(trade.sl) / 1e10 : 0,
            timestamp: Number(trade.timestamp),
          });
          if (positions.filter((p) => p.pairIndex === market.index).length >= openCount) break;
        }
      }

      positions.sort((a, b) => b.timestamp - a.timestamp);
      setOpenPositions(positions);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    } finally {
      setPositionsLoading(false);
    }
  }, [accountInfo?.evmSmartAccount]);

  // Auto-fetch positions on open and every 20s
  useEffect(() => {
    if (!visible || !accountInfo?.evmSmartAccount) return;
    fetchOpenPositions();
    const interval = setInterval(fetchOpenPositions, 20000);
    return () => clearInterval(interval);
  }, [visible, accountInfo?.evmSmartAccount, fetchOpenPositions]);

  // Close position via UA (sends closeTradeMarket to Avantis)
  const handleClosePosition = async (position: OpenPosition) => {
    if (!universalAccount) return;
    setClosingPositionId(position.id);
    setError(null);

    try {
      const collateralToClose = BigInt(Math.max(1, Math.floor(position.collateralUsd * 1e6)));
      const closeCalldata = encodeFunctionData({
        abi: AVANTIS_TRADING_ABI,
        functionName: "closeTradeMarket",
        args: [
          BigInt(position.pairIndex),
          BigInt(position.positionIndex),
          collateralToClose,
        ],
      });

      const tx = await universalAccount.createUniversalTransaction({
        chainId: CHAIN_ID.BASE_MAINNET,
        expectTokens: [],
        transactions: [{ to: AVANTIS_TRADING_ADDRESS, data: closeCalldata }],
      });

      const sig = await signUATransaction(tx.rootHash);
      const result = await universalAccount.sendTransaction(tx, sig);
      setTxResult(`https://universalx.app/activity/details?id=${result.transactionId}`);
      onSuccess?.();
      setTimeout(fetchOpenPositions, 5000);
    } catch (err) {
      setError(`Close failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setClosingPositionId(null);
    }
  };

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
            <View style={{ flexDirection: "row", gap: 8 }}>
              {viewMode === "markets" && (
                <TouchableOpacity onPress={() => setViewMode("positions")} style={s.positionsBtn}>
                  <Feather name="layers" size={16} color="#f97316" />
                  {openPositions.length > 0 && (
                    <View style={s.badge}><Text style={s.badgeText}>{openPositions.length}</Text></View>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
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

            {/* Positions View */}
            {viewMode === "positions" && (
              <View style={{ gap: 8 }}>
                {positionsLoading && openPositions.length === 0 ? (
                  <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
                ) : openPositions.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Feather name="inbox" size={40} color="#6b7280" />
                    <Text style={{ color: "#6b7280", marginTop: 12, fontSize: 16 }}>No open positions</Text>
                  </View>
                ) : (
                  openPositions.map((pos) => (
                    <View key={pos.id} style={s.positionCard}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <View style={[s.dirChip, pos.isLong ? s.longChip : s.shortChip]}>
                            <Text style={s.dirChipText}>{pos.isLong ? "LONG" : "SHORT"}</Text>
                          </View>
                          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>{pos.symbol}/USD</Text>
                          <Text style={{ color: "#9ca3af", fontSize: 13 }}>{pos.leverage.toFixed(0)}x</Text>
                        </View>
                        <Text style={[{ fontWeight: "bold", fontSize: 16 }, pos.pnlUsd >= 0 ? { color: "#22c55e" } : { color: "#ef4444" }]}>
                          {pos.pnlUsd >= 0 ? "+" : ""}${pos.pnlUsd.toFixed(2)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                        <View>
                          <Text style={{ color: "#6b7280", fontSize: 12 }}>Entry</Text>
                          <Text style={{ color: "#d1d5db", fontSize: 14 }}>${pos.entryPrice.toLocaleString()}</Text>
                        </View>
                        <View>
                          <Text style={{ color: "#6b7280", fontSize: 12 }}>Mark</Text>
                          <Text style={{ color: "#d1d5db", fontSize: 14 }}>${pos.markPrice.toLocaleString()}</Text>
                        </View>
                        <View>
                          <Text style={{ color: "#6b7280", fontSize: 12 }}>Size</Text>
                          <Text style={{ color: "#d1d5db", fontSize: 14 }}>${pos.sizeUsd.toFixed(0)}</Text>
                        </View>
                        <View>
                          <Text style={{ color: "#6b7280", fontSize: 12 }}>Liq</Text>
                          <Text style={{ color: "#f87171", fontSize: 14 }}>${pos.liquidationPrice.toFixed(2)}</Text>
                        </View>
                      </View>

                      {(pos.tpPrice > 0 || pos.slPrice > 0) && (
                        <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
                          {pos.tpPrice > 0 && <Text style={{ color: "#22c55e", fontSize: 12 }}>TP: ${pos.tpPrice.toFixed(2)}</Text>}
                          {pos.slPrice > 0 && <Text style={{ color: "#ef4444", fontSize: 12 }}>SL: ${pos.slPrice.toFixed(2)}</Text>}
                        </View>
                      )}

                      <TouchableOpacity
                        style={[s.closeBtn, closingPositionId === pos.id && { opacity: 0.5 }]}
                        onPress={() => handleClosePosition(pos)}
                        disabled={closingPositionId === pos.id}
                      >
                        {closingPositionId === pos.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={s.closeBtnText}>Close Position</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                )}
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
  positionsBtn: { flexDirection: "row", alignItems: "center", gap: 2, padding: 4 },
  badge: { backgroundColor: "#f97316", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  positionCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#333", marginBottom: 6 },
  dirChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  longChip: { backgroundColor: "#166534" },
  shortChip: { backgroundColor: "#7f1d1d" },
  dirChipText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  closeBtn: { backgroundColor: "#ef4444", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 10 },
  closeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
