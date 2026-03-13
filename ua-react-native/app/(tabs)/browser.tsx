import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

interface DApp {
  name: string;
  url: string;
  icon: string;
  color: string;
}

const POPULAR_DAPPS: DApp[] = [
  {
    name: "UniversalX",
    url: "https://app.universalx.app",
    icon: "https://app.universalx.app/favicon.ico",
    color: "#f97316",
  },
  {
    name: "Uniswap",
    url: "https://app.uniswap.org",
    icon: "https://app.uniswap.org/favicon.png",
    color: "#FF007A",
  },
  {
    name: "Aave",
    url: "https://app.aave.com",
    icon: "https://app.aave.com/favicon.ico",
    color: "#B6509E",
  },
  {
    name: "OpenSea",
    url: "https://opensea.io",
    icon: "https://opensea.io/favicon.ico",
    color: "#2081E2",
  },
  {
    name: "Jupiter",
    url: "https://jup.ag",
    icon: "https://jup.ag/favicon.ico",
    color: "#C7F284",
  },
  {
    name: "Raydium",
    url: "https://raydium.io",
    icon: "https://raydium.io/favicon.ico",
    color: "#4F46E5",
  },
];

export default function BrowserScreen() {
  const [urlInput, setUrlInput] = useState("");

  const openUrl = async (url: string) => {
    try {
      let normalizedUrl = url.trim();
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }
      await WebBrowser.openBrowserAsync(normalizedUrl, {
        toolbarColor: "#0a0a0a",
        controlsColor: "#f97316",
      });
    } catch (e) {
      Alert.alert("Error", "Could not open URL");
      console.error("Failed to open URL:", e);
    }
  };

  const handleSubmitUrl = () => {
    if (urlInput.trim()) {
      openUrl(urlInput.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Feather name="globe" size={28} color="#f97316" />
          <Text style={styles.heading}>DApp Browser</Text>
        </View>

        {/* URL Input */}
        <View style={styles.urlContainer}>
          <View style={styles.urlInputWrap}>
            <Feather
              name="link"
              size={16}
              color="#6b7280"
              style={styles.urlIcon}
            />
            <TextInput
              style={styles.urlInput}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="Enter URL..."
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleSubmitUrl}
            />
            {urlInput.length > 0 && (
              <TouchableOpacity
                onPress={handleSubmitUrl}
                style={styles.goButton}
                activeOpacity={0.7}
              >
                <Feather name="arrow-right" size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Popular DApps Grid */}
        <Text style={styles.sectionTitle}>Popular DApps</Text>
        <View style={styles.dappGrid}>
          {POPULAR_DAPPS.map((dapp) => (
            <TouchableOpacity
              key={dapp.name}
              style={styles.dappCard}
              onPress={() => openUrl(dapp.url)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dappIconWrap,
                  { backgroundColor: dapp.color + "20" },
                ]}
              >
                <Image
                  source={{ uri: dapp.icon }}
                  style={styles.dappIcon}
                />
              </View>
              <Text style={styles.dappName} numberOfLines={1}>
                {dapp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Feather name="info" size={18} color="#6b7280" />
          <Text style={styles.infoText}>
            Browse decentralized applications directly from your wallet.
            Connect with your Universal Account on any chain.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  urlContainer: {
    marginBottom: 24,
  },
  urlInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 12,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
    paddingVertical: 12,
  },
  goButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  dappGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  dappCard: {
    width: "30%",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  dappIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  dappIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  dappName: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
});
