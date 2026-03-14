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
