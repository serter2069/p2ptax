import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import SpecialistCard from "@/components/SpecialistCard";
import StatusBadge from "@/components/StatusBadge";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { colors } from "@/lib/theme";

interface FeaturedSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}

interface RecentRequest {
  id: string;
  title: string | null;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
}

interface PlatformStats {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
}

const CLIENT_STEPS = [
  {
    number: "1",
    title: "Создайте заявку",
    description: "Укажите город, инспекцию и тип проверки. Опишите ситуацию.",
  },
  {
    number: "2",
    title: "Получите отклики",
    description: "Специалисты из вашего города увидят заявку и напишут первыми.",
  },
  {
    number: "3",
    title: "Выберите специалиста",
    description: "Общайтесь в чате, сравнивайте подходы, доверяйте тому, кто подошёл.",
  },
];

const SPECIALIST_STEPS = [
  {
    number: "1",
    title: "Зарегистрируйтесь",
    description: "Укажите специализацию, опыт и города, в которых работаете.",
  },
  {
    number: "2",
    title: "Получайте заявки",
    description: "Система подбирает заявки клиентов под ваш профиль и регион.",
  },
  {
    number: "3",
    title: "Помогайте клиентам",
    description: "Открывайте диалог, консультируйте и получайте новых клиентов.",
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const scrollViewRef = useRef<ScrollView>(null);

  const [featured, setFeatured] = useState<FeaturedSpecialist[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.role === "SPECIALIST") {
        router.replace("/specialist/dashboard" as never);
      } else if (user.role === "CLIENT") {
        router.replace("/requests" as never);
      } else if (user.role === "ADMIN") {
        router.replace("/admin/users" as never);
      }
    }
  }, [isAuthenticated, user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [featuredRes, requestsRes, statsRes] = await Promise.all([
        api<{ items: FeaturedSpecialist[] }>("/api/specialists/featured", {
          noAuth: true,
        }),
        api<{ items: RecentRequest[] }>("/api/requests/public?limit=3", {
          noAuth: true,
        }),
        api<PlatformStats>("/api/stats", { noAuth: true }),
      ]);
      setFeatured(featuredRes.items.slice(0, 3));
      setRecentRequests(requestsRes.items.slice(0, 3));
      setStats(statsRes);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSpecialistPress = useCallback(
    (id: string) => {
      router.push(`/specialists/${id}` as never);
    },
    [router]
  );

  const containerStyle = isDesktop
    ? { maxWidth: 520, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  const wideContainerStyle = isDesktop
    ? { maxWidth: 900, width: "100%" as const, alignSelf: "center" as const }
    : undefined;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
          <Text className="text-lg font-bold text-white">P2PTax</Text>
        </View>
        <ErrorState
          message="Не удалось загрузить данные. Проверьте соединение с интернетом и попробуйте снова."
          onRetry={loadData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between h-14 bg-blue-900 px-4">
        <Text className="text-lg font-bold text-white">P2PTax</Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Войти"
            onPress={() => router.push("/auth/email" as never)}
            className="bg-white/20 rounded-lg px-4 min-h-[44px] items-center justify-center"
          >
            <Text className="text-white font-medium text-sm">Войти</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ─── HERO ─── */}
        <View className="bg-blue-900 pt-12 pb-14 px-4">
          <View style={containerStyle}>
            <Text className="text-2xl font-bold text-white text-center leading-8">
              Налоговая помощь рядом
            </Text>
            <Text className="text-sm text-blue-200 text-center mt-3 leading-5">
              Найдите специалиста по P2P и криптовалютным операциям в вашем городе
            </Text>

            {/* Two CTAs */}
            <View
              className="mt-8 gap-3"
              style={isDesktop ? { flexDirection: "row", justifyContent: "center" } : undefined}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Найти специалиста"
                onPress={() => router.push("/specialists" as never)}
                className="bg-amber-700 rounded-xl h-12 items-center justify-center"
                style={isDesktop ? { width: 200 } : undefined}
              >
                <Text className="text-white font-semibold text-base">
                  Найти специалиста
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Я специалист"
                onPress={() => router.push("/auth/email" as never)}
                className="border border-white/30 rounded-xl h-12 items-center justify-center"
                style={[
                  { backgroundColor: "rgba(255,255,255,0.12)" },
                  isDesktop ? { width: 200 } : undefined,
                ]}
              >
                <Text className="text-white font-semibold text-base">
                  Я специалист
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ─── STATS ─── */}
        {stats && (
          <View className="bg-slate-900 py-8 px-4">
            <View
              style={wideContainerStyle}
              className="flex-row justify-around"
            >
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">
                  {stats.specialistsCount}+
                </Text>
                <Text className="text-xs text-slate-400 mt-1 text-center">
                  специалистов
                </Text>
              </View>
              <View
                style={{ width: 1, backgroundColor: colors.textMuted, marginHorizontal: 8 }}
              />
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">
                  {stats.citiesCount}
                </Text>
                <Text className="text-xs text-slate-400 mt-1 text-center">
                  городов
                </Text>
              </View>
              <View
                style={{ width: 1, backgroundColor: colors.textMuted, marginHorizontal: 8 }}
              />
              <View className="items-center">
                <Text className="text-2xl font-bold text-white">
                  {stats.consultationsCount}+
                </Text>
                <Text className="text-xs text-slate-400 mt-1 text-center">
                  консультаций
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── HOW IT WORKS ─── */}
        <View className="py-10 px-4 bg-white">
          <View style={containerStyle}>
            <Text className="text-xl font-semibold text-slate-900 text-center mb-8">
              Как это работает
            </Text>

            {/* For clients */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4">
                <View className="w-7 h-7 rounded-full bg-blue-900/10 items-center justify-center mr-2">
                  <FontAwesome name="user" size={13} color={colors.primary} />
                </View>
                <Text className="text-base font-semibold text-slate-900">
                  Для клиентов
                </Text>
              </View>
              <View className={isDesktop ? "flex-row gap-4" : ""}>
                {CLIENT_STEPS.map((s) => (
                  <View
                    key={s.number}
                    className={`items-center ${isDesktop ? "flex-1" : "mb-5"}`}
                  >
                    <View className="w-10 h-10 rounded-full bg-blue-900 items-center justify-center mb-3">
                      <Text className="text-white font-bold text-base">{s.number}</Text>
                    </View>
                    <Text className="text-sm font-semibold text-slate-900 text-center mb-1">
                      {s.title}
                    </Text>
                    <Text className="text-sm text-slate-500 text-center leading-5">
                      {s.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Divider */}
            <View className="border-t border-slate-100 mb-8" />

            {/* For specialists */}
            <View>
              <View className="flex-row items-center mb-4">
                <View className="w-7 h-7 rounded-full bg-amber-700/10 items-center justify-center mr-2">
                  <FontAwesome name="briefcase" size={13} color={colors.accent} />
                </View>
                <Text className="text-base font-semibold text-slate-900">
                  Для специалистов
                </Text>
              </View>
              <View className={isDesktop ? "flex-row gap-4" : ""}>
                {SPECIALIST_STEPS.map((s) => (
                  <View
                    key={s.number}
                    className={`items-center ${isDesktop ? "flex-1" : "mb-5"}`}
                  >
                    <View className="w-10 h-10 rounded-full bg-amber-700 items-center justify-center mb-3">
                      <Text className="text-white font-bold text-base">{s.number}</Text>
                    </View>
                    <Text className="text-sm font-semibold text-slate-900 text-center mb-1">
                      {s.title}
                    </Text>
                    <Text className="text-sm text-slate-500 text-center leading-5">
                      {s.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ─── FEATURED SPECIALISTS ─── */}
        {featured.length > 0 && (
          <View className="py-10 px-4 bg-slate-50">
            <View style={containerStyle}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-slate-900">
                  Специалисты
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Все специалисты"
                  onPress={() => router.push("/specialists" as never)}
                >
                  <Text className="text-sm font-medium text-blue-900">
                    Все →
                  </Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featured.map((s) => (
                  <SpecialistCard
                    key={s.id}
                    id={s.id}
                    firstName={s.firstName}
                    lastName={s.lastName}
                    avatarUrl={s.avatarUrl}
                    services={s.services}
                    cities={s.cities}
                    onPress={handleSpecialistPress}
                    horizontal
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ─── RECENT REQUESTS ─── */}
        {recentRequests.length > 0 && (
          <View className="py-10 px-4 bg-white">
            <View style={containerStyle}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-slate-900">
                  Свежие заявки
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Все заявки"
                  onPress={() => router.push("/requests" as never)}
                >
                  <Text className="text-sm font-medium text-blue-900">
                    Все →
                  </Text>
                </Pressable>
              </View>
              {recentRequests.map((r) => (
                <Pressable
                  accessibilityRole="button"
                  key={r.id}
                  accessibilityLabel={r.title || "Заявка"}
                  onPress={() => router.push(`/requests/${r.id}` as never)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3"
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.85 } : undefined
                  }
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <Text
                      className="text-base font-semibold text-slate-900 flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {r.title || r.city.name}
                    </Text>
                    <StatusBadge status={r.status} />
                  </View>
                  <Text
                    className="text-sm text-slate-500 leading-5 mb-2"
                    numberOfLines={2}
                  >
                    {r.description}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <FontAwesome name="map-marker" size={11} color={colors.placeholder} />
                      <Text className="text-xs text-slate-400">{r.city.name}</Text>
                    </View>
                    {r.threadsCount > 0 && (
                      <View className="flex-row items-center gap-1">
                        <FontAwesome name="comments" size={11} color={colors.placeholder} />
                        <Text className="text-xs text-slate-400">
                          {r.threadsCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── CTA SECTION ─── */}
        <View className="py-12 px-4 bg-blue-900">
          <View style={containerStyle}>
            <Text className="text-xl font-bold text-white text-center mb-2">
              Готовы начать?
            </Text>
            <Text className="text-sm text-blue-200 text-center mb-6 leading-5">
              Разместите заявку бесплатно и получите отклики от специалистов
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Разместить заявку бесплатно"
              onPress={() => router.push("/auth/email" as never)}
              className="bg-amber-700 rounded-xl h-12 items-center justify-center"
              style={isDesktop ? { maxWidth: 280, alignSelf: "center" } : undefined}
            >
              <Text className="text-white font-semibold text-base">
                Разместить заявку бесплатно
              </Text>
            </Pressable>
            <Text className="text-xs text-blue-200/70 text-center mt-4 leading-4">
              Сервис бесплатный. Без комиссий и скрытых платежей.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
