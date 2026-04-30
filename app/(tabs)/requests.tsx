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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { BREAKPOINT } from "@/lib/theme";
import DesktopScreen from "@/components/layout/DesktopScreen";
import { FileText, Trash2 } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { api, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";

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

// ── Undo Toast ─────────────────────────────────────────────────────────
function UndoToast({
  message,
  visible,
  onUndo,
}: {
  message: string;
  visible: boolean;
  onUndo: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ opacity }}
      className="absolute bottom-24 left-0 right-0 items-center z-50 px-4"
    >
      <View className="bg-text-base px-4 py-2 rounded-full flex-row items-center gap-3">
        <Text className="text-white text-sm font-medium">{message}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Отменить"
          onPress={onUndo}
          className="px-2 py-1"
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Text className="text-accent text-sm font-bold uppercase">Отменить</Text>
        </Pressable>
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
    <View className="mb-3 mx-4 overflow-hidden rounded-2xl">
      {/* Red action button revealed on swipe */}
      {isActive && (
        <View
          className="absolute right-0 top-0 bottom-0 bg-danger items-center justify-center rounded-r-2xl"
          style={{ width: ACTION_WIDTH }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть заявку"
            onPress={closeAndReset}
            className="flex-1 w-full items-center justify-center"
            style={{ minHeight: 44 }}
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
        {...(isActive && Platform.OS !== "web" ? panResponder.panHandlers : {})}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={() => onPress(item.id)}
          className="bg-white border border-border rounded-2xl p-4"
          style={{
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.09,
            shadowRadius: 7,
            elevation: 3,
            minHeight: 44,
          }}
        >
          {/* Title + trash on web */}
          <View className="flex-row items-start justify-between mb-1 gap-2">
            <Text
              className="text-base font-semibold text-text-base flex-1"
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {isActive && Platform.OS === "web" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Закрыть заявку"
                onPress={(e) => {
                  e.stopPropagation();
                  onClose(item.id, item.title);
                }}
                className="p-2"
                style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            )}
          </View>

          {/* Description preview */}
          {item.description ? (
            <Text className="text-sm text-text-mute mb-2" numberOfLines={2}>
              {item.description.length > 80
                ? item.description.slice(0, 80) + "…"
                : item.description}
            </Text>
          ) : null}

          {/* City + FNS */}
          <Text className="text-sm text-text-mute mb-2" numberOfLines={1}>
            {item.city.name} · {item.fns.name}
          </Text>

          {/* Footer: threads + date */}
          <View className="flex-row items-center justify-between">
            {item.threadsCount > 0 ? (
              <View className="bg-accent-soft rounded-full px-2 py-0.5 flex-row items-center">
                <Text className="text-xs text-accent font-medium">
                  {item.threadsCount}{" "}
                  {item.threadsCount === 1
                    ? "специалист"
                    : "специалистов"}
                </Text>
              </View>
            ) : (
              <Text className="text-xs text-text-mute">Нет диалогов</Text>
            )}
            <Text className="text-xs text-text-mute">{formattedDate}</Text>
          </View>

          {/* Swipe hint for active cards (mobile only) */}
          {isActive && Platform.OS !== "web" && (
            <Text className="text-xs text-text-mute mt-1 text-right">
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
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const pendingRef = useRef<{
    id: string;
    prevStatus: RequestItem["status"];
    timer: ReturnType<typeof setTimeout> | null;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    setError(null);
    try {
      const res = await api<{ items: RequestItem[] }>("/api/requests/my");
      setRequests(res.items);
    } catch (e) {
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

  // Cross-platform confirm: native uses Alert, web uses window.confirm.
  const confirmDestructive = useCallback(
    (title: string, message: string): Promise<boolean> => {
      if (Platform.OS === "web") {
        // Avoid blocking promise return inside Alert callbacks on web.
        const ok =
          typeof window !== "undefined" && typeof window.confirm === "function"
            ? window.confirm(`${title}\n\n${message}`)
            : true;
        return Promise.resolve(ok);
      }
      return new Promise((resolve) => {
        Alert.alert(title, message, [
          { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Удалить",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ]);
      });
    },
    []
  );

  const commitClose = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setUndoVisible(false);
    try {
      await apiPatch(`/api/requests/${pending.id}/status`, { status: "CLOSED" });
    } catch (e) {
      // Roll back optimistic state on failure
      setRequests((prev) =>
        prev.map((r) =>
          r.id === pending.id ? { ...r, status: pending.prevStatus } : r
        )
      );
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("Ошибка: не удалось закрыть заявку");
        }
      } else {
        Alert.alert("Ошибка", "Не удалось закрыть заявку");
      }
    }
  }, []);

  const handleUndo = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === pending.id ? { ...r, status: pending.prevStatus } : r
      )
    );
    pendingRef.current = null;
    setUndoVisible(false);
  }, []);

  const handleClose = useCallback(
    async (id: string, _title: string) => {
      const ok = await confirmDestructive(
        "Удалить заявку?",
        "Заявка будет закрыта. У вас будет 5 секунд, чтобы отменить."
      );
      if (!ok) return;

      // If another close is pending, commit it immediately to keep state clean.
      if (pendingRef.current) {
        const prev = pendingRef.current;
        if (prev.timer) clearTimeout(prev.timer);
        await commitClose();
      }

      const target = requests.find((r) => r.id === id);
      const prevStatus: RequestItem["status"] = target ? target.status : "ACTIVE";

      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "CLOSED" as const } : r
        )
      );

      const timer = setTimeout(() => {
        commitClose();
      }, 5000);

      pendingRef.current = { id, prevStatus, timer };
      setUndoVisible(true);
    },
    [confirmDestructive, commitClose, requests]
  );

  // Cleanup on unmount: commit any pending close so user's intent survives.
  useEffect(() => {
    return () => {
      const pending = pendingRef.current;
      if (pending?.timer) {
        clearTimeout(pending.timer);
        // Fire-and-forget commit; component unmounting.
        apiPatch(`/api/requests/${pending.id}/status`, { status: "CLOSED" }).catch(
          () => {}
        );
        pendingRef.current = null;
      }
    };
  }, []);

  const handleRequestPress = useCallback(
    (id: string) => {
      nav.any(`/requests/${id}/detail`);
    },
    [nav]
  );

  const renderItem = useCallback(
    ({ item }: { item: RequestItem }) => (
      <SwipeableCard item={item} onPress={handleRequestPress} onClose={handleClose} />
    ),
    [handleRequestPress, handleClose]
  );

  const filteredRequests = requests.filter((r) =>
    activeTab === "active"
      ? r.status === "ACTIVE" || r.status === "CLOSING_SOON"
      : r.status === "CLOSED"
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

    if (filteredRequests.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title={activeTab === "active" ? "Активных заявок нет" : "Закрытых заявок нет"}
          subtitle={
            activeTab === "active"
              ? "Создайте первую заявку — специалисты из вашего города увидят её и предложат помощь"
              : "Закрытые заявки появятся здесь"
          }
          actionLabel={activeTab === "active" ? "Создать заявку" : undefined}
          onAction={activeTab === "active" ? () => nav.routes.requestsNew() : undefined}
        />
      );
    }

    return (
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <DesktopScreen>
        <View className="flex-row items-center justify-between mb-4">
          {!isDesktop && (
            <Text className="text-xl font-bold text-text-base">Мои заявки</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Создать заявку"
            onPress={() => nav.routes.requestsNew()}
            className="flex-row items-center gap-1.5 px-4 rounded-xl"
            style={{ backgroundColor: colors.primary, minHeight: 40, justifyContent: "center", marginLeft: isDesktop ? "auto" : 0 }}
          >
            <Text className="text-white font-semibold text-sm">+ Создать</Text>
          </Pressable>
        </View>

        {/* Active / Closed tab switcher */}
        <View
          className="flex-row mb-4 rounded-xl overflow-hidden border border-border"
          style={{ backgroundColor: colors.surface2 }}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Активные заявки"
            onPress={() => setActiveTab("active")}
            style={[
              { flex: 1, paddingVertical: 10, alignItems: "center", minHeight: 40 },
              activeTab === "active" ? { backgroundColor: colors.primary } : undefined,
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: activeTab === "active" ? "#fff" : colors.textSecondary,
              }}
            >
              Активные
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Закрытые заявки"
            onPress={() => setActiveTab("closed")}
            style={[
              { flex: 1, paddingVertical: 10, alignItems: "center", minHeight: 40 },
              activeTab === "closed" ? { backgroundColor: colors.primary } : undefined,
            ]}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: activeTab === "closed" ? "#fff" : colors.textSecondary,
              }}
            >
              Закрытые
            </Text>
          </Pressable>
        </View>

        {renderContent()}
      </DesktopScreen>

      {/* Undo toast: 5-sec window to revert the close */}
      <UndoToast
        message="Заявка удалена"
        visible={undoVisible}
        onUndo={handleUndo}
      />
    </SafeAreaView>
  );
}
