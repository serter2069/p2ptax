import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HeaderHome from "@/components/HeaderHome";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";
import { colors } from "@/lib/theme";


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
    <View className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <Text className="text-2xl font-bold text-slate-900">{value}</Text>
      <Text className="text-sm text-slate-500 mt-1">{label}</Text>
    </View>
  );

  if (onPress) {
    return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}>{content}</Pressable>;
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
    <View className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <Text className="text-base font-semibold text-slate-900 mb-3">{title}</Text>
      {items.length === 0 ? (
        <Text className="text-sm text-slate-400">Нет данных</Text>
      ) : (
        items.map((item, i) => (
          <View
            key={`${item.name}-${i}`}
            className="flex-row items-center justify-between py-2 border-b border-slate-100"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <Text className="text-sm text-slate-400 w-6">{i + 1}.</Text>
              <Text className="text-sm text-slate-900 flex-1" numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-blue-900">{item.count}</Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <HeaderHome
        onSettingsPress={() => router.push("/admin/settings" as never)}
      />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView className="flex-1">
          <ResponsiveContainer>
            <View className="py-4 gap-3">
              <Text className="text-lg font-bold text-slate-900 mb-1">
                Панель администратора
              </Text>

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

              {/* Top cities */}
              <RankList
                title="Топ городов"
                items={stats?.topCities ?? []}
              />

              {/* Top specialists */}
              <RankList
                title="Топ специалистов"
                items={stats?.topSpecialists ?? []}
              />
            </View>
          </ResponsiveContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
