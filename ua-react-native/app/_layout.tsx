import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native";
import Constants from "expo-constants";
import * as particleBase from "@particle-network/rn-base";
import * as particleConnect from "@particle-network/rn-connect";
import { ArbitrumOne } from "@particle-network/chains";
import { Env } from "@particle-network/rn-base";
import { UniversalAccountProvider } from "../context/UniversalAccountContext";

export default function RootLayout() {
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const extra = Constants.expoConfig?.extra;

      console.log("[Init] Particle credentials:", {
        projectId: extra?.particleProjectId ? "set" : "MISSING",
        clientKey: extra?.particleClientKey ? "set" : "MISSING",
        appId: extra?.particleAppId ? "set" : "MISSING",
      });

      particleBase.init(ArbitrumOne, Env.Production);

      particleConnect.init(ArbitrumOne, Env.Production, {
        name: "OMNI Wallet",
        icon: "https://connect.particle.network/icons/512.png",
        url: "https://particle.network",
        description: "OMNI - Universal Wallet powered by Particle Network",
      });

      if (extra?.walletConnectProjectId) {
        particleConnect.setWalletConnectProjectId(extra.walletConnectProjectId);
      }

      console.log("[Init] Particle SDK initialized successfully");
      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Init] Particle SDK init failed:", msg);
      setInitError(msg);
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <View style={s.loading}>
        <StatusBar style="light" />
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={s.loading}>
        <StatusBar style="light" />
        <Text style={s.errorTitle}>Init Error</Text>
        <Text style={s.errorText}>{initError}</Text>
      </View>
    );
  }

  return (
    <UniversalAccountProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </UniversalAccountProvider>
  );
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { color: "#fff", fontSize: 16 },
  errorTitle: { color: "#f87171", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  errorText: { color: "#9ca3af", fontSize: 14, textAlign: "center" },
});
