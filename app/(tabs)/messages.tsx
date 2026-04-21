import { View, Text, Pressable, FlatList, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle } from "lucide-react-native";
import { colors } from "@/lib/theme";

const CONVERSATIONS = [
  {
    id: "1",
    name: "Alex K.",
    avatar: "A",
    avatarColor: "#3b82f6",
    lastMessage: "Is the iPhone still available?",
    time: "2m ago",
    unread: true,
  },
  {
    id: "2",
    name: "Maria S.",
    avatar: "M",
    avatarColor: "#ec4899",
    lastMessage: "Great, I can pick it up tomorrow",
    time: "1h ago",
    unread: true,
  },
  {
    id: "3",
    name: "David R.",
    avatar: "D",
    avatarColor: "#10b981",
    lastMessage: "Can you do $700?",
    time: "3h ago",
    unread: false,
  },
  {
    id: "4",
    name: "Sophie L.",
    avatar: "S",
    avatarColor: "#f59e0b",
    lastMessage: "Thanks for the quick response!",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "5",
    name: "James P.",
    avatar: "J",
    avatarColor: "#8b5cf6",
    lastMessage: "What's the lowest you'd go?",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "6",
    name: "Elena T.",
    avatar: "E",
    avatarColor: colors.error,
    lastMessage: "Sent you the location pin",
    time: "2 days ago",
    unread: false,
  },
];

function ConversationItem({
  name,
  avatar,
  avatarColor,
  lastMessage,
  time,
  unread,
}: (typeof CONVERSATIONS)[0]) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Чат с ${name}`} className="flex-row items-center px-4 py-3 active:bg-gray-50">
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: avatarColor }}
      >
        <Text className="text-white text-lg font-bold">{avatar}</Text>
      </View>
      <View className="flex-1 ml-3 border-b border-gray-100 pb-3">
        <View className="flex-row justify-between items-center">
          <Text className={`text-base ${unread ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
            {name}
          </Text>
          <Text className={`text-xs ${unread ? "text-blue-600 font-medium" : "text-gray-400"}`}>
            {time}
          </Text>
        </View>
        <View className="flex-row items-center mt-0.5">
          <Text
            className={`flex-1 text-sm ${unread ? "text-gray-900 font-medium" : "text-gray-500"}`}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unread && (
            <View className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2" />
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
        {/* Header */}
        <View className="px-4 pt-2 pb-3 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Messages</Text>
        </View>

        <FlatList
          data={CONVERSATIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationItem {...item} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <MessageCircle size={48} color={colors.textSecondary} />
              <Text className="text-base text-gray-400 mt-4">No messages yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
