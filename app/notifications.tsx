import { View, Text, Pressable, FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, BellOff, MessageCircle, Mail, MapPin, Clock, Bell, type LucideIcon } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import DesktopScreen from "@/components/layout/DesktopScreen";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { api, apiPatch } from "@/lib/api";
import { colors, overlay } from "@/lib/theme";

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

function iconForType(type: string): { Icon: LucideIcon; color: string; bg: string } {
  switch (type) {
    case "new_message_from_specialist":
      return { Icon: MessageCircle, color: colors.primary, bg: colors.accentSoft };
    case "new_message":
      return { Icon: Mail, color: colors.primary, bg: colors.accentSoft };
    case "new_request_in_city":
      return { Icon: MapPin, color: colors.success, bg: colors.greenSoft };
    case "promo_expiring":
      return { Icon: Clock, color: colors.warning, bg: colors.yellowSoft };
    default:
      return { Icon: Bell, color: colors.textSecondary, bg: colors.surface2 };
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
  const { Icon: NotifIcon, color: notifColor, bg: notifBg } = iconForType(item.type);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => onPress(item.id)}
      className="active:bg-surface2"
    >
      <View
        className={`flex-row items-start px-4 py-4 bg-white border border-border rounded-xl mb-3${
          !item.isRead ? " border-l-2" : ""
        }`}
        style={!item.isRead ? { borderLeftColor: colors.primary } : undefined}
      >
        {/* Icon chip */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mt-0.5 flex-shrink-0"
          style={{ backgroundColor: notifBg }}
        >
          <NotifIcon size={18} color={notifColor} />
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="text-sm font-semibold text-text-base flex-1"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-xs text-text-dim mt-0.5 flex-shrink-0">
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text className="text-sm text-text-mute mt-1 leading-5" numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiPatch(`/api/notifications/${id}/read`, {});
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, [notifications]);

  const handleMarkAllRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevUnread = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await apiPatch("/api/notifications/read-all", {});
    } catch {
      setNotifications(prevNotifications);
      setUnreadCount(prevUnread);
    }
  }, [notifications, unreadCount]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-surface2 items-center justify-center">
        <LoadingState variant="spinner" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 bg-white border-b border-border">
        <View className="flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center -ml-2 mr-1"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Text className="text-xl font-bold text-text-base">Уведомления</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Прочитать все"
            onPress={handleMarkAllRead}
            className="py-2 pl-3 justify-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-sm text-accent font-semibold">Прочитать все</Text>
          </Pressable>
        )}
      </View>

      {/* Accent hero */}
      <View style={{ backgroundColor: colors.accent, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 }}>
        <Text className="text-xl font-bold text-white mb-0.5">Ваши уведомления</Text>
        <Text className="text-sm" style={{ color: overlay.white90 }}>Сообщения о новых ответах, заявках и обновлениях</Text>
        <View className="flex-row mt-4 gap-3">
          <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
            <Text className="text-xs" style={{ color: overlay.white90 }}>Непрочитано</Text>
            <Text className="text-xl font-bold text-white">{unreadCount}</Text>
          </View>
          <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: overlay.white15 }}>
            <Text className="text-xs" style={{ color: overlay.white90 }}>Всего</Text>
            <Text className="text-xl font-bold text-white">{notifications.length}</Text>
          </View>
        </View>
      </View>

      <DesktopScreen>
        {loading ? (
          <View className="pt-4 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mb-3">
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
            contentContainerStyle={notifications.length === 0 ? { flexGrow: 1, justifyContent: "center" } : { padding: 16 }}
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
      </DesktopScreen>
    </SafeAreaView>
  );
}
