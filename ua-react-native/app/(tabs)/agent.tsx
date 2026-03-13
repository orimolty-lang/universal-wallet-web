import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AgentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="robot" size={64} color="#a855f7" />
        <Text style={styles.title}>AI Agent</Text>
        <Text style={styles.subtitle}>Your personal crypto assistant</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Try asking:</Text>
          <View style={styles.suggestions}>
            <View style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>
                &quot;Swap 10 USDC to ETH&quot;
              </Text>
            </View>
            <View style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>
                &quot;Send 5 SOL to vitalik.eth&quot;
              </Text>
            </View>
            <View style={styles.suggestionItem}>
              <Text style={styles.suggestionText}>
                &quot;What&apos;s my total balance?&quot;
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardLabel: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 12,
  },
  suggestions: {
    gap: 8,
  },
  suggestionItem: {
    backgroundColor: "#27272a",
    borderRadius: 8,
    padding: 12,
  },
  suggestionText: {
    color: "#d1d5db",
    fontSize: 14,
  },
});
