import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { ChevronLeft, FileText, Briefcase } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import LoadingState from "@/components/ui/LoadingState";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors, BREAKPOINT } from "@/lib/theme";
import { pluralizeRu } from "@/lib/ru";

interface UserPublic {
  id: string;
  firstName: string | null;
  lastInitial: string | null;
  avatarUrl: string | null;
  createdAt: string;
  isSpecialist: boolean;
  totalRequestsCount: number;
  activeRequestsCount: number;
}

const SAFE_EDGES =
  Platform.OS === "web" ? (["top"] as const) : (["top", "bottom"] as const);

/**
 * Public client profile. Minimal info — designed to give a specialist
 * just enough context to decide whether to engage with a client whose
 * request they saw. Does NOT show email, phone, or last full name.
 *
 * If the subject's `isSpecialist` is true, redirects to /profile/:id
 * (the existing specialist public profile, which has rich credentials).
 */
export default function PublicUserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const u = await api<UserPublic>(`/api/user/${id}/public`);
      // Specialists already have a richer page at /profile/:id.
      if (u.isSpecialist) {
        router.replace(`/profile/${id}` as never);
        return;
      }
      setUser(u);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Профиль не найден");
      } else {
        setError("Не удалось загрузить профиль");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as never);
  };

  const headerBar = (
    <View
      className="flex-row items-center px-3 border-b border-border bg-white"
      style={{ height: 52 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Назад"
        onPress={goBack}
        className="flex-row items-center"
        style={{ minHeight: 44, paddingHorizontal: 6 }}
      >
        <ChevronLeft size={22} color={colors.text} />
        <Text className="text-text-base ml-1">Назад</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {headerBar}
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!user || error) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={SAFE_EDGES}>
        {headerBar}
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-text-mute text-center">
            {error ?? "Профиль не найден"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    [user.firstName, user.lastInitial].filter(Boolean).join(" ") || "Клиент";
  const memberSinceYear = new Date(user.createdAt).getFullYear();

  const ogTitle = `${fullName} — клиент p2ptax`;
  const ogDesc = `Создал${user.totalRequestsCount > 0 ? ` ${user.totalRequestsCount} ${pluralizeRu(
    user.totalRequestsCount,
    ["запрос", "запроса", "запросов"]
  )}` : " пока не было запросов"}, на сайте с ${memberSinceYear}.`;

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={SAFE_EDGES}>
      <Head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:type" content="profile" />
        <meta
          property="og:url"
          content={`https://p2ptax.smartlaunchhub.com/users/${user.id}`}
        />
        {/* Don't index unauth viewer's anonymized version of the page,
            but DO index the auth one — search engines crawl anon, so
            keep noindex on. */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {headerBar}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 32 : 16,
          paddingVertical: 24,
          maxWidth: 720,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Hero — avatar + name */}
        <View className="items-center mb-8">
          <Avatar
            name={fullName}
            imageUrl={user.avatarUrl ?? undefined}
            size="xxl"
          />
          <Text
            className="mt-4 text-2xl font-extrabold"
            style={{ color: colors.text, letterSpacing: -0.4 }}
          >
            {fullName}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textMuted }}>
            На сайте с {memberSinceYear}
          </Text>
          {!isAuthenticated && (
            <Text
              className="text-xs mt-2 text-center"
              style={{ color: colors.textMuted, maxWidth: 360 }}
            >
              Чтобы увидеть аватар и полное имя, войдите как специалист.
            </Text>
          )}
        </View>

        {/* Stats */}
        <View
          className="flex-row rounded-2xl bg-white border border-border"
          style={{ padding: 4 }}
        >
          <StatTile
            icon={FileText}
            label="Активных запросов"
            value={user.activeRequestsCount}
          />
          <View
            style={{
              width: 1,
              backgroundColor: colors.border,
              marginVertical: 12,
            }}
          />
          <StatTile
            icon={Briefcase}
            label="Всего запросов"
            value={user.totalRequestsCount}
          />
        </View>

        {/* Privacy notice */}
        <View
          className="mt-6 rounded-xl border border-border p-4"
          style={{ backgroundColor: colors.white }}
        >
          <Text
            className="text-xs font-semibold uppercase mb-2"
            style={{ color: colors.textMuted, letterSpacing: 0.6 }}
          >
            О профиле клиента
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary, lineHeight: 20 }}>
            Это публичный профиль клиента. Здесь видна только базовая информация —
            никаких личных контактов: связаться с клиентом можно только через
            отклик на его запрос внутри платформы.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: number;
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon size={18} color={colors.primary} />
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
