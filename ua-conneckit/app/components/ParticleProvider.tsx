"use client";

import React from "react";
import { AuthCoreContextProvider } from "@particle-network/authkit";
import { base, arbitrum, solana } from "@particle-network/authkit/chains";
import { AuthType } from "@particle-network/auth-core";
import { EntryPosition } from "@particle-network/wallet";
import { useWalletVisibility } from "../context/WalletVisibilityContext";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_APP_ID as string;

if (!projectId || !clientKey || !appId) {
  throw new Error("Please configure the Particle project in .env first!");
}

export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  const { isWalletVisible } = useWalletVisibility();

  return (
    <AuthCoreContextProvider
      options={{
        projectId,
        clientKey,
        appId,
        chains: [base, arbitrum, solana],
        authTypes: [
          AuthType.apple,
          AuthType.twitter,
          AuthType.email,
          AuthType.phone,
          AuthType.discord,
          AuthType.github,
          AuthType.google,
        ],
        themeType: "dark",
        fiatCoin: "USD",
        language: "en",
        erc4337: {
          name: "UNIVERSAL",
          version: "1.0.0",
        },
        promptSettingConfig: {
          promptMasterPasswordSettingWhenLogin: 1,
          promptPaymentPasswordSettingWhenSign: 0,
        },
        wallet: {
          visible: isWalletVisible,
          entryPosition: EntryPosition.BR,
        },
        customStyle: {
          logo: "https://orimolty-lang.github.io/universal-wallet-web/omni-logo.png",
          projectName: "OMNI",
        },
      }}
    >
      {children}
    </AuthCoreContextProvider>
  );
};
