import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as particleConnect from "@particle-network/rn-connect";
import {
  ConnectOption,
  EnableSocialProvider,
  EnableWallet,
  EnableWalletLabel,
} from "@particle-network/rn-connect";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const account = await particleConnect.connectWithConnectKitConfig({
        connectOptions: [
          ConnectOption.Email,
          ConnectOption.Phone,
          ConnectOption.Social,
          ConnectOption.Wallet,
        ],
        socialProviders: [
          EnableSocialProvider.Google,
          EnableSocialProvider.Apple,
          EnableSocialProvider.Twitter,
          EnableSocialProvider.Github,
          EnableSocialProvider.Facebook,
          EnableSocialProvider.Microsoft,
          EnableSocialProvider.Linkedin,
          EnableSocialProvider.Discord,
          EnableSocialProvider.Twitch,
        ],
        walletProviders: [
          {
            enableWallet: EnableWallet.MetaMask,
            label: EnableWalletLabel.Popular,
          },
        ],
        additionalLayoutOptions: {
          isCollapseWalletList: false,
          isSplitEmailAndSocial: false,
          isSplitEmailAndPhone: false,
          isHideContinueButton: true,
        },
      });

      if (account?.publicAddress) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🍊</Text>
      <Text style={styles.title}>UNIVERSAL WALLET</Text>

      <View style={styles.taglineContainer}>
        <View style={styles.taglineRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>One</Text>
          </View>
          <Text style={styles.taglineText}>Account</Text>
        </View>
        <View style={styles.taglineRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>One</Text>
          </View>
          <Text style={styles.taglineText}>Balance</Text>
        </View>
        <View style={styles.taglineRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Any</Text>
          </View>
          <Text style={styles.taglineText}>Chain</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Feather name="log-in" size={20} color="#ffffff" />
              <Text style={styles.getStartedText}>Get Started</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 3,
    marginBottom: 8,
  },
  taglineContainer: {
    marginVertical: 48,
    gap: 20,
    width: "100%",
    maxWidth: 320,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  badge: {
    borderWidth: 2,
    borderColor: "#a855f7",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#a855f7",
    fontWeight: "bold",
    fontSize: 16,
  },
  taglineText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    marginTop: 32,
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9333ea",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  getStartedText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
