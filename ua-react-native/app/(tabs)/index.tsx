import React, { useState, useCallback } from "react";
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
import { formatAddress, formatUSD } from "../../lib/utils";
import * as Clipboard from "expo-clipboard";

export default function HomeScreen() {
  const router = useRouter();
  const {
    accountInfo,
    primaryAssets,
    combinedAssets,
    fetchAssets,
    isLoading,
    profile,
  } = useUniversalAccount();
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  }, [fetchAssets]);

  const handleCopy = async (addr: string) => {
    await Clipboard.setStringAsync(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDisconnect = async () => {
    try {
      const accounts = await particleConnect.getAccounts(WalletType.AuthCore);
      if (accounts.length > 0) {
        await particleConnect.disconnect(
          WalletType.AuthCore,
          accounts[0].publicAddress
        );
      }
      router.replace("/login");
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OMNI</Text>
        <TouchableOpacity onPress={handleDisconnect}>
          <Feather name="log-out" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
          />
        }
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Universal Balance</Text>
          <Text style={styles.balanceAmount}>
            ${primaryAssets?.totalAmountInUSD?.toFixed(2) ?? "0.00"}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="arrow-down-left" size={22} color="#f97316" />
            <Text style={styles.actionLabel}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="send" size={22} color="#f97316" />
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>
        </View>

        {accountInfo && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Your Addresses</Text>
            <View style={styles.addressCard}>
              <View>
                <Text style={styles.addressLabel}>EVM Universal Account</Text>
                <Text style={styles.addressText}>
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
                      ? "#22c55e"
                      : "#71717a"
                  }
                />
              </TouchableOpacity>
            </View>
            <View style={styles.addressCard}>
              <View>
                <Text style={[styles.addressLabel, { color: "#22c55e" }]}>
                  Solana Universal Account
                </Text>
                <Text style={styles.addressText}>
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
                      ? "#22c55e"
                      : "#71717a"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {combinedAssets.length > 0 && (
          <View style={styles.assetsSection}>
            <Text style={styles.sectionTitle}>Assets</Text>
            {combinedAssets.slice(0, 15).map((asset, i) => (
              <View key={`${asset.symbol}-${i}`} style={styles.assetRow}>
                <View style={styles.assetIcon}>
                  <Text style={styles.assetIconText}>
                    {asset.symbol?.[0] ?? "?"}
                  </Text>
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetSymbol}>
                    {asset.symbol ?? "Token"}
                  </Text>
                  <Text style={styles.assetName}>{asset.name ?? ""}</Text>
                </View>
                <View style={styles.assetBalances}>
                  <Text style={styles.assetBalance}>
                    {asset.balance != null
                      ? parseFloat(String(asset.balance)).toFixed(4)
                      : "0"}
                  </Text>
                  <Text style={styles.assetUsd}>
                    {formatUSD(asset.amountInUSD ?? 0)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f97316",
    letterSpacing: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  balanceLabel: {
    fontSize: 13,
    color: "#71717a",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#ffffff",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  actionLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  addressSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  sectionTitle: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressCard: {
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressLabel: {
    fontSize: 12,
    color: "#f97316",
    marginBottom: 4,
  },
  addressText: {
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: 14,
  },
  copyButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#27272a",
  },
  assetsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 8,
  },
  assetRow: {
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    flexDirection: "row",
    alignItems: "center",
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  assetIconText: {
    fontSize: 16,
    color: "#d4d4d8",
    fontWeight: "600",
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  assetName: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 2,
  },
  assetBalances: {
    alignItems: "flex-end",
  },
  assetBalance: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "500",
  },
  assetUsd: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 2,
  },
});
