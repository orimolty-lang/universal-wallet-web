import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as particleConnect from "@particle-network/rn-connect";
import { WalletType } from "@particle-network/rn-connect";

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = await particleConnect.getAccounts(WalletType.AuthCore);
        setIsConnected(accounts.length > 0);
      } catch {
        setIsConnected(false);
      } finally {
        setChecking(false);
      }
    };
    checkConnection();
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f97316" />
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
  },
});
