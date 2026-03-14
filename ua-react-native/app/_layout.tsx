import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { getParticleBase, getParticleChains, getParticleConnect } from "../lib/particleSafe";

export default function RootLayout() {
  useEffect(() => {
    try {
      const particleBase = getParticleBase();
      const particleConnect = getParticleConnect();
      const chains = getParticleChains();
      const extra = Constants.expoConfig?.extra;

      if (!particleBase || !particleConnect || !chains) return;

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
    } catch (e) {
      console.error("Particle init failed:", e);
    }
  }, []);

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

