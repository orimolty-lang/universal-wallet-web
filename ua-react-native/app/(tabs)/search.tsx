import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#71717a" />
          <TextInput
            style={styles.input}
            placeholder="Search tokens, addresses..."
            placeholderTextColor="#52525b"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.emptyState}>
          <Feather name="search" size={64} color="#27272a" />
          <Text style={styles.emptyTitle}>Search</Text>
          <Text style={styles.emptySubtitle}>
            Search tokens, NFTs, and addresses across all chains
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#71717a",
    textAlign: "center",
    fontSize: 14,
    maxWidth: 260,
  },
});
