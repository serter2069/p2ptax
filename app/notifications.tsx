import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";

interface Notification {
  id: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: "comments",
    iconColor: "#3b82f6",
    iconBg: "#eff6ff",
    title: "New message",
    message: "Alex K. sent you a message about iPhone 15 Pro",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    icon: "heart",
    iconColor: "#ec4899",
    iconBg: "#fce7f3",
    title: "Listing favorited",
    message: "Someone saved your MacBook Air listing",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    icon: "tag",
    iconColor: "#10b981",
    iconBg: "#d1fae5",
    title: "Price drop",
    message: 'Toyota Camry 2020 price dropped to $17,000',
    time: "3 hours ago",
    read: true,
  },
  {
    id: "4",
    icon: "check-circle",
    iconColor: "#8b5cf6",
    iconBg: "#ede9fe",
    title: "Listing approved",
    message: "Your listing for Vintage Leather Jacket is now live",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    icon: "star",
    iconColor: "#f59e0b",
    iconBg: "#fef3c7",
    title: "New review",
    message: "Maria S. left a 5-star review",
    time: "Yesterday",
    read: true,
  },
  {
    id: "6",
    icon: "bell",
    iconColor: "#6b7280",
    iconBg: "#f3f4f6",
    title: "Reminder",
    message: "Complete your profile to get more responses",
    time: "2 days ago",
    read: true,
  },
];

function NotificationItem({
  item,
  onToggleRead,
}: {
  item: Notification;
  onToggleRead: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggleRead(item.id)}
      className={`flex-row items-start px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 ${
        !item.read ? "bg-blue-50/50" : ""
      }`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mt-0.5"
        style={{ backgroundColor: item.iconBg }}
      >
        <FontAwesome name={item.icon} size={16} color={item.iconColor} />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${!item.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
            {item.title}
          </Text>
          <Text className="text-xs text-gray-400">{item.time}</Text>
        </View>
        <Text className={`text-sm mt-0.5 ${!item.read ? "text-gray-700" : "text-gray-500"}`} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.read && <View className="w-2 h-2 rounded-full bg-blue-600 mt-2 ml-2" />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <FontAwesome name="arrow-left" size={18} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
        </View>
        <Pressable onPress={markAllRead}>
          <Text className="text-sm text-blue-600 font-medium">Mark all read</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onToggleRead={toggleRead} />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <FontAwesome name="bell-slash-o" size={48} color="#d1d5db" />
            <Text className="text-base text-gray-400 mt-4">No notifications</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
