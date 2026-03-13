import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Feather name="activity" size={64} color="#3f3f46" />
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Your transaction history will appear here
        </Text>
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
  },
});
