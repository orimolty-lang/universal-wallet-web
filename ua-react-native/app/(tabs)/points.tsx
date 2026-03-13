import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function PointsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="star" size={28} color="#f97316" />
          <Text style={styles.heading}>Points</Text>
        </View>

        {/* Star icon */}
        <View style={styles.iconContainer}>
          <View style={styles.starCircle}>
            <Feather name="star" size={48} color="#f97316" />
          </View>
        </View>

        {/* Coming Soon */}
        <Text style={styles.comingSoon}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Rewards are on the way
        </Text>

        {/* Placeholder Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="gift" size={20} color="#f97316" />
            <Text style={styles.cardTitle}>Earn Rewards</Text>
          </View>
          <Text style={styles.cardDescription}>
            Earn points for every transaction, swap, and interaction across all
            supported chains. Points will be redeemable for exclusive rewards,
            fee discounts, and governance power.
          </Text>
          <View style={styles.cardDivider} />
          <View style={styles.featureList}>
            {[
              { icon: "zap" as const, text: "Points for every transaction" },
              { icon: "repeat" as const, text: "Bonus for cross-chain swaps" },
              { icon: "users" as const, text: "Referral multipliers" },
              { icon: "award" as const, text: "Tiered reward levels" },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.featureRow}>
                <Feather name={icon} size={16} color="#f97316" />
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 20,
  },
  starCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f9731618",
    borderWidth: 2,
    borderColor: "#f9731640",
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoon: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  cardDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 22,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#27272a",
    marginVertical: 16,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    color: "#d4d4d8",
    fontSize: 14,
  },
});
