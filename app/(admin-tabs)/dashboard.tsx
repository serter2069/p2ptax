import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors, overlay } from "@/lib/theme";


interface Stats {
  activeRequests: number;
  newUsersWeek: number;
  newUsersMonth: number;
  threadsWeek: number;
  threadsMonth: number;
  conversion: number;
  topCities: { name: string; count: number }[];
  topSpecialists: { name: string; count: number }[];
}

function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string | number;
  onPress?: () => void;
}) {
  const content = (
    <View
      className="bg-white border border-border rounded-2xl p-5 flex-1"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Text className="text-4xl font-extrabold text-text-base">{value}</Text>
      <Text className="text-sm text-text-mute mt-1.5">{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
          { flex: 1 },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

function RankList({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number }[];
}) {
  return (
    <View
      className="bg-white border border-border rounded-2xl p-5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Text className="text-base font-bold text-text-base mb-3">{title}</Text>
      {items.length === 0 ? (
        <Text className="text-sm text-text-mute">Нет данных</Text>
      ) : (
        items.map((item, i) => (
          <View
            key={`${item.name}-${i}`}
            className="flex-row items-center justify-between py-2 border-b border-border"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Text className="text-sm text-text-mute w-6">{i + 1}.</Text>
              <Text className="text-sm text-text-base flex-1" numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-accent">{item.count}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <HeaderHome
        onSettingsPress={() => router.push("/admin/settings" as never)}
      />
      {loading ? (
        <ScrollView className="flex-1">
          <ResponsiveContainer>
            <View className="py-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="bg-white rounded-xl overflow-hidden border border-border">
                  <LoadingState variant="skeleton" lines={3} />
                </View>
              ))}
            </View>
          </ResponsiveContainer>
        </ScrollView>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <ErrorState message="Не удалось загрузить статистику" onRetry={fetchStats} />
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Accent hero section */}
          <View className="bg-accent px-4 pt-5 pb-6">
            <ResponsiveContainer>
              <Text className="text-2xl font-bold text-white">
                Панель администратора
              </Text>
              <Text
                className="text-sm mt-1"
                style={{ color: overlay.white75 }}
              >
                Обзор ключевых метрик платформы
              </Text>
            </ResponsiveContainer>
          </View>

          <ResponsiveContainer>
            <View className="py-4 gap-3">
              {/* Stats grid */}
              <View className="flex-row flex-wrap gap-3">
                <View className="w-full">
                  <StatCard
                    label="Активные заявки"
                    value={stats?.activeRequests ?? 0}
                    onPress={() =>
                      router.push("/(admin-tabs)/moderation" as never)
                    }
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <StatCard
                    label="Новые пользователи (неделя)"
                    value={stats?.newUsersWeek ?? 0}
                  />
                </View>
                <View className="flex-1">
                  <StatCard
                    label="Новые пользователи (месяц)"
                    value={stats?.newUsersMonth ?? 0}
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <StatCard
                    label="Диалоги (неделя)"
                    value={stats?.threadsWeek ?? 0}
                  />
                </View>
                <View className="flex-1">
                  <StatCard
                    label="Диалоги (месяц)"
                    value={stats?.threadsMonth ?? 0}
                  />
                </View>
              </View>

              <StatCard
                label="Конверсия: заявка → диалог"
                value={`${stats?.conversion ?? 0}%`}
              />

              {/* Top lists — side by side on desktop */}
              <View className={isDesktop ? "flex-row gap-3" : "gap-3"}>
                <View className={isDesktop ? "flex-1" : undefined}>
                  <RankList
                    title="Топ городов"
                    items={stats?.topCities ?? []}
                  />
                </View>
                <View className={isDesktop ? "flex-1" : undefined}>
                  <RankList
                    title="Топ специалистов"
                    items={stats?.topSpecialists ?? []}
                  />
                </View>
              </View>
            </View>
          </ResponsiveContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
