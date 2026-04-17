import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useRequireAuth } from "@/lib/useRequireAuth";

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
    iconColor: "#1e3a8a",
    iconBg: "#f8fafc",
    title: "Новое сообщение",
    message: "Алексей К. написал вам по заявке о камеральной проверке",
    time: "2 мин назад",
    read: false,
  },
  {
    id: "2",
    icon: "heart",
    iconColor: "#b45309",
    iconBg: "#f8fafc",
    title: "Добавлено в избранное",
    message: "Кто-то сохранил вашу заявку",
    time: "1 час назад",
    read: false,
  },
  {
    id: "3",
    icon: "tag",
    iconColor: "#059669",
    iconBg: "#f8fafc",
    title: "Снижение цены",
    message: "Специалист обновил условия по вашей заявке",
    time: "3 часа назад",
    read: true,
  },
  {
    id: "4",
    icon: "check-circle",
    iconColor: "#1e3a8a",
    iconBg: "#f8fafc",
    title: "Заявка одобрена",
    message: "Ваша заявка на выездную проверку опубликована",
    time: "Вчера",
    read: true,
  },
  {
    id: "5",
    icon: "star",
    iconColor: "#f59e0b",
    iconBg: "#f8fafc",
    title: "Новый отзыв",
    message: "Мария С. оставила отзыв",
    time: "Вчера",
    read: true,
  },
  {
    id: "6",
    icon: "bell",
    iconColor: "#0f172a",
    iconBg: "#f8fafc",
    title: "Напоминание",
    message: "Заполните профиль, чтобы получать больше откликов",
    time: "2 дня назад",
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
      className={`flex-row items-start px-4 py-3.5 border-b border-slate-50 active:bg-slate-50 ${
        !item.read ? "bg-slate-50/50" : ""
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
          <Text className={`text-sm ${!item.read ? "font-bold text-slate-900" : "font-medium text-slate-900"}`}>
            {item.title}
          </Text>
          <Text className="text-xs text-slate-400">{item.time}</Text>
        </View>
        <Text className={`text-sm mt-0.5 ${!item.read ? "text-slate-900" : "text-slate-400"}`} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.read && <View className="w-2 h-2 rounded-full bg-amber-700 mt-2 ml-2" />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-slate-50">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2 mr-1">
            <FontAwesome name="arrow-left" size={18} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900">Уведомления</Text>
        </View>
        <Pressable onPress={markAllRead} className="py-3 pl-3">
          <Text className="text-sm text-blue-900 font-medium">Прочитать все</Text>
        </Pressable>
      </View>

      <ResponsiveContainer>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onToggleRead={toggleRead} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <FontAwesome name="bell-slash-o" size={48} color="#94a3b8" />
              <Text className="text-base text-slate-400 mt-4">Нет уведомлений</Text>
            </View>
          }
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
