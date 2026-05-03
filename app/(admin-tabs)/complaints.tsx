import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, Flag } from "lucide-react-native";
import { dialog } from "@/lib/dialog";
import DesktopScreen from "@/components/layout/DesktopScreen";
import Card from "@/components/ui/Card";
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
        const res = await fetch(`${API_URL}/api/admin/complaints/${complaint.id}/resolve`, {
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

    void (async () => {
      const ok = await dialog.confirm({
        title: "Подтверждение",
        message: "Отметить жалобу как рассмотренную?",
        confirmLabel: "Да",
      });
      if (ok) doIt();
    })();
  };

  const renderItem = ({ item }: { item: ComplaintItem }) => {
    const isExpanded = expandedId === item.id;
    const isReviewing = reviewingId === item.id;

    return (
      <Card
        className="mb-3"
        padding="none"
        style={{
          overflow: "hidden",
          borderLeftWidth: 3,
          borderLeftColor: item.status === "NEW" ? colors.warning : colors.success,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Жалоба от ${userName(item.reporter)}`}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          className="bg-white px-4 py-3 min-h-[44px] gap-2"
        >
          {/*
            Audit fix: previously had mb-1 on header row, mt-1 on body, mt-2
            on footer — three different rhythms in one card. Parent now uses
            `gap-2` (8px) and the meta stack inside the header uses `gap-0.5`
            (2px) for the dense reporter/target lines.
          */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3 gap-0.5">
              <Text className="text-xs text-text-mute">
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

          <Text className="text-sm text-text-base" numberOfLines={isExpanded ? undefined : 2}>
            {item.text}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-text-mute">{formatDate(item.createdAt)}</Text>
            {isExpanded
              ? <ChevronUp size={11} color={colors.placeholder} />
              : <ChevronDown size={11} color={colors.placeholder} />
            }
          </View>
        </Pressable>

        {isExpanded && (
          // Audit fix: expanded panel previously mixed mb-1/mb-2/mt-1 on
          // sibling Text rows and mb-3/mt-3 on container — auditors flagged
          // inconsistent vertical rhythm. Parent now drives spacing via
          // `gap-3` (12px) for the outer block and `gap-1` (4px) inside the
          // metadata stack. No per-child margins.
          <View className="border-t border-border p-3 gap-3">
            <View className="bg-surface2 p-3 rounded-xl gap-1">
              <Text className="text-xs text-text-mute">
                ID жалобы: <Text className="text-text-base">{item.id}</Text>
              </Text>
              <Text className="text-xs text-text-mute">
                Жалобщик: <Text className="text-text-base">{item.reporter.email}</Text>
              </Text>
              <Text className="text-xs text-text-mute">
                На пользователя: <Text className="text-text-base">{item.targetUser.email}</Text>
              </Text>
              {item.reviewedAt && (
                <Text className="text-xs text-text-mute">
                  Рассмотрена: <Text className="text-text-base">{formatDate(item.reviewedAt)}</Text>
                </Text>
              )}
              <Text className="text-xs text-text-mute">Текст жалобы:</Text>
              <Text className="text-sm text-text-base">{item.text}</Text>
            </View>

            {item.status === "NEW" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Рассмотрено"
                onPress={() => markReviewed(item)}
                disabled={isReviewing}
                className={`rounded-xl h-11 items-center justify-center ${
                  isReviewing ? "bg-surface2" : "bg-success"
                }`}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text className="text-sm text-white font-semibold">Рассмотрено</Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </Card>
    );
  };

  const filterBar = (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {FILTER_OPTIONS.map((opt) => (
        <Pressable
          accessibilityRole="button"
          key={opt.key}
          accessibilityLabel={opt.label}
          onPress={() => setFilter(opt.key)}
          className={`px-3 py-1.5 rounded-full border min-h-[44px] justify-center ${
            filter === opt.key
              ? "bg-accent border-accent"
              : "bg-surface2 border-border"
          }`}
        >
          <Text
            className={`text-sm ${
              filter === opt.key ? "text-white font-medium" : "text-text-mute"
            }`}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {loading ? (
        <DesktopScreen
          title="Жалобы"
          subtitle="Управление жалобами пользователей"
          filters={filterBar}
        >
          <LoadingState variant="skeleton" lines={5} />
          <LoadingState variant="skeleton" lines={5} />
        </DesktopScreen>
      ) : error ? (
        <DesktopScreen
          title="Жалобы"
          subtitle="Управление жалобами пользователей"
          filters={filterBar}
        >
          <ErrorState
            message="Не удалось загрузить жалобы"
            onRetry={() => fetchComplaints(filter, 1)}
          />
        </DesktopScreen>
      ) : (
        <DesktopScreen
          title="Жалобы"
          subtitle="Управление жалобами пользователей"
          filters={filterBar}
        >
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ flexGrow: 1, paddingVertical: 8 }}
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
        </DesktopScreen>
      )}
    </SafeAreaView>
  );
}
