export default {
  expo: {
    name: "Universal Wallet",
    slug: "universal-wallet-rn",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "universalwallet",
    userInterfaceStyle: "dark",
    splash: {
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.universalwallet.app",
      deploymentTarget: "14.0",
      infoPlist: {
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
      package: "com.universalwallet.app",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      "./plugins/withParticleNetwork",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "14.0",
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
      particleProjectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
      particleClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "",
      particleAppId: process.env.NEXT_PUBLIC_APP_ID || "",
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      router: {
        origin: false,
      },
    },
  },
};
