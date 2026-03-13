import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as particleConnect from "@particle-network/rn-connect";
import { WalletType } from "@particle-network/rn-connect";
import { useUniversalAccount } from "../../context/UniversalAccountContext";
import { formatAddress } from "../../lib/utils";
import * as Clipboard from "expo-clipboard";
import DepositModal from "../../components/DepositModal";
import AssetBreakdownModal from "../../components/AssetBreakdownModal";

export default function HomeScreen() {
  const router = useRouter();
  const {
    accountInfo,
    primaryAssets,
    address,
    fetchAssets,
  } = useUniversalAccount();

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCopy = async (addr: string) => {
    await Clipboard.setStringAsync(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleLogout = async () => {
    try {
      if (address) {
        await particleConnect.disconnect(WalletType.AuthCore, address);
      }
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace("/login");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🍊</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9333ea"
          />
        }
      >
        {/* Balance Card */}
        <TouchableOpacity
          style={styles.balanceCard}
          onPress={() => setShowAssetBreakdown(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.balanceLabel}>Universal Balance</Text>
          <Text style={styles.balanceAmount}>
            ${primaryAssets?.totalAmountInUSD.toFixed(2) || "0.00"}
          </Text>
          <Text style={styles.balanceHint}>Tap to view breakdown</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowDepositModal(true)}
          >
            <Feather name="arrow-down" size={24} color="#c084fc" />
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Feather name="send" size={24} color="#c084fc" />
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Account Addresses */}
        {accountInfo && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Your Addresses</Text>

            {/* EVM UA */}
            <View style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>🌐 EVM Universal Account</Text>
                <Text style={styles.addressValue}>
                  {formatAddress(accountInfo.evmSmartAccount)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy(accountInfo.evmSmartAccount)}
              >
                <Feather
                  name={
                    copiedAddress === accountInfo.evmSmartAccount
                      ? "check"
                      : "copy"
                  }
                  size={16}
                  color={
                    copiedAddress === accountInfo.evmSmartAccount
                      ? "#4ade80"
                      : "#9ca3af"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Solana UA */}
            <View style={styles.addressCard}>
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: "#4ade80" }]}>
                  ☀️ Solana Universal Account
                </Text>
                <Text style={styles.addressValue}>
                  {formatAddress(accountInfo.solanaSmartAccount)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy(accountInfo.solanaSmartAccount)}
              >
                <Feather
                  name={
                    copiedAddress === accountInfo.solanaSmartAccount
                      ? "check"
                      : "copy"
                  }
                  size={16}
                  color={
                    copiedAddress === accountInfo.solanaSmartAccount
                      ? "#4ade80"
                      : "#9ca3af"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Assets List */}
        {primaryAssets &&
          primaryAssets.assets &&
          primaryAssets.assets.length > 0 && (
            <View style={styles.assetsSection}>
              <Text style={styles.sectionTitle}>Assets</Text>
              {primaryAssets.assets.slice(0, 5).map((asset, i) => (
                <View key={i} style={styles.assetCard}>
                  <View style={styles.assetLeft}>
                    <View style={styles.assetIcon}>
                      <Text style={styles.assetIconText}>
                        {asset.symbol === "USDC"
                          ? "💵"
                          : asset.symbol === "ETH"
                          ? "⟠"
                          : "🪙"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.assetSymbol}>
                        {asset.symbol || "Token"}
                      </Text>
                      <Text style={styles.assetName}>{asset.name || ""}</Text>
                    </View>
                  </View>
                  <View style={styles.assetRight}>
                    <Text style={styles.assetBalance}>
                      {asset.balance
                        ? parseFloat(String(asset.balance)).toFixed(4)
                        : "0"}
                    </Text>
                    <Text style={styles.assetUSD}>
                      ${asset.amountInUSD?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
      </ScrollView>

      {/* Modals */}
      {accountInfo && (
        <DepositModal
          visible={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          evmAddress={accountInfo.evmSmartAccount}
          solanaAddress={accountInfo.solanaSmartAccount}
        />
      )}

      <AssetBreakdownModal
        visible={showAssetBreakdown}
        onClose={() => setShowAssetBreakdown(false)}
        assets={primaryAssets}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#18181b",
  },
  headerEmoji: {
    fontSize: 24,
  },
  logoutText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#7c3aed",
    overflow: "hidden",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#ddd6fe",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  balanceHint: {
    fontSize: 12,
    color: "#c4b5fd",
  },
  actionRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 14,
  },
  addressSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
  },
  addressCard: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: "#c084fc",
    marginBottom: 4,
  },
  addressValue: {
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: 14,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#27272a",
  },
  assetsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 8,
  },
  assetCard: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  assetIconText: {
    fontSize: 18,
  },
  assetSymbol: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 16,
  },
  assetName: {
    color: "#6b7280",
    fontSize: 14,
  },
  assetRight: {
    alignItems: "flex-end",
  },
  assetBalance: {
    color: "#ffffff",
    fontSize: 16,
  },
  assetUSD: {
    color: "#6b7280",
    fontSize: 14,
  },
});
