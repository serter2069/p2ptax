import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { colors } from "@/lib/theme";

interface PlatformStats {
  specialistsCount: number;
  citiesCount: number;
  consultationsCount: number;
}

const MOCK_SPECIALISTS = [
  { name: "Алексей М.", rating: 4.9, tag: "Выездная проверка" },
  { name: "Ирина К.", rating: 4.8, tag: "Камеральная проверка" },
  { name: "Дмитрий С.", rating: 5.0, tag: "ОКК" },
];

const PROBLEMS = [
  {
    icon: "\u26A0\uFE0F",
    title: "Не знаете, насколько серьёзно",
    text: "Штраф? Доначисления? Блокировка счёта? Без опыта сложно оценить масштаб проблемы и последствия.",
  },
  {
    icon: "\uD83D\uDCCB",
    title: "Не знаете что делать",
    text: "Куда идти, какие документы готовить, как отвечать на требования инспекции — непонятно с чего начать.",
  },
  {
    icon: "\uD83D\uDD0D",
    title: "Не можете найти нужного",
    text: "Обычные бухгалтеры не разбираются в P2P. А те, кто разбирается — их ещё нужно найти в вашем городе.",
  },
];

const FEATURES = [
  {
    icon: "\uD83D\uDDFA\uFE0F",
    title: "Фильтр по городу и ФНС",
    text: "Только специалисты, которые работают с вашей инспекцией.",
  },
  {
    icon: "\u2709\uFE0F",
    title: "Специалисты пишут первыми",
    text: "Не нужно обзванивать всех. Они изучают и приходят к вам.",
  },
  {
    icon: "\uD83D\uDCB0",
    title: "Бесплатно для клиента",
    text: "Создать заявку и получить предложения ничего не стоит.",
  },
  {
    icon: "\uD83D\uDD00",
    title: "Два пути входа",
    text: "Создать заявку или найти специалиста в каталоге и написать напрямую.",
  },
];

