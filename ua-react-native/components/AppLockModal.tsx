import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

const PIN_LENGTH = 4;
const PIN_KEY = "app_lock_pin";

interface AppLockModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = "menu" | "set_new" | "confirm_new" | "remove_verify";

export default function AppLockModal({ visible, onClose }: AppLockModalProps) {
  const [hasPIN, setHasPIN] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      checkPIN();
      setStep("menu");
      setPin("");
      setFirstPin("");
      setError(null);
    }
  }, [visible]);

  const checkPIN = async () => {
    setIsLoading(true);
    try {
      const stored = await SecureStore.getItemAsync(PIN_KEY);
      setHasPIN(!!stored);
    } catch {
      setHasPIN(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(null);

    if (newPin.length === PIN_LENGTH) {
      handlePinComplete(newPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handlePinComplete = async (completedPin: string) => {
    if (step === "set_new") {
      setFirstPin(completedPin);
      setPin("");
      setStep("confirm_new");
    } else if (step === "confirm_new") {
      if (completedPin === firstPin) {
        try {
          await SecureStore.setItemAsync(PIN_KEY, completedPin);
          setHasPIN(true);
          setStep("menu");
          setPin("");
          setFirstPin("");
        } catch {
          setError("Failed to save PIN");
          setPin("");
        }
      } else {
        setError("PINs don't match. Try again.");
        setPin("");
        setFirstPin("");
        setStep("set_new");
      }
    } else if (step === "remove_verify") {
      try {
        const stored = await SecureStore.getItemAsync(PIN_KEY);
        if (stored === completedPin) {
          await SecureStore.deleteItemAsync(PIN_KEY);
          setHasPIN(false);
          setStep("menu");
          setPin("");
        } else {
          setError("Incorrect PIN");
          setPin("");
        }
      } catch {
        setError("Failed to verify PIN");
        setPin("");
      }
    }
  };

  const renderPinDots = () => (
    <View style={styles.pinDotsRow}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
        />
      ))}
    </View>
  );

  const renderKeypad = () => (
    <View style={styles.keypad}>
      {[
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["", "0", "del"],
      ].map((row, ri) => (
        <View key={ri} style={styles.keypadRow}>
          {row.map((key) =>
            key === "" ? (
              <View key="empty" style={styles.keypadBtn} />
            ) : key === "del" ? (
              <TouchableOpacity
                key="del"
                style={styles.keypadBtn}
                onPress={handleDelete}
              >
                <Feather name="delete" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                key={key}
                style={styles.keypadBtn}
                onPress={() => handleDigit(key)}
              >
                <Text style={styles.keypadBtnText}>{key}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      ))}
    </View>
  );

  const getTitle = () => {
    switch (step) {
      case "set_new":
        return "Enter New PIN";
      case "confirm_new":
        return "Confirm PIN";
      case "remove_verify":
        return "Enter Current PIN";
      default:
        return "App Lock";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "set_new":
        return "Choose a 4-digit PIN to lock the app";
      case "confirm_new":
        return "Re-enter your PIN to confirm";
      case "remove_verify":
        return "Enter your current PIN to remove it";
      default:
        return "Secure your OMNI wallet with a PIN code";
    }
  };

  // PIN entry UI
  if (step !== "menu") {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setStep("menu");
                  setPin("");
                  setFirstPin("");
                  setError(null);
                }}
                style={styles.backBtn}
              >
                <Feather name="chevron-left" size={20} color="#9ca3af" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.pinBody}>
              <View style={styles.pinIconContainer}>
                <Feather name="lock" size={32} color="#a855f7" />
              </View>
              <Text style={styles.pinTitle}>{getTitle()}</Text>
              <Text style={styles.pinSubtitle}>{getSubtitle()}</Text>

              {renderPinDots()}

              {error && <Text style={styles.pinError}>{error}</Text>}

              {renderKeypad()}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Menu view
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>App Lock</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.menuBody}>
            <Text style={styles.menuDescription}>
              App Lock uses a PIN code to protect your OMNI account. Enable a PIN below.
            </Text>

            {isLoading ? (
              <View style={styles.loadingRow}>
                <Text style={styles.loadingText}>Checking...</Text>
              </View>
            ) : (
              <>
                {/* PIN status */}
                <View style={styles.statusRow}>
                  <View style={styles.statusLeft}>
                    <Feather name="lock" size={20} color="#a855f7" />
                    <Text style={styles.statusLabel}>PIN Lock</Text>
                  </View>
                  <View style={[styles.statusIndicator, hasPIN ? styles.statusOn : styles.statusOff]}>
                    <Text style={[styles.statusIndicatorText, hasPIN ? styles.statusOnText : styles.statusOffText]}>
                      {hasPIN ? "ON" : "OFF"}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {!hasPIN ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setStep("set_new")}
                  >
                    <Feather name="plus" size={18} color="#000" />
                    <Text style={styles.actionBtnText}>Set Up PIN</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actionsColumn}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setPin("");
                        setFirstPin("");
                        setError(null);
                        setStep("set_new");
                      }}
                    >
                      <Feather name="refresh-cw" size={18} color="#000" />
                      <Text style={styles.actionBtnText}>Change PIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => {
                        setPin("");
                        setError(null);
                        setStep("remove_verify");
                      }}
                    >
                      <Feather name="trash-2" size={18} color="#ef4444" />
                      <Text style={styles.removeBtnText}>Remove PIN</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {hasPIN && (
                  <Text style={styles.enabledNote}>
                    PIN Lock is enabled. You'll need to enter your PIN when opening OMNI.
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#9ca3af",
    fontSize: 15,
  },
  menuBody: {
    padding: 20,
    paddingBottom: 40,
  },
  menuDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    marginBottom: 20,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusLabel: {
    color: "#fff",
    fontSize: 16,
  },
  statusIndicator: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusOn: {
    backgroundColor: "rgba(74,222,128,0.15)",
  },
  statusOff: {
    backgroundColor: "rgba(107,114,128,0.15)",
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusOnText: {
    color: "#4ade80",
  },
  statusOffText: {
    color: "#6b7280",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  actionsColumn: {
    gap: 10,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  removeBtnText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  enabledNote: {
    color: "#22c55e",
    fontSize: 12,
    marginTop: 16,
  },
  // PIN entry
  pinBody: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pinIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(168,85,247,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  pinTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  pinSubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  pinDotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#4b5563",
  },
  pinDotFilled: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  pinError: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 8,
  },
  keypad: {
    width: "100%",
    maxWidth: 280,
    marginTop: 16,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  keypadBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  keypadBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
});
