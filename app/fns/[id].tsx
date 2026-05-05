import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Building2,
  Plus,
  Users,
  FileText,
  MapPin,
  Share2,
  ArrowLeft,
  Star,
  ArrowRight,
  Check,
} from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LandingHeader from "@/components/landing/LandingHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface FnsDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  description: string | null;
  city: { id: string; name: string; slug: string };
  specialistCount: number;
  activeRequestCount: number;
}

interface SpecialistRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable?: boolean;
  description?: string | null;
  yearsOfExperience?: number | null;
  cachedAvgResponseMinutes?: number | null;
  reviewsCount?: number;
  averageRating?: number | null;
  services?: Array<{ id: string; name: string }>;
}

interface NeighborFns {
  id: string;
  name: string;
  code: string;
  city: { id: string; name: string };
  specialistCount: number;
  activeRequestCount: number;
}

/**
 * Public landing for a single FNS office. Sections:
 *   - Public header (LandingHeader for anon visitors)
 *   - Back link + Share button
 *   - Hero: name, code, city, address, admin description
 *   - Stat strip: specialists / active requests
 *   - "Оставить запрос" CTA (prefills /requests/new with this fnsId)
 *   - Yandex Maps embed for the address (when set)
 *   - Specialist roster — every specialist who covers this FNS,
 *     with avatar, name, services, years of experience, rating
 *   - Reviews placeholder (Yandex import to come)
 *   - Other FNS in the same city
 */
