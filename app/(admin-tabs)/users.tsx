import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef } from "react";
import { Users } from "lucide-react-native";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors, radiusValue } from "@/lib/theme";


type RoleFilter = "ALL" | "CLIENT" | "SPECIALIST" | "BANNED";

interface UserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isBanned: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Клиент",
  SPECIALIST: "Специалист",
  ADMIN: "Админ",
};

const FILTER_OPTIONS: { key: RoleFilter; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "CLIENT", label: "Клиенты" },
  { key: "SPECIALIST", label: "Специалисты" },
  { key: "BANNED", label: "Заблокированные" },
];

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(
    async (q: string, role: RoleFilter, p: number, append = false) => {
      if (!token) return;
      if (p === 1) {
        setLoading(true);
        setError(false);
      } else setLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (role !== "ALL") params.set("role", role);
        params.set("page", String(p));
        params.set("limit", "20");

        const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers((prev) => (append ? [...prev, ...data.items] : data.items));
          setHasMore(data.hasMore);
        } else if (p === 1) {
          setError(true);
        }
      } catch {
        if (p === 1) setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setExpandedId(null);
      fetchUsers(search, filter, 1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, filter, fetchUsers]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setPage(next);
    fetchUsers(search, filter, next, true);
  };

  const toggleBan = async (user: UserItem) => {
    const action = user.isBanned ? "разблокировать" : "заблокировать";
    const doIt = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isBanned: !user.isBanned }),
        });
        if (res.ok) {
          const updated = await res.json();
          setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
          );
        }
      } catch {
        // ignore
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Вы уверены, что хотите ${action} пользователя ${user.email}?`)) {
        await doIt();
      }
    } else {
      Alert.alert("Подтверждение", `${action} пользователя ${user.email}?`, [
        { text: "Отмена", style: "cancel" },
        { text: "Да", onPress: doIt },
      ]);
    }
  };

  const closeAllRequests = async (user: UserItem) => {
    const doIt = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/admin/users/${user.id}/close-all-requests`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (Platform.OS === "web") {
            window.alert(`Закрыто заявок: ${data.closed}`);
          } else {
            Alert.alert("Готово", `Закрыто заявок: ${data.closed}`);
          }
        }
      } catch {
        // ignore
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Закрыть все активные заявки пользователя ${user.email}?`)) {
        await doIt();
      }
    } else {
      Alert.alert(
        "Подтверждение",
        `Закрыть все активные заявки ${user.email}?`,
        [
          { text: "Отмена", style: "cancel" },
          { text: "Да", onPress: doIt },
        ]
      );
    }
  };

  const isCloseToBottom = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {/* Search header */}
      <View className="bg-accent px-4 pb-3 pt-2">
        <TextInput
          accessibilityLabel="Поиск по email или имени"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: radiusValue.md,
            height: 40,
            paddingHorizontal: 14,
            color: colors.surface,
            fontSize: 15,
            outlineWidth: 0,
          }}
          placeholder="Поиск по email или имени..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Filter chips */}
      <View className="bg-white border-b border-border px-4 py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
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
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text
                className={`text-sm ${
                  filter === opt.key
                    ? "text-white font-medium"
                    : "text-text-base"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ResponsiveContainer>
          <View className="py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden border border-border">
                <LoadingState variant="skeleton" lines={4} />
              </View>
            ))}
          </View>
        </ResponsiveContainer>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <ErrorState message="Не удалось загрузить пользователей" onRetry={() => fetchUsers(search, filter, 1)} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          onScroll={(e) => {
            if (isCloseToBottom(e)) loadMore();
          }}
          scrollEventThrottle={400}
        >
          <ResponsiveContainer>
            <View className="py-2">
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Пользователи не найдены"
                  subtitle="Попробуйте изменить фильтры или поисковый запрос"
                />
              ) : (
                users.map((user) => (
                  <View key={user.id}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}`}
                      onPress={() =>
                        setExpandedId(expandedId === user.id ? null : user.id)
                      }
                      className="bg-white border-b border-border px-4 py-3"
                      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                    >
                      <View className="flex-row items-center">
                        {/* Avatar */}
                        <View className="w-8 h-8 rounded-full bg-accent items-center justify-center mr-3">
                          <Text className="text-xs font-bold text-white">
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </Text>
                        </View>

                        {/* Name + email */}
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-sm font-medium text-text-base"
                            numberOfLines={1}
                          >
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || "Без имени"}
                          </Text>
                          <Text
                            className="text-xs text-text-mute"
                            numberOfLines={1}
                          >
                            {user.email}
                          </Text>
                        </View>

                        {/* Badges */}
                        <View className="flex-row items-center gap-2">
                          {user.role && (
                            <View className="bg-surface2 px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-text-mute">
                                {ROLE_LABELS[user.role] || user.role}
                              </Text>
                            </View>
                          )}
                          {user.isBanned && (
                            <View className="bg-danger px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-white font-medium">
                                Бан
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Date */}
                        <Text className="text-xs text-text-mute ml-2">
                          {formatDate(user.createdAt)}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Expanded section */}
                    {expandedId === user.id && (
                      <View className="bg-surface2 px-4 py-3 border-b border-border">
                        <Text className="text-xs text-text-mute mb-1">
                          ID: {user.id}
                        </Text>
                        <Text className="text-xs text-text-mute mb-1">
                          Email: {user.email}
                        </Text>
                        <Text className="text-xs text-text-mute mb-1">
                          Роль: {user.role ? ROLE_LABELS[user.role] || user.role : "Не назначена"}
                        </Text>
                        <Text className="text-xs text-text-mute mb-3">
                          Регистрация: {formatDate(user.createdAt)}
                        </Text>

                        <View className="flex-row gap-2 flex-wrap">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={user.isBanned ? "Разблокировать" : "Заблокировать"}
                            onPress={() => toggleBan(user)}
                            className={`px-3 py-2 rounded-lg ${
                              user.isBanned ? "bg-success" : "bg-danger"
                            }`}
                            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                          >
                            <Text className="text-xs text-white font-medium">
                              {user.isBanned ? "Разблокировать" : "Заблокировать"}
                            </Text>
                          </Pressable>

                          {user.role === "CLIENT" && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Закрыть все заявки"
                              onPress={() => closeAllRequests(user)}
                              className="px-3 py-2 rounded-lg bg-warning"
                              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                            >
                              <Text className="text-xs text-white font-medium">
                                Закрыть все заявки
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}

              {loadingMore && (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </View>
          </ResponsiveContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
