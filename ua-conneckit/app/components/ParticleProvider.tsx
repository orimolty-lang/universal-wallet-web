"use client";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { arbitrum } from "@particle-network/connectkit/chains";
// Removed evmWalletConnectors - external wallets don't support 7702 mode
import { wallet, EntryPosition } from "@particle-network/connectkit/wallet";
import React from "react";
import { useWalletVisibility } from "../context/WalletVisibilityContext";

// Retrieved from https://dashboard.particle.network
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_APP_ID as string;

if (!projectId || !clientKey || !appId) {
  throw new Error("Please configure the Particle project in .env first!");
}

// Export ConnectKitProvider - Social logins ONLY for 7702 mode support
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
      collapseWalletList: true, // Hide wallet list since we only have social logins
      hideContinueButton: true,
      connectorsOrder: ["social", "email", "phone"], // Removed "wallet" - only social logins
      language: "en-US",
      mode: "dark",
      logo: "https://orimolty-lang.github.io/universal-wallet-web/omni-logo.png",
    },
    walletConnectors: [
      // ONLY social logins - required for 7702 mode to work
      authWalletConnectors({
        // Apple first (works in WebViews), Google last (blocked in WebViews)
        authTypes: [
          "apple",
          "twitter",
          "email",
          "phone",
          "discord",
          "github",
          "google", // Google OAuth blocked in WebViews - put last
        ],
        fiatCoin: "USD",
        promptSettingConfig: {
          // 0 = Never ask, 1 = Ask once, 2 = Ask always, 3 = Force
          promptMasterPasswordSettingWhenLogin: 1,
          promptPaymentPasswordSettingWhenSign: 0, // Don't prompt for payment password (enables blind signing)
        },
      }),
      // NO evmWalletConnectors - external wallets don't support 7702 authorization
    ],
    plugins: [
      wallet({
        entryPosition: EntryPosition.BR,
        visible: isWalletVisible,
      }),
    ],
    chains: [arbitrum],
  });

  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
