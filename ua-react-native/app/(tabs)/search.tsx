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
        <Feather name="search" size={64} color="#3f3f46" />
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>
          Search tokens, NFTs, and addresses across all chains
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#6b7280"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  searchContainer: {
    width: "100%",
    maxWidth: 360,
  },
  searchInput: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 16,
  },
});
