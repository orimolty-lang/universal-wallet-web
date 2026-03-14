import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import * as particleConnect from "@particle-network/rn-connect";
import { WalletType } from "@particle-network/rn-connect";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("[Auth] Check timed out, redirecting to login");
      setChecking(false);
    }, 5000);

    const checkConnection = async () => {
      try {
        console.log("[Auth] Checking existing connection...");
        const accounts = await particleConnect.getAccounts(WalletType.AuthCore);
        console.log("[Auth] Found accounts:", accounts.length);
        setIsConnected(accounts.length > 0);
      } catch (err) {
        console.log("[Auth] No existing connection:", err);
        setIsConnected(false);
      } finally {
        clearTimeout(timeout);
        setChecking(false);
      }
    };
    checkConnection();

    return () => clearTimeout(timeout);
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  if (isConnected) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
});
