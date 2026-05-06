import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Plus,
  Users,
  FileText,
  MapPin,
  Share2,
  ArrowLeft,
  Star,
  ArrowRight,
  Check,
  Mail,
  AlertTriangle,
  UserCircle2,
  Copy,
} from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import CopyableValue from "@/components/ui/CopyableValue";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LandingHeader from "@/components/landing/LandingHeader";
import HowItWorksFlow from "@/components/landing/HowItWorksFlow";
import FooterSection from "@/components/landing/FooterSection";
import FnsLogo from "@/components/fns/FnsLogo";
import ReportFnsModal from "@/components/fns/ReportFnsModal";
import StaffCard from "@/components/fns/StaffCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface FnsDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  addressSecondary?: string | null;
  description: string | null;
  city: { id: string; name: string; slug: string };
  latitude?: number | null;
  longitude?: number | null;
  yandexRating?: number | null;
  yandexReviewsCount?: number | null;
  yandexOrgUrl?: string | null;
  inn?: string | null;
  kpp?: string | null;
  oktmo?: string | null;
  officialPhone?: string | null;
  officialEmail?: string | null;
  officialWebsite?: string | null;
  workingHours?: string | null;
  photoUrls?: string[] | null;
  nalogGovUrl?: string | null;
  specialistCount: number;
  activeRequestCount: number;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  position: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  cachedAvgRating?: number | null;
  cachedReviewsCount?: number | null;
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
  const [publicRequests, setPublicRequests] = useState<Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    user: { firstName: string | null };
  }>>([]);
  const [reviews, setReviews] = useState<Array<{
    id: string;
    authorName: string;
    rating: number;
    text: string;
    source: string;
    reviewDate: string;
  }>>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

      // Публичные запросы по этой ИФНС.
      try {
        const reqRes = await api<{ items: typeof publicRequests }>(
          `/api/requests/public?fns_id=${fnsId}&limit=5`,
          { noAuth: true }
        );
        setPublicRequests(reqRes.items ?? []);
      } catch {
        setPublicRequests([]);
      }

      // Отзывы (сейчас — сид «как с Я.Карт»).
      try {
        const reviewsRes = await api<{ items: typeof reviews }>(
          `/api/fns/${fnsId}/reviews?limit=10`,
          { noAuth: true }
        );
        setReviews(reviewsRes.items ?? []);
      } catch {
        setReviews([]);
      }

      // Сотрудники.
      try {
        const staffRes = await api<{ items: StaffMember[] }>(
          `/api/fns/${fnsId}/staff?limit=20`,
          { noAuth: true }
        );
        setStaff(staffRes.items ?? []);
      } catch {
        setStaff([]);
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
      // На десктоп-вебе всегда копируем — там Web Share API уродует
      // UX (нативный шит не вызывает реакции). На мобилке сначала
      // пробуем Web Share, fallback — clipboard.
      const useNative =
        Platform.OS !== "web" ||
        (isDesktop ? false : !!navigatorAny?.share);
      if (useNative && navigatorAny?.share) {
        await navigatorAny.share({ title, text, url });
      } else if (navigatorAny?.clipboard?.writeText) {
        await navigatorAny.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled, or clipboard unavailable */
    }
  }, [fns, isDesktop]);

  const mapEmbedUrl = useMemo(() => {
    if (!fns) return null;
    // Документация Я.Карт-виджета: text= уводит в режим поиска
    // (пин виден только при клике на «1 найдено»), а pt= рисует
    // статичный маркер сразу. Используем pt + ll, без text.
    if (fns.latitude != null && fns.longitude != null) {
      const ll = `${fns.longitude},${fns.latitude}`;
      const pt = `${fns.longitude},${fns.latitude},pm2rdm`; // red large marker
      return `https://yandex.ru/map-widget/v1/?ll=${ll}&z=17&pt=${pt}&l=map`;
    }
    // Fallback на текстовый поиск только если нет координат вовсе.
    const q = encodeURIComponent(`${fns.city.name}, ${fns.address ?? ""}`.trim());
    return `https://yandex.ru/map-widget/v1/?text=${q}&z=17`;
  }, [fns]);

  const mapExternalUrl = useMemo(() => {
    if (!fns) return null;
    if (fns.yandexOrgUrl) return fns.yandexOrgUrl;
    // Открываем по адресу, чтобы Я.Карты показали карточку здания
    // («ул. Крылова, 76, Абакан») — а не безымянную точку.
    const addressQuery = `${fns.city.name}, ${fns.address ?? ""}`.trim();
    return `https://yandex.ru/maps/?text=${encodeURIComponent(addressQuery)}`;
  }, [fns]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onFnsCatalog={() => nav.any("/fns")}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.dashboard()}
        />

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fns) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LandingHeader
          isDesktop={isDesktop}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onFnsCatalog={() => nav.any("/fns")}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => nav.routes.requestsNew()}
          isAuthenticated={isAuthenticated}
          onOpenDashboard={() => nav.routes.dashboard()}
        />

        <View className="flex-1 items-center justify-center px-4">
          <ErrorState message={error ?? "ИФНС не найдена"} onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <LandingHeader
        isDesktop={isDesktop}
        onHome={() => nav.routes.home()}
        onCatalog={() => nav.routes.specialists()}
        onFnsCatalog={() => nav.any("/fns")}
        onLogin={() => nav.routes.login()}
        onCreateRequest={() => nav.routes.requestsNew()}
        isAuthenticated={isAuthenticated}
        onOpenDashboard={() => nav.routes.dashboard()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 0,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: isDesktop ? 880 : "100%", gap: 16, paddingHorizontal: 16, paddingBottom: 40 }}>
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
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Пожаловаться на эту ИФНС"
                onPress={() => setReportOpen(true)}
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
                <AlertTriangle size={14} color={colors.warning ?? "#f5a623"} />
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                  Пожаловаться
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isDesktop && Platform.OS === "web"
                    ? "Скопировать ссылку"
                    : "Поделиться ссылкой на эту ИФНС"
                }
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
                    {isDesktop && Platform.OS === "web" ? (
                      <Copy size={14} color={colors.textSecondary} />
                    ) : (
                      <Share2 size={14} color={colors.textSecondary} />
                    )}
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {isDesktop && Platform.OS === "web" ? "Копировать ссылку" : "Поделиться"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Hero card */}
          <Card>
            <View className="flex-row items-start" style={{ gap: 14 }}>
              <FnsLogo name={fns.name} cityName={fns.city.name} size="lg" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                  Налоговая инспекция · код {fns.code}
                </Text>
                <Text style={{ fontSize: isDesktop ? 24 : 20, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                  {fns.name}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={`Все ИФНС в городе ${fns.city.name}`}
                  onPress={() => router.push(`/fns?cityId=${fns.city.id}` as never)}
                  style={({ pressed }) => [
                    { alignSelf: "flex-start", marginTop: 2 },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                    {fns.city.name} →
                  </Text>
                </Pressable>
              </View>
            </View>

            {fns.address && (
              <View
                className="flex-row items-start mt-3"
                style={{ gap: 8 }}
              >
                <MapPin size={14} color={colors.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                    {fns.address}
                  </Text>
                  {fns.addressSecondary && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }}>
                      Доп. адрес: {fns.addressSecondary}
                    </Text>
                  )}
                </View>
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
              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  На карте
                </Text>
                {mapExternalUrl && (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Открыть в Яндекс.Картах"
                    onPress={() => {
                      if (typeof window !== "undefined") {
                        window.open(mapExternalUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                      Открыть в Яндекс.Картах →
                    </Text>
                  </Pressable>
                )}
              </View>
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

          {/* Фото инспекции — забранные с nalog.gov.ru */}
          {fns.photoUrls && fns.photoUrls.length > 0 && (
            <Card>
              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: 10 }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Фото инспекции · {fns.photoUrls.length}
                </Text>
                {fns.nalogGovUrl && (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => {
                      if (typeof window !== "undefined" && fns.nalogGovUrl) {
                        window.open(fns.nalogGovUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                      Источник: nalog.gov.ru →
                    </Text>
                  </Pressable>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {fns.photoUrls.map((url) => (
                  <Pressable
                    key={url}
                    accessibilityRole="link"
                    onPress={() => {
                      if (typeof window !== "undefined") {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    style={({ pressed }) => [
                      {
                        width: isDesktop ? 240 : 200,
                        height: isDesktop ? 160 : 140,
                        borderRadius: 10,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* SEO-текст об ИФНС (рыба-заглушка пока нет реальной справки) */}
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
              Об инспекции
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
              {fns.name} — территориальный налоговый орган в составе ФНС России,
              отвечающий за обслуживание налогоплательщиков на территории{" "}
              <Text style={{ fontWeight: "600" }}>{fns.city.name}</Text>. В её
              ведении регистрация ИП и юридических лиц, приём отчётности по
              УСН/ОСНО/НДС/НДФЛ, выездные и камеральные проверки, выдача справок
              об отсутствии задолженности и ведение работы с налоговыми
              уведомлениями физических лиц.
            </Text>
            <Text
              style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: 8 }}
            >
              Если у вас вопрос по этой ИФНС — отчётность, спор по начислению,
              выездная проверка или просто непонятная квитанция — оставьте запрос
              на платформе. Специалисты, которые знают именно эту инспекцию,
              ответят и предложат план действий.
            </Text>
          </Card>

          {/* Контакты — короткий блок с самым важным */}
          <Card>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              Контакты
            </Text>
            <View style={{ gap: 10 }}>
              {fns.workingHours && (
                <ContactRow
                  label="Время работы"
                  value={fns.workingHours}
                  multiline
                />
              )}
              {fns.officialPhone && (
                <ContactRow
                  label="Телефон"
                  copyable={fns.officialPhone}
                  value={fns.officialPhone}
                />
              )}
              {fns.officialEmail && (
                <ContactRow
                  label="Email"
                  copyable={fns.officialEmail}
                  value={fns.officialEmail}
                />
              )}
              {fns.officialWebsite && (
                <ContactRow
                  label="Сайт"
                  value={fns.officialWebsite}
                  href={fns.officialWebsite}
                />
              )}
              {(fns.inn || fns.kpp) && (
                <ContactRow
                  label="ИНН / КПП"
                  value={[fns.inn, fns.kpp].filter(Boolean).join(" / ")}
                />
              )}
            </View>
          </Card>

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
                  subtitle={`По ${fns.name} ещё никто не подключился. Можно оставить запрос — мы оповестим всех специалистов как только они появятся. А если вы налоговый специалист и работаете с этой ИФНС — добавьте профиль на платформу.`}
                />
                <View
                  style={{
                    flexDirection: isDesktop ? "row" : "column",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Оставить запрос"
                    onPress={goCreateRequest}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        backgroundColor: colors.primary,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Plus size={16} color={colors.white} />
                    <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>
                      Оставить запрос
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Стать специалистом по этой ИФНС"
                    onPress={() => nav.any(`/login?intent=specialist&fnsId=${fns.id}`)}
                    style={({ pressed }) => [
                      {
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        backgroundColor: colors.white,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>
                      Стать специалистом по этой ИФНС
                    </Text>
                  </Pressable>
                </View>
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

          {/* Открытые публичные запросы по этой ИФНС */}
          {publicRequests.length > 0 && (
            <View>
              <View
                className="flex-row items-center justify-between"
                style={{ marginBottom: 8, paddingHorizontal: 4 }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Открытые запросы по этой ИФНС · {publicRequests.length}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push(`/requests/public?fnsId=${fnsId}` as never)}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                    Все →
                  </Text>
                </Pressable>
              </View>
              <Card>
                {publicRequests.map((r, idx) => (
                  <Pressable
                    key={r.id}
                    accessibilityRole="link"
                    accessibilityLabel={`Открыть запрос ${r.title}`}
                    onPress={() => router.push(`/requests/${r.id}` as never)}
                    style={({ pressed }) => [
                      {
                        paddingVertical: 12,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
                      numberOfLines={1}
                    >
                      {r.title}
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}
                      numberOfLines={2}
                    >
                      {r.description}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                      {r.user?.firstName ?? "Анонимно"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                    </Text>
                  </Pressable>
                ))}
              </Card>
            </View>
          )}

          {/* Рейтинг + сами отзывы. Сейчас сидовая рыба, отмеченная
              source=yandex_maps_seed; UI это не различает. */}
          <Card>
            <View
              className="flex-row items-center justify-between"
              style={{ marginBottom: 12 }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Рейтинг и отзывы
              </Text>
              {mapExternalUrl && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    if (typeof window !== "undefined") {
                      window.open(mapExternalUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
                    На Яндекс.Картах →
                  </Text>
                </Pressable>
              )}
            </View>

            {fns.yandexRating != null && (
              <View
                className="flex-row items-center"
                style={{
                  gap: 10,
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: colors.limeSoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
                    {fns.yandexRating.toFixed(1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        color={colors.warning ?? "#f5a623"}
                        fill={
                          n <= Math.round(fns.yandexRating ?? 0)
                            ? colors.warning ?? "#f5a623"
                            : "transparent"
                        }
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {fns.yandexReviewsCount ?? reviews.length} отзывов с Яндекс.Карт
                  </Text>
                </View>
              </View>
            )}

            {reviews.length > 0 ? (
              <View style={{ gap: 14 }}>
                {reviews.slice(0, 5).map((r, idx) => (
                  <View
                    key={r.id}
                    style={{
                      paddingBottom: idx === Math.min(reviews.length, 5) - 1 ? 0 : 14,
                      borderBottomWidth: idx === Math.min(reviews.length, 5) - 1 ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View
                      className="flex-row items-center justify-between"
                      style={{ marginBottom: 4 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                        {r.authorName}
                      </Text>
                      <View className="flex-row items-center" style={{ gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={11}
                            color={colors.warning ?? "#f5a623"}
                            fill={
                              n <= r.rating ? colors.warning ?? "#f5a623" : "transparent"
                            }
                          />
                        ))}
                      </View>
                    </View>
                    <Text
                      style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}
                    >
                      {r.text}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                      {new Date(r.reviewDate).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Отзывы пока загружаются. Свежие можно почитать по ссылке выше.
              </Text>
            )}
          </Card>

          {/* Персонализированный «Как это работает» — стоит ниже, ближе
              к финальному CTA и шагам подставлено название этой ИФНС. */}
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: isDesktop ? 24 : 18,
              paddingHorizontal: isDesktop ? 20 : 14,
              gap: 16,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Как решить вопрос по этой ИФНС
            </Text>
            <View
              style={{
                flexDirection: isDesktop ? "row" : "column",
                gap: isDesktop ? 16 : 12,
              }}
            >
              {[
                {
                  num: "1",
                  title: "Опишите вопрос",
                  body: "Кратко расскажите, что произошло: возврат, проверка, регистрация, спор по начислению — что угодно. Эта инспекция уже выбрана, искать заново не придётся.",
                  metric: "2–3 минуты · бесплатно",
                },
                {
                  num: "2",
                  title: "Откликнутся профильные специалисты",
                  body: fns.specialistCount > 0
                    ? `Запрос увидят только специалисты, у которых эта ИФНС указана в профиле — сейчас их ${fns.specialistCount}. Откликнутся прямо в платформе.`
                    : "Запрос увидят только специалисты, у которых эта ИФНС указана в профиле. Как только они появятся — пришлём отклики.",
                  metric: "обычно в течение суток",
                },
                {
                  num: "3",
                  title: "Решите задачу",
                  body: "Общение и сделка — напрямую со специалистом, без подписок и комиссий со стороны платформы.",
                  metric: "напрямую, без посредников",
                },
              ].map((step) => (
                <View
                  key={step.num}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 14,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "800", fontSize: 14 }}>
                      {step.num}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                    {step.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                    {step.body}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600", marginTop: 4 }}>
                    {step.metric}
                  </Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Оставить запрос по ${fns.name}`}
              onPress={goCreateRequest}
              style={({ pressed }) => [
                {
                  marginTop: 4,
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
          </View>

          {/* Сотрудники — справочный блок про инспекцию, идёт ниже
              наших специалистов и отзывов (главного контента ради
              которого посетитель пришёл). */}
          {staff.length > 0 && (
            <View style={{ gap: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  paddingHorizontal: 4,
                }}
              >
                Сотрудники инспекции · {staff.length}
              </Text>
              {(() => {
                const groups = new Map<string, StaffMember[]>();
                for (const s of staff) {
                  const key = s.department ?? "Прочее";
                  const arr = groups.get(key) ?? [];
                  arr.push(s);
                  groups.set(key, arr);
                }
                return Array.from(groups.entries()).map(([dept, members]) => (
                  <View key={dept} style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: colors.text,
                        paddingHorizontal: 4,
                      }}
                    >
                      {dept}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      {members.map((s) => (
                        <View
                          key={s.id}
                          style={{
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            flexBasis: (isDesktop ? "calc(50% - 6px)" : "100%") as any,
                            flexGrow: 1,
                          }}
                        >
                          <StaffCard staff={s} />
                        </View>
                      ))}
                    </View>
                  </View>
                ));
              })()}
            </View>
          )}

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
                      <FnsLogo name={n.name} size="sm" />
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

        {/* Footer for visitors who scrolled to the bottom of the FNS page */}
        {!isAuthenticated && (
          <View style={{ width: "100%", marginTop: 24 }}>
            <FooterSection
              isDesktop={isDesktop}
              onHome={() => nav.routes.home()}
              onViewCatalog={() => nav.routes.specialists()}
              onFnsCatalog={() => nav.any("/fns")}
              onCreateRequest={() => nav.routes.requestsNew()}
              onBecomeSpecialist={() => nav.any("/login?intent=specialist")}
              onLegal={(t) =>
                t === "terms" ? nav.routes.legalTerms() : nav.routes.legalPrivacy()
              }
            />
          </View>
        )}
      </ScrollView>

      <ReportFnsModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        fnsName={fns.name}
      />
    </SafeAreaView>
  );
}

function ContactRow({
  label,
  value,
  href,
  copyable,
  multiline,
}: {
  label: string;
  value: string;
  href?: string;
  /** Если задано — клик копирует это значение (через CopyableValue). */
  copyable?: string;
  multiline?: boolean;
}) {
  const onPress = href
    ? () => {
        if (typeof window !== "undefined") {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      }
    : undefined;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600", minWidth: 100 }}>
        {label}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        {copyable ? (
          <CopyableValue value={value} copyValue={copyable} primaryColor oneLine />
        ) : onPress ? (
          <Pressable
            accessibilityRole="link"
            onPress={onPress}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text
              style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}
              numberOfLines={multiline ? 0 : 1}
            >
              {value}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}
            numberOfLines={multiline ? 0 : 1}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}
