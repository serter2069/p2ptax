import { View, Text, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import { AVATAR_COLORS, colors, overlay } from "@/lib/theme";

const CONVERSATIONS = [
  { id: "1", name: "Alex K.", avatar: "A", lastMessage: "Is the iPhone still available?", time: "2m ago", unread: true },
  { id: "2", name: "Maria S.", avatar: "M", lastMessage: "Great, I can pick it up tomorrow", time: "1h ago", unread: true },
  { id: "3", name: "David R.", avatar: "D", lastMessage: "Can you do $700?", time: "3h ago", unread: false },
  { id: "4", name: "Sophie L.", avatar: "S", lastMessage: "Thanks for the quick response!", time: "Yesterday", unread: false },
  { id: "5", name: "James P.", avatar: "J", lastMessage: "What's the lowest you'd go?", time: "Yesterday", unread: false },
  { id: "6", name: "Elena T.", avatar: "E", lastMessage: "Sent you the location pin", time: "2 days ago", unread: false },
];

function ConversationItem({
  name,
  avatar,
  lastMessage,
  time,
  unread,
  index,
}: (typeof CONVERSATIONS)[0] & { index: number }) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Чат с ${name}`}
      className="flex-row items-center active:bg-surface2"
      style={[
        { minHeight: 72, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
        unread ? { borderLeftWidth: 3, borderLeftColor: colors.primary, backgroundColor: overlay.accent10 } : {},
      ]}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{
          backgroundColor: avatarColor,
          borderWidth: 2,
          borderColor: '#ffffff',
          shadowColor: colors.text,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
        }}
      >
        <Text className="text-lg font-bold text-white">{avatar}</Text>
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center mb-0.5">
          <Text className={`text-base ${unread ? "font-bold text-accent" : "font-semibold text-text-base"}`}>
            {name}
          </Text>
          <Text className={`text-xs ${unread ? "text-accent font-semibold" : "text-text-dim"}`}>
            {time}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text
            className={`flex-1 text-sm ${unread ? "text-text-base font-medium" : "text-text-mute"}`}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unread && (
            <View className="w-2.5 h-2.5 rounded-full bg-accent ml-2" />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1" style={containerStyle}>
        <View className="px-4 pt-3 pb-3 border-b border-border bg-white flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text-base">Сообщения</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Написать новое сообщение"
            className="bg-accent-soft rounded-full px-3 py-1.5 justify-center items-center"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Text className="text-sm font-semibold text-accent">+ Написать</Text>
          </Pressable>
        </View>

        <FlatList
          data={CONVERSATIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ConversationItem {...item} index={index} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title="Нет сообщений"
              subtitle="Здесь появятся ваши переписки"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
