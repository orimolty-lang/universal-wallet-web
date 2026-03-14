import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { getParticleBase, getParticleChains, getParticleConnect } from "../lib/particleSafe";
// Lazy-loaded to prevent crash if native modules are missing
const LoginType = { Email: "Email" } as const;
const SupportAuthType = {
  Apple: "Apple",
  Twitter: "Twitter",
  Email: "Email",
  Phone: "Phone",
  Discord: "Discord",
  Github: "Github",
  Google: "Google",
} as const;

const { width } = Dimensions.get("window");

const FEATURE_CHIPS = ["Swap", "Perps", "Earn Yield", "Polymarket"];

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const base = getParticleBase();
      const chains = getParticleChains();
      const pc = getParticleConnect();
      const extra = Constants.expoConfig?.extra;

      if (!base || !chains || !pc) {
        Alert.alert("SDK unavailable", "Particle SDK modules are not available in this build.");
        return;
      }

      // Safe on-demand init (keeps app startup stable)
      try {
        base.init(chains.ArbitrumOne, base.Env.Production);
        pc.init(chains.ArbitrumOne, base.Env.Production, {
          name: "OMNI Wallet",
          icon: "https://connect.particle.network/icons/512.png",
          url: "https://particle.network",
          description: "OMNI - Universal Wallet powered by Particle Network",
        });
        if (extra?.walletConnectProjectId) {
          pc.setWalletConnectProjectId(extra.walletConnectProjectId);
        }
      } catch (e) {
        console.log("Particle init warning:", e);
      }

      const account = await pc.connect("AuthCore", { loginType: LoginType.Email });

      if (account?.publicAddress) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Connection failed", "No account returned from SDK");
      }
    } catch (error: any) {
      console.error("Connection failed:", error);
      const details = error?.message || error?.reason || error?.code || JSON.stringify(error);
      Alert.alert("Connection failed", String(details || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={["#f97316", "#fb923c", "#fdba74"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientTextContainer}
        >
          <Text style={styles.brandTitle}>OMNI</Text>
        </LinearGradient>

        <Text style={styles.tagline}>One Account. One Balance. Any Chain.</Text>

        <View style={styles.chipRow}>
          {FEATURE_CHIPS.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleConnect}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Feather name="arrow-right" size={20} color="#000000" />
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
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  gradientTextContainer: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 52,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 16,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    maxWidth: width * 0.85,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#18181b",
  },
  chipText: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  getStartedText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "700",
  },
});
