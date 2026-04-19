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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
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

function StatusBadge({ status }: { status: "NEW" | "REVIEWED" }) {
  if (status === "NEW") {
    return (
      <View className="bg-amber-50 px-2 py-0.5 rounded-lg flex-row items-center">
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#b45309", marginRight: 5 }}
        />
        <Text className="text-xs font-medium text-amber-700">Новая</Text>
      </View>
    );
  }
  return (
    <View className="bg-emerald-50 px-2 py-0.5 rounded-lg flex-row items-center">
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 5 }}
      />
      <Text className="text-xs font-medium text-emerald-700">Рассмотрена</Text>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View className="bg-white border-b border-slate-100 px-4 py-4">
      <View className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
      <View className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
      <View className="h-3 bg-slate-200 rounded w-1/2" />
    </View>
  );
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
          accessibilityLabel={`Жалоба от ${userName(item.reporter)}`}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          className="bg-white border-b border-slate-100 px-4 py-3"
        >
          <View className="flex-row items-start justify-between mb-1">
            <View className="flex-1 mr-3">
              <Text className="text-xs text-slate-500 mb-0.5">
                От: <Text className="font-medium text-slate-900">{userName(item.reporter)}</Text>
              </Text>
              <Text className="text-xs text-slate-500">
                На:{" "}
                <Text className="font-medium text-slate-900">{userName(item.targetUser)}</Text>
                {item.targetUser.role ? (
                  <Text className="text-slate-400">
                    {" "}({ROLE_LABELS[item.targetUser.role] || item.targetUser.role})
                  </Text>
                ) : null}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>

          <Text className="text-sm text-slate-700 mt-1" numberOfLines={isExpanded ? undefined : 2}>
            {item.text}
          </Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-slate-400">{formatDate(item.createdAt)}</Text>
            <FontAwesome
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={11}
              color="#94a3b8"
            />
          </View>
        </Pressable>

        {isExpanded && (
          <View className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <Text className="text-xs text-slate-500 mb-1">
              ID жалобы: <Text className="text-slate-700">{item.id}</Text>
            </Text>
            <Text className="text-xs text-slate-500 mb-1">
              Жалобщик: <Text className="text-slate-700">{item.reporter.email}</Text>
            </Text>
            <Text className="text-xs text-slate-500 mb-1">
              На пользователя: <Text className="text-slate-700">{item.targetUser.email}</Text>
            </Text>
            {item.reviewedAt && (
              <Text className="text-xs text-slate-500 mb-1">
                Рассмотрена: <Text className="text-slate-700">{formatDate(item.reviewedAt)}</Text>
              </Text>
            )}
            <Text className="text-xs text-slate-500 mb-3 mt-1">Текст жалобы:</Text>
            <Text className="text-sm text-slate-800 mb-3">{item.text}</Text>

            {item.status === "NEW" && (
              <Pressable
                accessibilityLabel="Рассмотрено"
                onPress={() => markReviewed(item)}
                disabled={isReviewing}
                className={`px-3 py-2 rounded-lg self-start ${
                  isReviewing ? "bg-slate-300" : "bg-emerald-600"
                }`}
              >
                {isReviewing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="bg-blue-900 px-4 h-14 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-white">Жалобы</Text>
      </View>

      {/* Filter tabs */}
      <View className="bg-white border-b border-slate-200 px-4 py-2 flex-row gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            accessibilityLabel={opt.label}
            onPress={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full border ${
              filter === opt.key
                ? "bg-blue-900 border-blue-900"
                : "bg-white border-slate-200"
            }`}
          >
            <Text
              className={`text-sm ${
                filter === opt.key ? "text-white font-medium" : "text-slate-900"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ResponsiveContainer>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </ResponsiveContainer>
      ) : error ? (
        <View className="flex-1 items-center justify-center py-12 px-8">
          <View
            className="items-center justify-center rounded-full bg-red-50"
            style={{ width: 72, height: 72 }}
          >
            <FontAwesome name="exclamation-circle" size={32} color={colors.error} />
          </View>
          <Text className="text-base font-medium text-slate-900 mt-4 text-center">
            Не удалось загрузить жалобы
          </Text>
          <Pressable
            accessibilityLabel="Повторить"
            onPress={() => fetchComplaints(filter, 1)}
            className="mt-4 px-4 py-2 rounded-lg border border-slate-300 bg-white"
          >
            <Text className="text-sm text-slate-700">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ flexGrow: 1 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <View
                className="items-center justify-center rounded-full bg-slate-100"
                style={{ width: 72, height: 72 }}
              >
                <FontAwesome name="flag-o" size={32} color="#94a3b8" />
              </View>
              <Text className="text-base font-semibold text-slate-900 mt-4 text-center">
                Жалоб нет
              </Text>
              <Text className="text-sm text-slate-500 mt-2 text-center">
                {filter === "NEW"
                  ? "Нет новых жалоб"
                  : filter === "REVIEWED"
                  ? "Нет рассмотренных жалоб"
                  : "Жалобы пользователей появятся здесь"}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#1e3a8a" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
