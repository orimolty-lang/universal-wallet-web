import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

interface AgentModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Swap 10 USDC to ETH",
  "What's my balance?",
  "Bridge to Arbitrum",
];

export default function AgentModal({ visible, onClose }: AgentModalProps) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) {
      setChat([]);
      setMessage("");
    }
  }, [visible]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", text: text.trim() };
    setChat((prev) => [...prev, userMsg]);
    setMessage("");

    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        { role: "agent", text: "I'm still learning! This feature is coming soon." },
      ]);
    }, 500);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageBubbleRow,
        item.role === "user" ? styles.userRow : styles.agentRow,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.role === "user" ? styles.userBubble : styles.agentBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === "user" ? styles.userText : styles.agentText,
          ]}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#9ca3af" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentEmoji}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Agent</Text>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Chat or Empty State */}
          {chat.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyAvatar}>
                <Text style={styles.emptyEmoji}>🤖</Text>
              </View>
              <Text style={styles.emptyTitle}>AI Agent</Text>
              <Text style={styles.emptySubtitle}>Your crypto assistant</Text>
              <View style={styles.suggestionsContainer}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionBtn}
                    onPress={() => setMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={chat}
              renderItem={renderMessage}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Ask anything..."
              placeholderTextColor="#6b7280"
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(message)}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !message.trim() && styles.sendBtnDisabled,
              ]}
              onPress={() => sendMessage(message)}
              disabled={!message.trim()}
            >
              <Feather name="arrow-up" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1,
    marginTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#a855f7",
  },
  agentEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  onlineText: {
    fontSize: 12,
    color: "#22c55e",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: "100%",
    gap: 8,
  },
  suggestionBtn: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
  },
  suggestionText: {
    color: "#d1d5db",
    fontSize: 14,
  },
  chatList: {
    padding: 16,
    gap: 10,
  },
  messageBubbleRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  agentRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#f97316",
  },
  agentBubble: {
    backgroundColor: "#2a2a2a",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#000",
  },
  agentText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
