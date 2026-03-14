export default {
  expo: {
    name: "OMNI Wallet",
    slug: "omni-wallet-rn",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "omniwallet",
    userInterfaceStyle: "dark",
    splash: {
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.orimolty.omniwallet",
      deploymentTarget: "17.0",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          "metamask",
          "trust",
          "rainbow",
          "imtokenv2",
          "bitkeep",
          "okex",
          "phantom",
          "zerion",
        ],
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
      },
      package: "com.orimolty.omniwallet",
    },
    plugins: [
      "expo-router",
      "./plugins/withParticleNetwork",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "17.0",
            useFrameworks: "static",
          },
          android: {
            minSdkVersion: 23,
            compileSdkVersion: 34,
            targetSdkVersion: 34,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "18f123fb-7394-4394-809a-03183c87823e",
      },
      particleProjectId: process.env.NEXT_PUBLIC_PROJECT_ID || "c0cb9e74-192b-4bdc-ba62-852775c6e7fd",
      particleClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "caswUnSdr9LPg5HEhqAZouZAExKOKZPv791XBxSK",
      particleAppId: process.env.NEXT_PUBLIC_APP_ID || "e5be9376-1d3a-4882-b4a5-c5c0ce1b5182",
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      router: {
        origin: false,
      },
    },
  },
};
