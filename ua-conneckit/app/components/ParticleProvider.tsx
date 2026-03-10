"use client";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { arbitrum } from "@particle-network/connectkit/chains";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";
import { wallet, EntryPosition } from "@particle-network/connectkit/wallet";
import React from "react";
import { useWalletVisibility } from "../context/WalletVisibilityContext";

// Retrieved from https://dashboard.particle.network
// Fallbacks keep static export builds deterministic in cloud agents.
const DEFAULT_PARTICLE_PUBLIC_CONFIG = {
  projectId: "c0cb9e74-192b-4bdc-ba62-852775c6e7fd",
  clientKey: "caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK",
  appId: "e5be9376-1d3a-4882-b4a5-c5c0ce1b5182",
};

const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || DEFAULT_PARTICLE_PUBLIC_CONFIG.projectId;
const clientKey =
  process.env.NEXT_PUBLIC_CLIENT_KEY || DEFAULT_PARTICLE_PUBLIC_CONFIG.clientKey;
const appId = process.env.NEXT_PUBLIC_APP_ID || DEFAULT_PARTICLE_PUBLIC_CONFIG.appId;
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Export ConnectKitProvider to be used within your index or layout file (or use createConfig directly within those files).
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  const { isWalletVisible } = useWalletVisibility();

  const config = createConfig({
    projectId,
    clientKey,
    appId,
    appearance: {
      // NOTE: Apple Sign-in shows "UniversalX" because it's set in Particle dashboard project settings
      // To fix: Go to dashboard.particle.network > Your Project > Settings > App Name > Change to "Omni"
      splitEmailAndPhone: false,
      collapseWalletList: false,
      hideContinueButton: true,
      connectorsOrder: ["social", "wallet", "email", "phone"],
      language: "en-US",
      mode: "dark",
      recommendedWallets: [{ walletId: "metaMask", label: "Popular" }],
      logo: "https://orimolty-lang.github.io/universal-wallet-web/omni-logo.png",
    },
    walletConnectors: [
      authWalletConnectors({
        // Optional, configure this if you're using social logins
        // Apple first (works in WebViews), Google last (blocked in WebViews)
        authTypes: [
          "apple",
          "twitter",
          "email",
          "phone",
          "discord",
          "github",
          "google", // Google OAuth blocked in WebViews - put last
        ], // Optional, restricts the types of social logins supported
        fiatCoin: "USD", // Optional, also supports CNY, JPY, HKD, INR, and KRW
        promptSettingConfig: {
          // Optional, changes the frequency in which the user is asked to set a master or payment password
          // 0 = Never ask
          // 1 = Ask once
          // 2 = Ask always, upon every entry
          // 3 = Force the user to set this password
          promptMasterPasswordSettingWhenLogin: 1,
          promptPaymentPasswordSettingWhenSign: 1,
        },
      }),
      evmWalletConnectors({
        walletConnectProjectId,
        multiInjectedProviderDiscovery: true,
      }),
    ],
    plugins: [
      wallet({
        // Optional configurations for the attached embedded wallet modal
        entryPosition: EntryPosition.BR, // Alters the position in which the modal button appears upon login
        visible: isWalletVisible, // Dictates whether or not the wallet modal is included/visible or not
      }),
    ],
    chains: [arbitrum],
  });

  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
