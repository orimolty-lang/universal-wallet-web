import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Image, RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useUniversalAccount } from "../context/UniversalAccountContext";
import { fetchMorphoVaults, fetchUserPositions, type MorphoVault, type EarnPosition } from "../lib/earnService";

interface EarnModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ViewMode = "vaults" | "positions" | "deposit";

export default function EarnModal({ visible, onClose, onSuccess }: EarnModalProps) {
  const { universalAccount, accountInfo, primaryAssets, signUATransaction } = useUniversalAccount();

  const [viewMode, setViewMode] = useState<ViewMode>("vaults");
  const [vaults, setVaults] = useState<MorphoVault[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVault, setSelectedVault] = useState<MorphoVault | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"apy" | "tvl">("tvl");
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [userPositions, setUserPositions] = useState<EarnPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVaults();
      loadPositions();
    }
  }, [visible]);

  const loadPositions = async () => {
    if (!accountInfo?.evmSmartAccount) return;
    setPositionsLoading(true);
    try {
      const positions = await fetchUserPositions(accountInfo.evmSmartAccount, vaults);
      setUserPositions(positions);
    } catch (err) {
      console.error("Failed to load positions:", err);
    } finally {
      setPositionsLoading(false);
    }
  };

  const loadVaults = async () => {
    setLoading(true);
    try {
      const data = await fetchMorphoVaults();
      setVaults(data);
    } catch (err) {
      console.error("Failed to load vaults:", err);
    } finally {
      setLoading(false);
    }
  };

  const sortedVaults = [...vaults]
    .filter((v) => chainFilter === "all" || v.chain === chainFilter)
    .filter((v) => v.tvl > 0)
    .sort((a, b) => sortBy === "tvl" ? b.tvl - a.tvl : b.apy - a.apy);

  const handleDeposit = async () => {
    if (!universalAccount || !selectedVault || !depositAmount) return;
    setIsDepositing(true);
    setError(null);
    try {
      // Build and execute deposit via UA
      // This uses the Morpho vault's deposit function
      const { encodeFunctionData } = await import("viem");
      const depositData = encodeFunctionData({
        abi: [{ name: "deposit", type: "function", inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable" }],
        functionName: "deposit",
        args: [BigInt(Math.floor(Number(depositAmount) * 1e6)), accountInfo?.evmSmartAccount as `0x${string}`],
      });

      const tx = await universalAccount.createUniversalTransaction({
        chainId: selectedVault.chainId,
        expectTokens: [{ type: "USDC" as any, amount: depositAmount }],
        transactions: [{ to: selectedVault.address, data: depositData }],
      });

      const sig = await signUATransaction(tx.rootHash);
      await universalAccount.sendTransaction(tx, sig);
      onSuccess?.();
      setViewMode("vaults");
      setDepositAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDepositing(false);
    }
  };

  const formatTVL = (tvl: number) => {
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(1)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(0)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            {viewMode !== "vaults" ? (
              <TouchableOpacity onPress={() => setViewMode("vaults")}>
                <Feather name="arrow-left" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 24 }} />
            )}
            <Text style={s.title}>
              {viewMode === "vaults" ? "Earn Yield" : viewMode === "deposit" ? "Deposit" : "Positions"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          {(viewMode === "vaults" || viewMode === "positions") && (
            <View style={s.tabBar}>
              <TouchableOpacity
                style={[s.tab, viewMode === "vaults" && s.tabActive]}
                onPress={() => setViewMode("vaults")}
              >
                <Text style={[s.tabText, viewMode === "vaults" && s.tabTextActive]}>Vaults</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, viewMode === "positions" && s.tabActive]}
                onPress={() => setViewMode("positions")}
              >
                <Text style={[s.tabText, viewMode === "positions" && s.tabTextActive]}>
                  Positions {userPositions.length > 0 ? `(${userPositions.length})` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={s.body}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadVaults(); setRefreshing(false); }} tintColor="#f97316" />
            }
          >
            {viewMode === "vaults" && (
              loading ? (
                <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
              ) : (
                sortedVaults.map((vault) => (
                  <TouchableOpacity
                    key={vault.address}
                    style={s.vaultCard}
                    onPress={() => { setSelectedVault(vault); setViewMode("deposit"); }}
                  >
                    <View style={s.vaultHeader}>
                      <Text style={s.vaultName} numberOfLines={1}>{vault.name}</Text>
                      <Text style={s.vaultApy}>{vault.apy.toFixed(2)}% APY</Text>
                    </View>
                    <View style={s.vaultFooter}>
                      <Text style={s.vaultChain}>{vault.chain}</Text>
                      <Text style={s.vaultTvl}>TVL: {formatTVL(vault.tvl)}</Text>
                    </View>
                    <Text style={s.vaultAsset}>{vault.asset}</Text>
                  </TouchableOpacity>
                ))
              )
            )}

            {viewMode === "positions" && (
              positionsLoading ? (
                <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
              ) : userPositions.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Feather name="inbox" size={40} color="#6b7280" />
                  <Text style={{ color: "#6b7280", marginTop: 12, fontSize: 16 }}>No active positions</Text>
                  <TouchableOpacity onPress={() => setViewMode("vaults")} style={{ marginTop: 16 }}>
                    <Text style={{ color: "#f97316", fontSize: 14 }}>Browse vaults to deposit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                userPositions.map((pos) => (
                  <View key={pos.market.id} style={s.vaultCard}>
                    <View style={s.vaultHeader}>
                      <Text style={s.vaultName} numberOfLines={1}>{pos.market.name}</Text>
                      <Text style={{ color: "#22c55e", fontWeight: "bold", fontSize: 16 }}>
                        {pos.market.apy.toFixed(2)}% APY
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                      <View>
                        <Text style={{ color: "#6b7280", fontSize: 12 }}>Deposited</Text>
                        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                          {pos.assetsApprox.toFixed(4)} {pos.market.assetSymbol}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#6b7280", fontSize: 12 }}>Chain</Text>
                        <Text style={{ color: "#9ca3af", fontSize: 14 }}>{pos.market.chainName}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )
            )}

            {viewMode === "deposit" && selectedVault && (
              <View style={s.depositSection}>
                <View style={s.vaultCard}>
                  <Text style={s.vaultName}>{selectedVault.name}</Text>
                  <Text style={s.vaultApy}>{selectedVault.apy.toFixed(2)}% APY</Text>
                  <Text style={s.vaultChain}>{selectedVault.chain} · {selectedVault.asset}</Text>
                </View>

                <Text style={[s.label, { marginTop: 16 }]}>Deposit Amount ({selectedVault.asset})</Text>
                <TextInput
                  style={s.input}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder="0.00"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                />

                {error && <Text style={s.error}>{error}</Text>}

                <TouchableOpacity
                  style={[s.button, (isDepositing || !depositAmount) && s.buttonDisabled]}
                  onPress={handleDeposit}
                  disabled={isDepositing || !depositAmount}
                >
                  {isDepositing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.buttonText}>Deposit</Text>
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
  content: { backgroundColor: "#1a1a1a", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  title: { fontSize: 20, fontWeight: "600", color: "#fff" },
  tabBar: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, backgroundColor: "#2a2a2a", borderRadius: 8, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#333" },
  tabText: { color: "#9ca3af", fontSize: 14 },
  tabTextActive: { color: "#fff" },
  body: { padding: 16 },
  vaultCard: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: "#333" },
  vaultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vaultName: { fontSize: 16, fontWeight: "600", color: "#fff", flex: 1 },
  vaultApy: { fontSize: 16, fontWeight: "bold", color: "#22c55e" },
  vaultFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  vaultChain: { fontSize: 13, color: "#9ca3af" },
  vaultTvl: { fontSize: 13, color: "#9ca3af" },
  vaultAsset: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  depositSection: { gap: 8 },
  label: { fontSize: 14, color: "#9ca3af", marginBottom: 6 },
  input: { backgroundColor: "#2a2a2a", borderRadius: 12, padding: 14, color: "#fff", fontSize: 18, borderWidth: 1, borderColor: "#333" },
  error: { color: "#f87171", fontSize: 14, marginTop: 8, textAlign: "center" },
  button: { backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 16, marginBottom: 32 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