const STEPS = [
  { num: "1", label: "Создайте заявку" },
  { num: "2", label: "Специалисты напишут сами" },
  { num: "3", label: "Выберите и решите вопрос" },
];

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (user.role === "SPECIALIST") {
        router.replace("/(specialist-tabs)/dashboard" as never);
      } else if (user.role === "CLIENT") {
        router.replace("/(client-tabs)/dashboard" as never);
      } else if (user.role === "ADMIN") {
        router.replace("/(admin-tabs)/dashboard" as never);
      }
    }
  }, [isAuthenticated, user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const statsRes = await api<PlatformStats>("/api/stats", {
        noAuth: true,
      });
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
        <View className="flex-row items-center justify-between h-16 bg-white px-4">
          <Text
            className="text-lg font-extrabold"
            style={{ color: "#1e3a8a" }}
          >
            P2PTax
          </Text>
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
      <View
        className="flex-row items-center justify-between h-16 bg-white px-4"
        style={
          scrollY > 10
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }
            : undefined
        }
      >
        <View style={{ width: "100%", alignItems: "center" }}>
          <View
            className="flex-row items-center justify-between"
            style={{
              width: "100%",
              maxWidth: 1152,
              paddingHorizontal: isDesktop ? 24 : 0,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="P2PTax Home"
              onPress={() => router.push("/" as never)}
              className="min-h-[44px] justify-center"
            >
              <Text
                className="text-xl font-extrabold"
                style={{ color: "#1e3a8a" }}
              >
                P2PTax
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Создать заявку"
              onPress={() => router.push("/auth/email" as never)}
              className="rounded-lg px-4 min-h-[44px] items-center justify-center"
              style={{ backgroundColor: "#b45309" }}
            >
              <Text className="text-white font-semibold text-sm">
                Создать заявку
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* ─── HERO ─── */}
        <View className="bg-white px-4" style={{ paddingTop: isDesktop ? 128 : 96, paddingBottom: isDesktop ? 96 : 64 }}>
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 1152,
                paddingHorizontal: isDesktop ? 24 : 0,
                flexDirection: isDesktop ? "row" : "column",
                alignItems: isDesktop ? "flex-start" : "stretch",
                gap: isDesktop ? 48 : 0,
              }}
            >
              {/* Text column */}
              <View style={isDesktop ? { flex: 1 } : undefined}>
                <Text
                  className="font-extrabold"
                  style={{
                    color: "#1e3a8a",
                    fontSize: isDesktop ? 48 : 36,
                    lineHeight: isDesktop ? 56 : 42,
                  }}
                >
                  Специалисты по вашей ФНС — не юристы из интернета
                </Text>
                <Text
                  className="text-lg mt-6"
                  style={{ color: "#64748B", lineHeight: 28 }}
                >
                  Практики с опытом в камеральных, выездных и ОКК. Выберите сами
                  или получите предложения.
                </Text>

                {/* CTAs */}
                <View
                  className="mt-8"
                  style={{
                    flexDirection: isDesktop ? "row" : "column",
                    gap: 16,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Создать заявку бесплатно"
                    onPress={() => router.push("/auth/email" as never)}
                    className="rounded-xl h-12 items-center justify-center px-7"
                    style={{ backgroundColor: "#b45309" }}
                  >
                    <Text className="text-white font-semibold text-base">
                      Создать заявку бесплатно →
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Смотреть каталог"
                    onPress={() => router.push("/specialists" as never)}
                    className="rounded-xl h-12 items-center justify-center px-7"
                    style={{ borderWidth: 2, borderColor: "#1e3a8a" }}
                  >
                    <Text
                      className="font-semibold text-base"
                      style={{ color: "#1e3a8a" }}
                    >
                      Смотреть каталог
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Mock specialist cards (desktop only) */}
              {isDesktop && (
                <View style={{ flex: 1, maxWidth: 400 }}>
                  {MOCK_SPECIALISTS.map((s) => (
                    <View
                      key={s.name}
                      className="flex-row items-center p-4 rounded-2xl mb-4"
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        gap: 16,
                      }}
                    >
                      {/* Avatar */}
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: "rgba(30,58,138,0.1)" }}
                      >
                        <Text
                          className="font-extrabold text-base"
                          style={{ color: "#1e3a8a" }}
                        >
                          {s.name.charAt(0)}
                        </Text>
                      </View>
                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          className="font-semibold"
                          style={{ color: "#0f172a" }}
                        >
                          {s.name}
                        </Text>
                        <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
                          <Text style={{ color: "#d97706" }}>
                            {"\u2605"}
                          </Text>
                          <Text
                            className="text-sm"
                            style={{ color: "#64748B" }}
                          >
                            {s.rating}
                          </Text>
                        </View>
                      </View>
                      {/* Tag */}
                      <View
                        className="rounded-full px-3"
                        style={{
                          backgroundColor: "rgba(30,58,138,0.1)",
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: "#1e3a8a" }}
                        >
                          {s.tag}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ─── STATS STRIP ─── */}
        {stats && (
          <View className="bg-slate-900 py-8 px-4">
            <View style={{ width: "100%", alignItems: "center" }}>
              <View
                className="flex-row justify-around"
                style={{
                  width: "100%",
                  maxWidth: 900,
                  paddingHorizontal: isDesktop ? 24 : 0,
                }}
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
                  style={{
                    width: 1,
                    backgroundColor: colors.textMuted,
                    marginHorizontal: 8,
                  }}
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
                  style={{
                    width: 1,
                    backgroundColor: colors.textMuted,
                    marginHorizontal: 8,
                  }}
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
          </View>
        )}

        {/* ─── PROBLEM SECTION ─── */}
        <View
          className="bg-slate-100 px-4"
          style={{ paddingTop: isDesktop ? 96 : 64, paddingBottom: isDesktop ? 96 : 64 }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 1152,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
            >
              <Text
                className="font-extrabold text-3xl text-center mb-12"
                style={{ color: "#0f172a" }}
              >
                С чем приходят на P2PTax
              </Text>
              <View
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  gap: isDesktop ? 24 : 0,
                }}
              >
                {PROBLEMS.map((p) => (
                  <View
                    key={p.title}
                    className="bg-white rounded-2xl p-6"
                    style={[
                      {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      },
                      isDesktop ? { flex: 1 } : { marginBottom: 16 },
                    ]}
                  >
                    <Text className="text-3xl mb-4">{p.icon}</Text>
                    <Text
                      className="text-lg font-bold mb-2"
                      style={{ color: "#0f172a" }}
                    >
                      {p.title}
                    </Text>
                    <Text style={{ color: "#64748B", lineHeight: 24 }}>
                      {p.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ─── SOLUTION SECTION ─── */}
        <View
          className="bg-white px-4"
          style={{ paddingTop: isDesktop ? 96 : 64, paddingBottom: isDesktop ? 96 : 64 }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 672,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
            >
              <Text
                className="text-sm font-semibold uppercase text-center mb-3"
                style={{ color: "#b45309", letterSpacing: 4 }}
              >
                Почему P2PTax
              </Text>
              <Text
                className="font-extrabold text-3xl text-center"
                style={{ color: "#0f172a" }}
              >
                Большинство юристов дадут консультацию. Нужные люди — решат.
              </Text>
              <Text
                className="text-lg text-center mt-6"
                style={{ color: "#64748B", lineHeight: 28 }}
              >
                P2PTax — маркетплейс специалистов по налоговым проверкам.
                Практики, которые работают с конкретными ФНС в вашем городе.
              </Text>

              {/* Steps */}
              <View
                className="mt-12"
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isDesktop ? 48 : 32,
                }}
              >
                {STEPS.map((s) => (
                  <View key={s.num} className="items-center">
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#1e3a8a" }}
                    >
                      <Text className="text-white font-bold text-base">
                        {s.num}
                      </Text>
                    </View>
                    <Text
                      className="font-semibold mt-3 text-center"
                      style={{ color: "#0f172a" }}
                    >
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ─── FEATURES SECTION ─── */}
        <View
          className="px-4"
          style={{
            backgroundColor: "#1e3a8a",
            paddingTop: isDesktop ? 96 : 64,
            paddingBottom: isDesktop ? 96 : 64,
          }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 1152,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
            >
              <Text className="text-white font-extrabold text-3xl text-center mb-12">
                Как это работает
              </Text>
              <View
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  flexWrap: "wrap",
                  gap: isDesktop ? 24 : 16,
                }}
              >
                {FEATURES.map((f) => (
                  <View
                    key={f.title}
                    className="rounded-2xl p-6"
                    style={[
                      { backgroundColor: "rgba(255,255,255,0.1)" },
                      isDesktop
                        ? { flex: 1, minWidth: "45%" }
                        : {},
                    ]}
                  >
                    <Text className="text-3xl mb-4">{f.icon}</Text>
                    <Text className="text-white font-bold text-lg mb-2">
                      {f.title}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ─── CTA SECTION ─── */}
        <View
          className="px-4"
          style={{
            backgroundColor: "#b45309",
            paddingTop: isDesktop ? 96 : 64,
            paddingBottom: isDesktop ? 96 : 64,
          }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 672,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
            >
              <Text className="text-white font-extrabold text-3xl text-center">
                Уже пришло уведомление?
              </Text>
              <Text
                className="text-lg text-center mt-4"
                style={{ color: "rgba(255,255,255,0.8)", lineHeight: 28 }}
              >
                Создайте заявку — это займёт 3 минуты. Специалисты напишут сами.
              </Text>
              <View
                className="mt-8"
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Создать заявку"
                  onPress={() => router.push("/auth/email" as never)}
                  className="bg-white rounded-xl h-12 items-center justify-center px-7"
                >
                  <Text
                    className="font-semibold text-base"
                    style={{ color: "#1e3a8a" }}
                  >
                    Создать заявку →
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Смотреть специалистов"
                  onPress={() => router.push("/specialists" as never)}
                  className="h-12 items-center justify-center"
                >
                  <Text
                    className="text-base font-semibold"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    Смотреть специалистов
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* ─── FOOTER ─── */}
        <View
          className="px-4"
          style={{ backgroundColor: "#1e3a8a", paddingTop: 48, paddingBottom: 48 }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 1152,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
            >
              <View
                style={{
                  flexDirection: isDesktop ? "row" : "column",
                  justifyContent: isDesktop ? "space-between" : "center",
                  alignItems: "center",
                  gap: isDesktop ? 0 : 24,
                }}
              >
                <Text className="text-white font-extrabold text-lg">
                  P2PTax
                </Text>
                <View
                  className="flex-row items-center"
                  style={{ gap: 24 }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="О сервисе"
                    onPress={() => router.push("/" as never)}
                    className="min-h-[44px] justify-center"
                  >
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      О сервисе
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Специалисты"
                    onPress={() => router.push("/specialists" as never)}
                    className="min-h-[44px] justify-center"
                  >
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      Специалисты
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Создать заявку"
                    onPress={() => router.push("/auth/email" as never)}
                    className="min-h-[44px] justify-center"
                  >
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      Создать заявку
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Divider */}
              <View
                className="mt-8"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.1)",
                  paddingTop: 24,
                }}
              >
                <Text
                  className="text-sm text-center"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  © 2026 P2PTax
                </Text>
                <Text
                  className="text-xs text-center mt-2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Сервис не оказывает юридических услуг.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
