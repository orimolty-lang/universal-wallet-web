import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { getParticleConnect } from "../lib/particleSafe";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setChecking(false);
    }, 5000);

    const checkConnection = async () => {
      try {
        const pc = getParticleConnect();
        if (!pc) {
          setChecking(false);
          return;
        }
        const accounts = await pc.getAccounts("AuthCore");
        setIsConnected(accounts.length > 0);
      } catch {
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
