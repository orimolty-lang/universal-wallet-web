import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import * as particleBase from "@particle-network/rn-base";
import * as particleConnect from "@particle-network/rn-connect";
import { Arbitrum } from "@particle-network/chains";
import { Env } from "@particle-network/rn-base";
import { UniversalAccountProvider } from "../context/UniversalAccountContext";

export default function RootLayout() {
  useEffect(() => {
    const extra = Constants.expoConfig?.extra;

    particleBase.init(Arbitrum, Env.Production);

    particleConnect.init(Arbitrum, Env.Production, {
      name: "Universal Wallet",
      icon: "https://connect.particle.network/icons/512.png",
      url: "https://particle.network",
      description: "Universal Wallet powered by Particle Network",
    });

    if (extra?.walletConnectProjectId) {
      particleConnect.setWalletConnectProjectId(
        extra.walletConnectProjectId
      );
    }
  }, []);

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