export default function FnsDetailPage() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fnsId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [fns, setFns] = useState<FnsDetail | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistRow[] | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborFns[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const load = useCallback(async () => {
    if (!fnsId) return;
    setLoading(true);
    setError(null);
    try {
      const [fnsRes, specRes] = await Promise.all([
        api<FnsDetail>(`/api/fns/${fnsId}`, { noAuth: true }),
        api<{ items: SpecialistRow[] }>(
          `/api/specialists?fns_ids=${fnsId}&limit=50`,
          { noAuth: true }
        ).catch(() => ({ items: [] })),
      ]);
      setFns(fnsRes);
      setSpecialists(specRes.items ?? []);

      // Neighbors — other FNS in the same city, sorted by activity.
      try {
        const neighborsRes = await api<{ items: NeighborFns[] }>(
          `/api/fns/list?cityId=${fnsRes.city.id}&limit=10`,
          { noAuth: true }
        );
        setNeighbors(neighborsRes.items.filter((f) => f.id !== fnsRes.id));
      } catch {
        setNeighbors([]);
      }
    } catch (e) {
      if (__DEV__) console.error("fns load error", e);
      setError("Не удалось загрузить ИФНС");
    } finally {
      setLoading(false);
    }
  }, [fnsId]);

  useEffect(() => {
    void load();
  }, [load]);

  const goCreateRequest = useCallback(() => {
    if (!fnsId) return;
    router.push(`/requests/new?fnsId=${fnsId}` as never);
  }, [fnsId, router]);

  const handleShare = useCallback(async () => {
    if (!fns) return;
    const url =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.href
        : `https://p2ptax.smartlaunchhub.com/fns/${fns.id}`;
    const title = `${fns.name} — P2PTax`;
    const text = `${fns.name} (код ${fns.code}, ${fns.city.name}). Найдите специалиста по этой ИФНС.`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const navigatorAny = typeof navigator !== "undefined" ? (navigator as any) : null;
      if (Platform.OS === "web" && navigatorAny?.share) {
        await navigatorAny.share({ title, text, url });
      } else if (
        Platform.OS === "web" &&
        navigatorAny?.clipboard?.writeText
      ) {
        await navigatorAny.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled, or clipboard unavailable */
    }
  }, [fns]);

  const mapEmbedUrl = useMemo(() => {
    if (!fns?.address) return null;
    const q = encodeURIComponent(`${fns.city.name}, ${fns.address}`);
    return `https://yandex.ru/map-widget/v1/?text=${q}&z=16`;
  }, [fns]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {!isAuthenticated && (
          <LandingHeader
            isDesktop={isDesktop}
            onHome={() => nav.routes.home()}
            onCatalog={() => nav.routes.specialists()}
            onFnsCatalog={() => nav.any("/fns")}
            onLogin={() => nav.routes.login()}
            onCreateRequest={() => nav.routes.requestsNew()}
            isAuthenticated={false}
          />
        )}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fns) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        {!isAuthenticated && (
          <LandingHeader
            isDesktop={isDesktop}
            onHome={() => nav.routes.home()}
            onCatalog={() => nav.routes.specialists()}
            onFnsCatalog={() => nav.any("/fns")}
            onLogin={() => nav.routes.login()}
            onCreateRequest={() => nav.routes.requestsNew()}
            isAuthenticated={false}
          />
        )}
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState message={error ?? "ИФНС не найдена"} onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      {!isAuthenticated && (
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onFnsCatalog={() => nav.any("/fns")}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={false}
        />
      )}
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: isDesktop ? 880 : "100%", gap: 16 }}>
          {/* Top bar — back + share */}
          <View
            className="flex-row items-center justify-between"
            style={{ gap: 8 }}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="К справочнику ИФНС"
              onPress={() => router.push("/fns" as never)}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  backgroundColor: "transparent",
                },
                pressed && { backgroundColor: colors.accentSoft },
              ]}
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                Все ИФНС
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Поделиться ссылкой на эту ИФНС"
              onPress={handleShare}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.white,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              {shareCopied ? (
                <>
                  <Check size={14} color={colors.success} />
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                    Скопировано
                  </Text>
                </>
              ) : (
                <>
                  <Share2 size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Поделиться
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Hero card */}
          <Card>
            <View className="flex-row items-start" style={{ gap: 14 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={32} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                  Налоговая инспекция · код {fns.code}
                </Text>
                <Text style={{ fontSize: isDesktop ? 24 : 20, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                  {fns.name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                  {fns.city.name}
                </Text>
              </View>
            </View>

            {fns.address && (
              <View
                className="flex-row items-start mt-3"
                style={{ gap: 8 }}
              >
                <MapPin size={14} color={colors.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                  {fns.address}
                </Text>
              </View>
            )}

            {fns.description && (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text,
                  lineHeight: 21,
                  marginTop: 12,
                }}
              >
                {fns.description}
              </Text>
            )}

            {/* Stat strip */}
            <View
              className="flex-row mt-4"
              style={{
                gap: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 12,
                flexWrap: "wrap",
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Users size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Специалистов:{" "}
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {fns.specialistCount}
                  </Text>
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <FileText size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Активных запросов:{" "}
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {fns.activeRequestCount}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Primary CTA */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Оставить запрос по этой ИФНС"
              onPress={goCreateRequest}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 13,
                  borderRadius: 12,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Plus size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: "700" }}>
                Оставить запрос по этой ИФНС
              </Text>
            </Pressable>
          </Card>

          {/* Yandex Maps embed */}
          {mapEmbedUrl && Platform.OS === "web" && (
            <Card>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                На карте
              </Text>
              <View
                style={{
                  height: 280,
                  borderRadius: 10,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(() => {
                  const Iframe = "iframe" as unknown as React.ElementType;
                  return (
                    <Iframe
                      src={mapEmbedUrl}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Карта"
                      style={{ border: 0 }}
                    />
                  );
                })()}
              </View>
            </Card>
          )}

          {/* Specialist roster */}
          <View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Специалисты по этой ИФНС {specialists ? `· ${specialists.length}` : ""}
            </Text>
            {!specialists || specialists.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Users}
                  title="Пока нет специалистов"
                  subtitle="По этой ИФНС никто ещё не подключился. Оставьте запрос — мы оповестим всех специалистов как только они появятся."
                />
              </Card>
            ) : (
              <Card>
                {specialists.map((s, idx) => {
                  const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ") || "Специалист";
                  const services = s.services?.slice(0, 3).map((sv) => sv.name).join(" · ");
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="link"
                      accessibilityLabel={`Профиль ${fullName}`}
                      onPress={() => router.push(`/profile/${s.id}` as never)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 12,
                          paddingVertical: 14,
                          borderTopWidth: idx === 0 ? 0 : 1,
                          borderTopColor: colors.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Avatar
                        name={fullName}
                        imageUrl={s.avatarUrl ?? undefined}
                        size="md"
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>
                            {fullName}
                          </Text>
                          {s.isAvailable && (
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 999,
                                backgroundColor: colors.limeSoft,
                              }}
                            >
                              <Text style={{ fontSize: 10, color: colors.success, fontWeight: "700" }}>
                                ОНЛАЙН
                              </Text>
                            </View>
                          )}
                        </View>
                        {(s.averageRating != null || s.reviewsCount) && (
                          <View className="flex-row items-center" style={{ gap: 4, marginTop: 4 }}>
                            <Star size={12} color={colors.warning ?? "#f5a623"} fill={colors.warning ?? "#f5a623"} />
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              {s.averageRating != null ? s.averageRating.toFixed(1) : "—"}
                              {s.reviewsCount ? ` · ${s.reviewsCount} отзывов` : ""}
                            </Text>
                          </View>
                        )}
                        {services && (
                          <Text
                            style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}
                            numberOfLines={2}
                          >
                            {services}
                          </Text>
                        )}
                        {s.description && (
                          <Text
                            style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}
                            numberOfLines={2}
                          >
                            {s.description}
                          </Text>
                        )}
                      </View>
                      <ArrowRight size={16} color={colors.textMuted} />
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </View>

          {/* Reviews placeholder (Yandex import to come) */}
          <Card>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Отзывы
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
              Скоро здесь появятся отзывы об этой инспекции, загруженные с Яндекс.Карт. Пока что вы можете ознакомиться с отзывами на самой Яндекс.Карте, перейдя по ссылке выше.
            </Text>
          </Card>

          {/* Other FNS in the same city */}
          {neighbors.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                Другие ИФНС в городе {fns.city.name}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {neighbors.slice(0, 8).map((n) => (
                  <Pressable
                    key={n.id}
                    accessibilityRole="link"
                    accessibilityLabel={`Открыть ${n.name}`}
                    onPress={() => router.push(`/fns/${n.id}` as never)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style={({ pressed }) => [
                      {
                        flexBasis: isDesktop ? "calc(50% - 6px)" : "100%" as any,
                        flexGrow: 1,
                        backgroundColor: colors.white,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        padding: 12,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: colors.accentSoft,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                          {n.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                          код {n.code} · спецов {n.specialistCount}
                        </Text>
                      </View>
                      <ArrowRight size={14} color={colors.textMuted} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
