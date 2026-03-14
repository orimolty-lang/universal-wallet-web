import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Constants from "expo-constants";
import {
  isParticleAvailable,
  getParticleBase,
  getParticleConnect,
  getParticleChains,
} from "../lib/particleSafe";
// import { UniversalAccountProvider } from "../context/UniversalAccountContext";

export default function RootLayout() {
  const [initStatus, setInitStatus] = useState<string>("starting");
  const [initError, setInitError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setInitStatus("checking native modules...");

      if (!isParticleAvailable) {
        setInitError(
          "Particle native modules not found. The SDK pods may not be linked. " +
          "Ensure @particle-network/rn-base and @particle-network/rn-connect " +
          "are installed and pods are linked."
        );
        setReady(true);
        return;
      }

      setInitStatus("loading SDK...");
      const particleBase = getParticleBase();
      const particleConnect = getParticleConnect();
      const chains = getParticleChains();

      if (!particleBase || !particleConnect || !chains) {
        setInitError("Failed to load Particle SDK modules");
        setReady(true);
        return;
      }

      setInitStatus("initializing...");
      const extra = Constants.expoConfig?.extra;

      particleBase.init(chains.ArbitrumOne, particleBase.Env.Production);

      particleConnect.init(chains.ArbitrumOne, particleBase.Env.Production, {
        name: "OMNI Wallet",
        icon: "https://connect.particle.network/icons/512.png",
        url: "https://particle.network",
        description: "OMNI - Universal Wallet powered by Particle Network",
      });

      if (extra?.walletConnectProjectId) {
        particleConnect.setWalletConnectProjectId(extra.walletConnectProjectId);
      }

      setInitStatus("ready");
      setReady(true);
    } catch (err) {
      const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      setInitError(msg);
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <View style={s.center}>
        <StatusBar style="light" />
        <Text style={s.loadingText}>Loading... ({initStatus})</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={s.center}>
        <StatusBar style="light" />
        <Text style={s.errorTitle}>Startup Error</Text>
        <ScrollView style={s.errorScroll}>
          <Text style={s.errorText}>{initError}</Text>
        </ScrollView>
        <Text style={s.hint}>
          Check that Particle SDK pods are installed.{"\n"}
          Rebuild with: npx expo prebuild --clean
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { color: "#9ca3af", fontSize: 14 },
  errorTitle: { color: "#f87171", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  errorScroll: { maxHeight: 300, width: "100%" },
  errorText: { color: "#d1d5db", fontSize: 13, fontFamily: "monospace", lineHeight: 20 },
  hint: { color: "#6b7280", fontSize: 12, textAlign: "center", marginTop: 20 },
});
