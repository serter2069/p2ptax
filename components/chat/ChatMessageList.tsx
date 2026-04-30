import { useRef, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MessageBubble from "@/components/MessageBubble";
import { colors } from "@/lib/theme";

interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface MessageItem {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  files: FileAttachment[];
}

export interface ChatMessageListProps {
  messages: MessageItem[];
  myId: string | undefined;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onFilePress: (file: FileAttachment) => void;
  /** Ref exposed so orchestrator can call scrollToEnd */
  flatListRef: React.RefObject<FlatList | null>;
}

export default function ChatMessageList({
  messages,
  myId,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  onFilePress,
  flatListRef,
}: ChatMessageListProps) {
  const renderMessage = useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageBubble
        text={item.text}
        createdAt={item.createdAt}
        isOwn={item.senderId === myId}
        files={item.files}
        onFilePress={onFilePress}
      />
    ),
    [myId, onFilePress]
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: "flex-end" }}
      onContentSizeChange={() => {
        // Scroll to bottom only on initial load / new messages.
        // When loading older messages, prepended items would otherwise
        // jerk the list to the bottom. `loadingOlder` short-circuits that.
        if (!loadingOlder) {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }}
      ListHeaderComponent={
        hasMoreOlder ? (
          <View className="items-center py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Загрузить старые сообщения"
              onPress={onLoadOlder}
              disabled={loadingOlder}
              className="px-4 py-2 rounded-xl border border-slate-200"
              style={({ pressed }) => [
                { backgroundColor: "#f8fafc" },
                pressed && { opacity: 0.7 },
                loadingOlder && { opacity: 0.6 },
              ]}
            >
              {loadingOlder ? (
                <ActivityIndicator size="small" color="#1e3a8a" />
              ) : (
                <Text className="text-sm font-medium" style={{ color: "#1e3a8a" }}>
                  Загрузить старые сообщения
                </Text>
              )}
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-16">
          <FontAwesome name="comments-o" size={48} color={colors.textSecondary} />
          <Text className="text-base font-medium mt-4" style={{ color: colors.textSecondary }}>Начните общение</Text>
          <Text className="text-sm mt-1 text-center px-4" style={{ color: colors.textSecondary }}>
            Напишите сообщение, чтобы начать диалог
          </Text>
        </View>
      }
    />
  );
}
