import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, Flag } from "lucide-react-native";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { API_URL } from "@/lib/api";


type StatusFilter = "ALL" | "NEW" | "REVIEWED";

interface ComplaintUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role?: string | null;
}

interface ComplaintItem {
  id: string;
  reporterId: string;
  targetUserId: string;
  text: string;
  status: "NEW" | "REVIEWED";
  createdAt: string;
  reviewedAt: string | null;
  reporter: ComplaintUser;
  targetUser: ComplaintUser;
}

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "NEW", label: "Новые" },
  { key: "REVIEWED", label: "Рассмотренные" },
];

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Клиент",
  SPECIALIST: "Специалист",
  ADMIN: "Админ",
};

function userName(user: ComplaintUser): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminComplaints() {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const filterRef = useRef<StatusFilter>("ALL");

  const fetchComplaints = useCallback(
    async (status: StatusFilter, p: number, append = false) => {
      if (!token) return;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);
      setError(false);

      try {
        const params = new URLSearchParams();
        if (status !== "ALL") params.set("status", status);
        params.set("page", String(p));
        params.set("limit", "20");

        const res = await fetch(`${API_URL}/api/admin/complaints?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setComplaints((prev) => (append ? [...prev, ...data.items] : data.items));
        setHasMore(data.hasMore);
      } catch {
        if (!append) setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    filterRef.current = filter;
    setPage(1);
    setExpandedId(null);
    fetchComplaints(filter, 1);
  }, [filter, fetchComplaints]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchComplaints(filterRef.current, next, true);
  };

  const markReviewed = (complaint: ComplaintItem) => {
    const doIt = async () => {
      setReviewingId(complaint.id);
      try {
        const res = await fetch(`${API_URL}/api/admin/complaints/${complaint.id}/review`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const updated = await res.json();
          setComplaints((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }
      } catch {
        // ignore
      } finally {
        setReviewingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Отметить жалобу как рассмотренную?`)) doIt();
    } else {
      Alert.alert("Подтверждение", "Отметить жалобу как рассмотренную?", [
        { text: "Отмена", style: "cancel" },
        { text: "Да", onPress: doIt },
      ]);
    }
  };

  const renderItem = ({ item }: { item: ComplaintItem }) => {
    const isExpanded = expandedId === item.id;
    const isReviewing = reviewingId === item.id;

    return (
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Жалоба от ${userName(item.reporter)}`}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          className="bg-white border-b border-border px-4 py-3"
        >
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 mr-3">
              <Text className="text-xs text-text-mute mb-0.5">
                От: <Text className="font-medium text-text-base">{userName(item.reporter)}</Text>
              </Text>
              <Text className="text-xs text-text-mute">
                На:{" "}
                <Text className="font-medium text-text-base">{userName(item.targetUser)}</Text>
                {item.targetUser.role ? (
                  <Text className="text-text-mute">
                    {" "}({ROLE_LABELS[item.targetUser.role] || item.targetUser.role})
                  </Text>
                ) : null}
              </Text>
            </View>
            <Badge
              variant={item.status === "NEW" ? "warning" : "success"}
              label={item.status === "NEW" ? "Новая" : "Рассмотрена"}
              size="sm"
            />
          </View>

          <Text className="text-sm text-text-base mt-1" numberOfLines={isExpanded ? undefined : 2}>
            {item.text}
          </Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-text-mute">{formatDate(item.createdAt)}</Text>
            {isExpanded
              ? <ChevronUp size={11} color={colors.placeholder} />
              : <ChevronDown size={11} color={colors.placeholder} />
            }
          </View>
        </Pressable>

        {isExpanded && (
          <View className="bg-surface2 px-4 py-3 border-b border-border">
            <Text className="text-xs text-text-mute mb-1">
              ID жалобы: <Text className="text-text-base">{item.id}</Text>
            </Text>
            <Text className="text-xs text-text-mute mb-1">
              Жалобщик: <Text className="text-text-base">{item.reporter.email}</Text>
            </Text>
            <Text className="text-xs text-text-mute mb-1">
              На пользователя: <Text className="text-text-base">{item.targetUser.email}</Text>
            </Text>
            {item.reviewedAt && (
              <Text className="text-xs text-text-mute mb-1">
                Рассмотрена: <Text className="text-text-base">{formatDate(item.reviewedAt)}</Text>
              </Text>
            )}
            <Text className="text-xs text-text-mute mb-3 mt-1">Текст жалобы:</Text>
            <Text className="text-sm text-text-base mb-3">{item.text}</Text>

            {item.status === "NEW" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Рассмотрено"
                onPress={() => markReviewed(item)}
                disabled={isReviewing}
                className={`px-3 py-2 rounded-lg self-start ${
                  isReviewing ? "bg-surface2" : "bg-success"
                }`}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text className="text-xs text-white font-medium">Рассмотрено</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {/* Header */}
      <View className="bg-accent px-4 h-14 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-white">Жалобы</Text>
      </View>

      {/* Filter tabs */}
      <View className="bg-white border-b border-border px-4 py-2 flex-row gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            accessibilityRole="button"
            key={opt.key}
            accessibilityLabel={opt.label}
            onPress={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === opt.key
                ? "bg-accent border-accent"
                : "bg-white border-border"
            }`}
          >
            <Text
              className={`text-sm ${
                filter === opt.key ? "text-white font-medium" : "text-text-base"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ResponsiveContainer>
          <LoadingState variant="skeleton" lines={5} />
          <LoadingState variant="skeleton" lines={5} />
        </ResponsiveContainer>
      ) : error ? (
        <ErrorState
          message="Не удалось загрузить жалобы"
          onRetry={() => fetchComplaints(filter, 1)}
        />
      ) : (
        <ResponsiveContainer>
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ flexGrow: 1 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <EmptyState
                icon={Flag}
                title="Жалоб нет"
                subtitle={
                  filter === "NEW"
                    ? "Нет новых жалоб"
                    : filter === "REVIEWED"
                    ? "Нет рассмотренных жалоб"
                    : "Жалобы пользователей появятся здесь"
                }
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        </ResponsiveContainer>
      )}
    </SafeAreaView>
  );
}
