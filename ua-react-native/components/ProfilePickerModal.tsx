import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const PROFILE_EMOJIS = ["🍊", "🦊", "🐱", "🐶", "🎮", "🎨", "🎵", "🚀"];

const BACKGROUND_COLORS = [
  "#f97316",
  "#a855f7",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#f59e0b",
];

export interface ProfileSettings {
  emoji: string;
  customImage: string | null;
  displayName: string;
  backgroundColor: string;
}

interface ProfilePickerModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ProfileSettings;
  onUpdateProfile: (p: ProfileSettings) => void;
}

export default function ProfilePickerModal({
  visible,
  onClose,
  profile,
  onUpdateProfile,
}: ProfilePickerModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedColor, setSelectedColor] = useState(
    profile.backgroundColor || "#f97316"
  );
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (visible) {
      setDisplayName(profile.displayName);
      setSelectedColor(profile.backgroundColor || "#f97316");
      setImageUrl("");
    }
  }, [visible, profile]);

  const handleSetImageUrl = () => {
    if (imageUrl.trim()) {
      onUpdateProfile({
        ...profile,
        customImage: imageUrl.trim(),
        emoji: "",
      });
      setImageUrl("");
    }
  };

  const handleClearImage = () => {
    onUpdateProfile({ ...profile, customImage: null });
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      displayName,
      backgroundColor: selectedColor,
    });
    onClose();
  };

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
            <Text style={styles.headerTitle}>Customize Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Display Name */}
            <View style={styles.section}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter a custom name..."
                placeholderTextColor="#6b7280"
                maxLength={20}
              />
            </View>

            {/* Current Avatar Preview */}
            <View style={styles.avatarRow}>
              <View
                style={[
                  styles.avatarPreview,
                  {
                    backgroundColor: profile.customImage
                      ? "#333"
                      : selectedColor,
                  },
                ]}
              >
                {profile.customImage ? (
                  <Image
                    source={{ uri: profile.customImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarEmoji}>{profile.emoji}</Text>
                )}
              </View>
              {profile.customImage && (
                <TouchableOpacity
                  style={styles.clearImageBtn}
                  onPress={handleClearImage}
                >
                  <Text style={styles.clearImageText}>Remove Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Custom Image URL */}
            <View style={styles.section}>
              <Text style={styles.label}>Custom Image URL</Text>
              <View style={styles.imageUrlRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://example.com/avatar.png"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  style={[
                    styles.setImageBtn,
                    !imageUrl.trim() && styles.btnDisabled,
                  ]}
                  onPress={handleSetImageUrl}
                  disabled={!imageUrl.trim()}
                >
                  <Text style={styles.setImageBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Background Color Picker */}
            {!profile.customImage && (
              <View style={styles.section}>
                <Text style={styles.label}>Background Color</Text>
                <View style={styles.colorGrid}>
                  {BACKGROUND_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorSwatchSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Emoji Grid */}
            <View style={styles.section}>
              <Text style={styles.label}>Pick an emoji</Text>
              <View style={styles.emojiGrid}>
                {PROFILE_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() =>
                      onUpdateProfile({
                        ...profile,
                        emoji,
                        customImage: null,
                        backgroundColor: selectedColor,
                      })
                    }
                    style={[
                      styles.emojiBtn,
                      profile.emoji === emoji &&
                        !profile.customImage &&
                        styles.emojiBtnSelected,
                    ]}
                  >
                    <Text style={styles.emojiBtnText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: "90%",
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
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatarPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  clearImageBtn: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearImageText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  imageUrlRow: {
    flexDirection: "row",
    gap: 8,
  },
  setImageBtn: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  setImageBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnSelected: {
    backgroundColor: "#4b5563",
  },
  emojiBtnText: {
    fontSize: 22,
  },
  saveBtn: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 32,
  },
  saveBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});
