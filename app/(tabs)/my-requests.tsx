import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { BREAKPOINT } from "@/lib/theme";
import DesktopScreen from "@/components/layout/DesktopScreen";
import PageTitle from "@/components/layout/PageTitle";
import { FileText } from "lucide-react-native";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import { api } from "@/lib/api";
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

// ── Request card ───────────────────────────────────────────────────────

interface RequestCardProps {
  item: RequestItem;
  onPress: (id: string) => void;
}

function RequestCard({ item, onPress }: RequestCardProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View className="mb-3 mx-4 rounded-2xl overflow-hidden">
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
        {/* Title */}
        <Text
          className="text-base font-semibold text-text-base mb-1"
          numberOfLines={2}
        >
          {item.title}
        </Text>

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
      </Pressable>
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
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

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

  const handleRequestPress = useCallback(
    (id: string) => {
      nav.dynamic.requestDetail(id);
    },
    [nav]
  );

  const renderItem = useCallback(
    ({ item }: { item: RequestItem }) => (
      <RequestCard item={item} onPress={handleRequestPress} />
    ),
    [handleRequestPress]
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
      <PageTitle title="Мои заявки" />
      <DesktopScreen>
        <View className="flex-row items-center justify-between mb-4">
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
    </SafeAreaView>
  );
}
