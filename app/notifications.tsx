import { View, Text, Pressable, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, BellOff, MessageCircle, Mail, MapPin, Clock, Bell, type LucideIcon } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { api, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

function iconForType(type: string): { Icon: LucideIcon; color: string } {
  switch (type) {
    case "new_response":
      return { Icon: MessageCircle, color: colors.primary };
    case "new_message":
      return { Icon: Mail, color: colors.primary };
    case "new_request_in_city":
      return { Icon: MapPin, color: colors.success };
    case "promo_expiring":
      return { Icon: Clock, color: colors.accent };
    default:
      return { Icon: Bell, color: colors.text };
  }
}

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (id: string) => void;
}) {
  const { Icon: NotifIcon, color: notifColor } = iconForType(item.type);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => onPress(item.id)}
      className={`flex-row items-start px-4 py-3.5 border-b border-surface2 active:bg-surface2 ${
        !item.isRead ? "bg-surface2/50" : ""
      }`}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mt-0.5"
        style={{ backgroundColor: colors.background }}
      >
        <NotifIcon size={16} color={notifColor} />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${!item.isRead ? "font-bold text-text-base" : "font-medium text-text-base"}`}>
            {item.title}
          </Text>
          <Text className="text-xs text-text-mute">{formatTime(item.createdAt)}</Text>
        </View>
        <Text className={`text-sm mt-0.5 ${!item.isRead ? "text-text-base" : "text-text-mute"}`} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.isRead && <View className="w-2 h-2 rounded-full bg-warning mt-2 ml-2" />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api<NotificationsResponse>("/api/notifications");
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setError(null);
    } catch {
      setError("Не удалось загрузить уведомления");
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [ready, fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    const item = notifications.find((n) => n.id === id);
    if (!item || item.isRead) return;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiPatch(`/api/notifications/${id}/read`, {});
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, [notifications]);

  const handleMarkAllRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevUnread = unreadCount;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiPatch("/api/notifications/read-all", {});
    } catch {
      // Revert on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevUnread);
    }
  }, [notifications, unreadCount]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <LoadingState variant="spinner" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-surface2">
        <View className="flex-row items-center">
          <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.back()} className="w-11 h-11 items-center justify-center -ml-2 mr-1">
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>
          <Text className="text-2xl font-bold text-text-base">Уведомления</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Прочитать все" onPress={handleMarkAllRead} className="py-3 pl-3">
            <Text className="text-sm text-accent font-medium">Прочитать все</Text>
          </Pressable>
        )}
      </View>

      <ResponsiveContainer>
        {loading ? (
          <View className="pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mx-4 mb-3">
                <LoadingState variant="skeleton" lines={2} />
              </View>
            ))}
          </View>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setError(null);
              setLoading(true);
              fetchNotifications().finally(() => setLoading(false));
            }}
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationRow item={item} onPress={handleMarkRead} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon={BellOff}
                title="Нет уведомлений"
                subtitle="Здесь будут ваши уведомления"
              />
            }
          />
        )}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
