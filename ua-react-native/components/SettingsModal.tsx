import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  blindSigningEnabled: boolean;
  onToggleBlindSigning: (enabled: boolean) => void;
  onOpenAccountSecurity?: () => void;
  onOpenMasterPassword?: () => void;
  onOpenAppLock?: () => void;
}

export default function SettingsModal({
  visible,
  onClose,
  onLogout,
  blindSigningEnabled,
  onToggleBlindSigning,
  onOpenAccountSecurity,
  onOpenMasterPassword,
  onOpenAppLock,
}: SettingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Security Section */}
            <Text style={styles.sectionLabel}>SECURITY</Text>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={onOpenAccountSecurity}
            >
              <View style={styles.menuRowLeft}>
                <Feather name="shield" size={20} color="#a855f7" />
                <Text style={styles.menuRowText}>Account & Security</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#4b5563" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={onOpenAppLock}
            >
              <View style={styles.menuRowLeft}>
                <Feather name="lock" size={20} color="#a855f7" />
                <Text style={styles.menuRowText}>App Lock</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#4b5563" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={onOpenMasterPassword}
            >
              <View style={styles.menuRowLeft}>
                <Feather name="key" size={20} color="#a855f7" />
                <Text style={styles.menuRowText}>Wallet Password</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#4b5563" />
            </TouchableOpacity>

            {/* Signing Section */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              SIGNING
            </Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.menuRowText}>Blind Signing</Text>
                <Text style={styles.toggleDescription}>
                  When enabled, UA signing uses a lower-friction blind-sign path
                  when supported.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  blindSigningEnabled
                    ? styles.toggleActive
                    : styles.toggleInactive,
                ]}
                onPress={() => onToggleBlindSigning(!blindSigningEnabled)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    blindSigningEnabled
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
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
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowText: {
    color: "#fff",
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleDescription: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#f97316",
  },
  toggleInactive: {
    backgroundColor: "#4b5563",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  toggleThumbInactive: {
    alignSelf: "flex-start",
  },
  logoutBtn: {
    marginTop: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
