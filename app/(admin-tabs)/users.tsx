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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";


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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(
    async (q: string, role: RoleFilter, p: number, append = false) => {
      if (!token) return;
      if (p === 1) setLoading(true);
      else setLoadingMore(true);

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
        }
      } catch {
        // ignore
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
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Search header */}
      <View className="bg-blue-900 px-4 pb-3 pt-2">
        <TextInput
          accessibilityLabel="Поиск по email или имени"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            height: 40,
            paddingHorizontal: 14,
            color: colors.surface,
            fontSize: 15,
          }}
          placeholder="Поиск по email или имени..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Filter chips */}
      <View className="bg-white border-b border-slate-200 px-4 py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
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
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text
                className={`text-sm ${
                  filter === opt.key
                    ? "text-white font-medium"
                    : "text-slate-900"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
                <View className="items-center py-16">
                  <FontAwesome name="users" size={48} color={colors.placeholder} />
                  <Text className="text-base text-slate-400 mt-3">
                    Пользователи не найдены
                  </Text>
                </View>
              ) : (
                users.map((user) => (
                  <View key={user.id}>
                    <Pressable
                      accessibilityLabel={`${[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}`}
                      onPress={() =>
                        setExpandedId(expandedId === user.id ? null : user.id)
                      }
                      className="bg-white border-b border-slate-100 px-4 py-3"
                      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                    >
                      <View className="flex-row items-center">
                        {/* Avatar */}
                        <View className="w-8 h-8 rounded-full bg-blue-900 items-center justify-center mr-3">
                          <Text className="text-xs font-bold text-white">
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </Text>
                        </View>

                        {/* Name + email */}
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-sm font-medium text-slate-900"
                            numberOfLines={1}
                          >
                            {[user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") || "Без имени"}
                          </Text>
                          <Text
                            className="text-xs text-slate-400"
                            numberOfLines={1}
                          >
                            {user.email}
                          </Text>
                        </View>

                        {/* Badges */}
                        <View className="flex-row items-center gap-2">
                          {user.role && (
                            <View className="bg-slate-100 px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-slate-600">
                                {ROLE_LABELS[user.role] || user.role}
                              </Text>
                            </View>
                          )}
                          {user.isBanned && (
                            <View className="bg-red-600 px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-white font-medium">
                                Бан
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Date */}
                        <Text className="text-xs text-slate-400 ml-2">
                          {formatDate(user.createdAt)}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Expanded section */}
                    {expandedId === user.id && (
                      <View className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <Text className="text-xs text-slate-500 mb-1">
                          ID: {user.id}
                        </Text>
                        <Text className="text-xs text-slate-500 mb-1">
                          Email: {user.email}
                        </Text>
                        <Text className="text-xs text-slate-500 mb-1">
                          Роль: {user.role ? ROLE_LABELS[user.role] || user.role : "Не назначена"}
                        </Text>
                        <Text className="text-xs text-slate-500 mb-3">
                          Регистрация: {formatDate(user.createdAt)}
                        </Text>

                        <View className="flex-row gap-2 flex-wrap">
                          <Pressable
                            accessibilityLabel={user.isBanned ? "Разблокировать" : "Заблокировать"}
                            onPress={() => toggleBan(user)}
                            className={`px-3 py-2 rounded-lg ${
                              user.isBanned ? "bg-emerald-600" : "bg-red-600"
                            }`}
                            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                          >
                            <Text className="text-xs text-white font-medium">
                              {user.isBanned ? "Разблокировать" : "Заблокировать"}
                            </Text>
                          </Pressable>

                          {user.role === "CLIENT" && (
                            <Pressable
                              accessibilityLabel="Закрыть все заявки"
                              onPress={() => closeAllRequests(user)}
                              className="px-3 py-2 rounded-lg bg-amber-500"
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
