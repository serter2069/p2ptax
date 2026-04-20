import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { api, apiPatch } from "@/lib/api";

interface RequestItem {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
}

// ── Toast ──────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="absolute bottom-24 left-0 right-0 items-center z-50 px-4"
      pointerEvents="none"
    >
      <View className="bg-slate-900 px-4 py-2 rounded-full">
        <Text className="text-white text-sm font-medium">{message}</Text>
      </View>
    </Animated.View>
  );
}

// ── Swipeable request card ─────────────────────────────────────────────
const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 80;

interface SwipeableCardProps {
  item: RequestItem;
  onPress: (id: string) => void;
  onClose: (id: string, title: string) => void;
}

function SwipeableCard({ item, onPress, onClose }: SwipeableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isActive = item.status !== "CLOSED";

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        // Only handle horizontal swipes (left) on non-web platforms
        return (
          isActive &&
          Platform.OS !== "web" &&
          Math.abs(gestureState.dx) > 8 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2
        );
      },
      onPanResponderMove: (_evt, gestureState) => {
        // Only allow left swipe (negative dx)
        const clampedX = Math.max(-ACTION_WIDTH, Math.min(0, gestureState.dx));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Snap to show action button
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const closeAndReset = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
    onClose(item.id, item.title);
  };

  const formattedDate = new Date(item.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View className="mb-3 overflow-hidden rounded-xl">
      {/* Red action button revealed on swipe */}
      {isActive && (
        <View
          className="absolute right-0 top-0 bottom-0 bg-red-600 items-center justify-center rounded-r-xl"
          style={{ width: ACTION_WIDTH }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть заявку"
            onPress={closeAndReset}
            className="flex-1 w-full items-center justify-center"
          >
            <Text className="text-white text-xs font-semibold text-center px-2">
              Закрыть{"\n"}заявку
            </Text>
          </Pressable>
        </View>
      )}

      {/* Card sliding layer */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...(isActive ? panResponder.panHandlers : {})}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => onPress(item.id)}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          {/* Title + status */}
          <View className="flex-row items-start justify-between mb-2 gap-2">
            <Text
              className="text-base font-semibold text-slate-900 flex-1"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <StatusBadge status={item.status} />
          </View>

          {/* City + FNS */}
          <Text className="text-xs text-slate-400 mb-2" numberOfLines={1}>
            {item.city.name} · {item.fns.name}
          </Text>

          {/* Footer: threads + date */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-slate-400">
              {item.threadsCount}{" "}
              {item.threadsCount === 1
                ? "специалист откликнулся"
                : "специалистов откликнулось"}
            </Text>
            <Text className="text-xs text-slate-400">{formattedDate}</Text>
          </View>

          {/* Swipe hint for active cards (mobile only) */}
          {isActive && Platform.OS !== "web" && (
            <Text className="text-[10px] text-slate-300 mt-1 text-right">
              ← смахните для закрытия
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────
export default function MyRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const showToast = useCallback(() => {
    setToast(true);
    setTimeout(() => setToast(false), 2400);
  }, []);

  const fetchRequests = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ items: RequestItem[] }>("/api/requests/my");
      setRequests(res.items);
    } catch (e) {
      console.error("Fetch my requests error:", e);
      setError("Не удалось загрузить заявки");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const handleClose = useCallback(
    (id: string, title: string) => {
      Alert.alert(
        "Закрыть заявку",
        "Закрыть заявку? Это действие нельзя отменить.",
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Да, закрыть",
            style: "destructive",
            onPress: async () => {
              try {
                await apiPatch(`/api/requests/${id}/status`, { status: "CLOSED" });
                setRequests((prev) =>
                  prev.map((r) =>
                    r.id === id ? { ...r, status: "CLOSED" as const } : r
                  )
                );
                showToast();
              } catch (e) {
                console.error("Close request error:", e);
                Alert.alert("Ошибка", "Не удалось закрыть заявку");
              }
            },
          },
        ]
      );
    },
    [showToast]
  );

  const handleRequestPress = useCallback(
    (id: string) => {
      router.push(`/requests/${id}/detail` as never);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: RequestItem }) => (
      <SwipeableCard item={item} onPress={handleRequestPress} onClose={handleClose} />
    ),
    [handleRequestPress, handleClose]
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View className="py-8">
          <LoadingState variant="skeleton" lines={5} />
          <LoadingState variant="skeleton" lines={5} />
          <LoadingState variant="skeleton" lines={5} />
        </View>
      );
    }

    if (error) {
      return (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            fetchRequests().finally(() => setLoading(false));
          }}
        />
      );
    }

    if (requests.length === 0) {
      return (
        <EmptyState
          icon="file-text-o"
          title="Заявок пока нет"
          subtitle="Создайте первую заявку — специалисты из вашего города увидят её и предложат помощь"
          actionLabel="Создать заявку"
          onAction={() => router.push("/requests/new" as never)}
        />
      );
    }

    return (
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome />
      <ResponsiveContainer>
        {/* Page title + create button row */}
        <View className="flex-row items-center justify-between mt-4 mb-4">
          <Text className="text-2xl font-bold text-slate-900">Мои заявки</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать заявку"
            onPress={() => router.push("/requests/new" as never)}
            className="bg-blue-900 rounded-xl px-4 py-2 flex-row items-center"
          >
            <Text className="text-white font-semibold text-sm">+ Создать</Text>
          </Pressable>
        </View>

        {renderContent()}
      </ResponsiveContainer>

      {/* Toast */}
      <Toast message="Заявка закрыта" visible={toast} />
    </SafeAreaView>
  );
}
