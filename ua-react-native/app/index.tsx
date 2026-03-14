import { View, Text, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OMNI Wallet</Text>
      <Text style={styles.subtitle}>Static startup test build</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#f97316",
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: "#9ca3af",
    marginTop: 8,
    fontSize: 14,
  },
});
