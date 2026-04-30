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
import DesktopScreen from "@/components/layout/DesktopScreen";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors, fontSizeValue } from "@/lib/theme";


/**
 * Iter11 PR 3 — admin filter tokens sent to `/api/admin/users?role=…`.
 * The backend still accepts the legacy labels and maps them onto
 * `{ role: "USER", isSpecialist: true/false }` server-side, so we keep
 * the human-readable token names here (they are NOT role enum values in
 * the Prisma sense — just filter identifiers).
 */
type RoleFilter = "ALL" | "CLIENT" | "SPECIALIST" | "BANNED";

interface UserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  /** Iter11 PR 3 — specialist opt-in flag returned by /api/admin/users. */
  isSpecialist?: boolean;
  isBanned: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

/**
 * Iter11 PR 3 — backend returns role=USER | ADMIN now. Specialist/client
 * distinction is derived from the `isSpecialist` flag on USER rows.
 */
function displayRoleLabel(role: string | null, isSpecialist?: boolean): string {
  if (role === "ADMIN") return "Админ";
  if (role === "USER") return isSpecialist ? "Специалист" : "Клиент";
  return role ?? "";
}

const FILTER_OPTIONS: { key: RoleFilter; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: "CLIENT", label: "Клиенты" },
  { key: "SPECIALIST", label: "Специалисты" },
  { key: "BANNED", label: "Заблокированные" },
];

const cardShadow = {
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

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

  const filterBar = (
    <View style={{ gap: 12 }}>
      {/* Line-style search — bottom border only, no box */}
      <View
        style={{
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderStrong,
          height: 44,
          paddingHorizontal: 0,
          paddingBottom: 2,
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <TextInput
          accessibilityLabel="Поиск по email или имени"
          style={{
            flex: 1,
            color: colors.text,
            fontSize: fontSizeValue.md,
            borderWidth: 0,
            backgroundColor: "transparent",
            ...(Platform.OS === "web" ? {
              borderColor: "transparent",
              outlineStyle: "none" as never,
              outlineWidth: 0,
              appearance: "none" as never,
            } : {}),
          }}
          placeholder="Поиск по email или имени..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>
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
            className={`px-3 rounded-full border active:opacity-70 ${
              filter === opt.key
                ? "bg-accent border-accent"
                : "bg-surface2 border-border"
            }`}
            style={{ minHeight: 36, justifyContent: "center" }}
          >
            <Text
              className={`text-sm ${
                filter === opt.key
                  ? "text-white font-medium"
                  : "text-text-mute"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      {loading ? (
        <DesktopScreen
          title="Пользователи"
          subtitle="Управление аккаунтами платформы"
          filters={filterBar}
        >
          <View className="py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} className="mb-3 bg-white rounded-2xl overflow-hidden border border-border">
                <LoadingState variant="skeleton" lines={4} />
              </View>
            ))}
          </View>
        </DesktopScreen>
      ) : error ? (
        <DesktopScreen
          title="Пользователи"
          subtitle="Управление аккаунтами платформы"
          filters={filterBar}
        >
          <ErrorState message="Не удалось загрузить пользователей" onRetry={() => fetchUsers(search, filter, 1)} />
        </DesktopScreen>
      ) : (
        <ScrollView
          className="flex-1"
          onScroll={(e) => {
            if (isCloseToBottom(e)) loadMore();
          }}
          scrollEventThrottle={400}
        >
          <DesktopScreen
            title="Пользователи"
            subtitle="Управление аккаунтами платформы"
            filters={filterBar}
          >
            <View className="py-2">
              {users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Пользователи не найдены"
                  subtitle="Попробуйте изменить фильтры или поисковый запрос"
                />
              ) : (
                users.map((user) => (
                  <View key={user.id} className="mb-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}`}
                      onPress={() =>
                        setExpandedId(expandedId === user.id ? null : user.id)
                      }
                      className="bg-white border border-border rounded-xl p-4 active:opacity-70"
                      style={cardShadow}
                    >
                      <View className="flex-row items-center">
                        {/* Avatar initials chip */}
                        <View className="bg-accent-soft rounded-full w-11 h-11 items-center justify-center mr-3">
                          <Text className="text-accent font-bold text-base">
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </Text>
                        </View>

                        {/* Name + email */}
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-base font-semibold text-text-base"
                            numberOfLines={1}
                          >
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || "Без имени"}
                          </Text>
                          <Text
                            className="text-sm text-text-mute"
                            numberOfLines={1}
                          >
                            {user.email}
                          </Text>
                        </View>

                        {/* Badges */}
                        <View className="flex-row items-center gap-2">
                          {user.role && (
                            <View className="bg-accent-soft rounded-full px-2.5 py-0.5">
                              <Text className="text-xs font-medium text-accent">
                                {displayRoleLabel(user.role, user.isSpecialist)}
                              </Text>
                            </View>
                          )}
                          {user.isBanned && (
                            <View className="bg-danger-soft rounded-full px-2.5 py-0.5">
                              <Text className="text-xs text-danger font-medium">
                                Бан
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>

                    {/* Expanded section */}
                    {expandedId === user.id && (
                      <View className="bg-surface2 px-4 py-3 border border-t-0 border-border rounded-b-xl">
                        <Text className="text-xs text-text-mute mb-1">
                          ID: {user.id}
                        </Text>
                        <Text className="text-xs text-text-mute mb-1">
                          Email: {user.email}
                        </Text>
                        <Text className="text-xs text-text-mute mb-1">
                          Роль: {user.role ? displayRoleLabel(user.role, user.isSpecialist) : "Не назначена"}
                        </Text>
                        <Text className="text-xs text-text-mute mb-3">
                          Регистрация: {formatDate(user.createdAt)}
                        </Text>

                        <View className="flex-row gap-2 flex-wrap">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={user.isBanned ? "Разблокировать" : "Заблокировать"}
                            onPress={() => toggleBan(user)}
                            className={`px-3 rounded-lg active:opacity-70 ${
                              user.isBanned ? "bg-success" : "bg-danger"
                            }`}
                            style={{ minHeight: 44, justifyContent: "center" }}
                          >
                            <Text className="text-xs text-white font-medium">
                              {user.isBanned ? "Разблокировать" : "Заблокировать"}
                            </Text>
                          </Pressable>

                          {user.role !== "ADMIN" && !user.isSpecialist && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Закрыть все заявки"
                              onPress={() => closeAllRequests(user)}
                              className="px-3 rounded-lg bg-warning active:opacity-70"
                              style={{ minHeight: 36, justifyContent: "center" }}
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
          </DesktopScreen>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
