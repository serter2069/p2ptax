import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Clock,
  ArrowRight,
  Star,
  Crown,
} from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import CopyableValue from "@/components/ui/CopyableValue";
import ErrorState from "@/components/ui/ErrorState";
import LandingHeader from "@/components/landing/LandingHeader";
import FooterSection from "@/components/landing/FooterSection";
import FnsLogo from "@/components/fns/FnsLogo";
import StaffCard, { type StaffCardData } from "@/components/fns/StaffCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface StaffDetail {
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
  fns: {
    id: string;
    name: string;
    code: string;
    workingHours: string | null;
    officialPhone: string | null;
    city: { id: string; name: string; slug: string };
  };
  colleagues: StaffCardData[];
}

interface StaffReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  source: string;
  createdAt: string;
}

/**
 * Публичный профиль сотрудника ИФНС. Структура:
 *   - Хедер
 *   - Back-link «Назад к ИФНС»
 *   - Hero: фото + ФИО + должность + отдел + ИФНС/город
 *   - Контакты (email/phone — копируются по клику)
 *   - Био-заглушка (под будущий контент)
 *   - Коллеги по отделу
 *   - Footer
 */
export default function FnsStaffPage() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const staffId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние формы отзыва (для авторизованных).
  const [formRating, setFormRating] = useState<number>(5);
  const [formText, setFormText] = useState<string>("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    try {
      const [staffRes, reviewsRes] = await Promise.all([
        api<StaffDetail>(`/api/fns-staff/${staffId}`, { noAuth: true }),
        api<{ items: StaffReview[] }>(
          `/api/fns-staff/${staffId}/reviews?limit=20`,
          { noAuth: true },
        ).catch(() => ({ items: [] })),
      ]);
      setStaff(staffRes);
      setReviews(reviewsRes.items ?? []);
    } catch {
      setError("Не удалось загрузить сотрудника");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  const submitReview = useCallback(async () => {
    if (!staffId) return;
    if (formText.trim().length < 10) {
      setFormError("Расскажите хотя бы пару предложений (минимум 10 символов).");
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      const created = await api<StaffReview>(`/api/fns-staff/${staffId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: formRating, text: formText.trim() }),
      });
      setReviews((prev) => [created, ...prev]);
      // Локально обновим кэш-агрегаты, чтобы UI сразу отразил новый отзыв.
      setStaff((prev) =>
        prev
          ? {
              ...prev,
              cachedReviewsCount: (prev.cachedReviewsCount ?? 0) + 1,
              cachedAvgRating:
                ((prev.cachedAvgRating ?? 0) * (prev.cachedReviewsCount ?? 0) + formRating) /
                ((prev.cachedReviewsCount ?? 0) + 1),
            }
          : prev,
      );
      setFormText("");
      setFormRating(5);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Не удалось отправить отзыв.");
    } finally {
      setFormSubmitting(false);
    }
  }, [staffId, formRating, formText]);

  useEffect(() => {
    void load();
  }, [load]);

  const fullName = staff
    ? `${staff.lastName} ${staff.firstName} ${staff.middleName ?? ""}`.trim()
    : "";

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

  if (error || !staff) {
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
          <ErrorState message={error ?? "Сотрудник не найден"} onRetry={load} />
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
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 0, alignItems: "center" }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: isDesktop ? 880 : "100%",
            gap: 16,
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          {/* Back */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Назад к ИФНС"
            onPress={() => router.push(`/fns/${staff.fns.id}` as never)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                alignSelf: "flex-start",
              },
              pressed && { backgroundColor: colors.accentSoft },
            ]}
          >
            <ArrowLeft size={16} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              К {staff.fns.name}
            </Text>
          </Pressable>

          {/* Hero — про сотрудника. Информация о ИФНС вынесена в
              отдельный блок «Место работы» ниже. */}
          <Card>
            <View
              style={{
                flexDirection: isDesktop ? "row" : "column",
                gap: 20,
                alignItems: isDesktop ? "flex-start" : "center",
              }}
            >
              <Avatar
                name={fullName}
                imageUrl={staff.photoUrl ?? undefined}
                size="xl"
              />
              <View style={{ flex: 1, minWidth: 0, alignItems: isDesktop ? "flex-start" : "center" }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Сотрудник налоговой инспекции
                </Text>
                <Text
                  style={{
                    fontSize: isDesktop ? 28 : 22,
                    fontWeight: "800",
                    color: colors.text,
                    marginTop: 6,
                    textAlign: isDesktop ? "left" : "center",
                  }}
                >
                  {fullName}
                </Text>
                <View
                  className="flex-row items-center"
                  style={{ gap: 6, marginTop: 8, flexWrap: "wrap", justifyContent: isDesktop ? "flex-start" : "center" }}
                >
                  <Briefcase size={15} color={colors.primary} />
                  <Text style={{ fontSize: 15, color: colors.primary, fontWeight: "700" }}>
                    {staff.position}
                  </Text>
                </View>
                {staff.department && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginTop: 4,
                      textAlign: isDesktop ? "left" : "center",
                    }}
                  >
                    {staff.department}
                  </Text>
                )}
                {staff.cachedAvgRating != null && staff.cachedReviewsCount != null && staff.cachedReviewsCount > 0 && (
                  <View
                    className="flex-row items-center"
                    style={{
                      gap: 4,
                      marginTop: 10,
                      justifyContent: isDesktop ? "flex-start" : "center",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        color={colors.warning ?? "#f5a623"}
                        fill={n <= Math.round(staff.cachedAvgRating ?? 0) ? colors.warning ?? "#f5a623" : "transparent"}
                      />
                    ))}
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 6 }}>
                      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>
                        {staff.cachedAvgRating.toFixed(1)}
                      </Text>
                      {" · "}
                      {staff.cachedReviewsCount}{" "}
                      {staff.cachedReviewsCount === 1 ? "отзыв" : "отзывов"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Место работы — отдельным блоком, крупно с гербом ФНС. */}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Перейти на страницу ${staff.fns.name}`}
            onPress={() => router.push(`/fns/${staff.fns.id}` as never)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                paddingVertical: isDesktop ? 18 : 14,
                paddingHorizontal: isDesktop ? 20 : 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.white,
              },
              pressed && { opacity: 0.85, borderColor: colors.primary },
            ]}
          >
            <FnsLogo name={staff.fns.name} cityName={staff.fns.city.name} size={isDesktop ? "lg" : "md"} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Место работы · код {staff.fns.code}
              </Text>
              <Text
                style={{
                  fontSize: isDesktop ? 18 : 16,
                  color: colors.text,
                  fontWeight: "700",
                  marginTop: 4,
                  lineHeight: isDesktop ? 24 : 22,
                }}
                numberOfLines={3}
              >
                {staff.fns.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                {staff.fns.city.name}
              </Text>
            </View>
            <ArrowRight size={18} color={colors.textMuted} />
          </Pressable>

          {/* Контакты */}
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
              {staff.phone && (
                <CopyableValue
                  value={staff.phone}
                  primaryColor
                  icon={<Phone size={14} color={colors.textMuted} />}
                />
              )}
              {staff.email && (
                <CopyableValue
                  value={staff.email}
                  primaryColor
                  icon={<Mail size={14} color={colors.textMuted} />}
                />
              )}
              {staff.fns.workingHours && (
                <View className="flex-row items-start" style={{ gap: 8 }}>
                  <Clock size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: colors.text,
                      lineHeight: 18,
                    }}
                  >
                    {staff.fns.workingHours}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Отзывы и рейтинг */}
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
              Отзывы о сотруднике
            </Text>

            {/* Форма для авторизованных */}
            {isAuthenticated ? (
              <View
                style={{
                  gap: 10,
                  paddingBottom: 16,
                  marginBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  Оставить отзыв
                </Text>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      accessibilityRole="button"
                      accessibilityLabel={`Поставить ${n} ${n === 1 ? "звезду" : "звёзд"}`}
                      onPress={() => setFormRating(n)}
                      hitSlop={4}
                    >
                      <Star
                        size={26}
                        color={colors.warning ?? "#f5a623"}
                        fill={n <= formRating ? colors.warning ?? "#f5a623" : "transparent"}
                      />
                    </Pressable>
                  ))}
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 8 }}>
                    {formRating} из 5
                  </Text>
                </View>
                <TextInput
                  value={formText}
                  onChangeText={setFormText}
                  placeholder="Расскажите про опыт общения: помогли ли разобраться, отвечает ли на запросы, что было хорошо или плохо."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={4}
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 10,
                    padding: 12,
                    minHeight: 88,
                    textAlignVertical: "top",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    outlineWidth: 0 as any,
                  }}
                />
                {formError && (
                  <Text style={{ fontSize: 12, color: colors.error }}>{formError}</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={formSubmitting}
                  onPress={submitReview}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 11,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      backgroundColor: formSubmitting ? colors.border : colors.primary,
                      alignItems: "center",
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>
                    {formSubmitting ? "Отправляем…" : "Опубликовать отзыв"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  marginBottom: 16,
                }}
              >
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>
                  Чтобы оставить отзыв, нужно войти.
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => nav.routes.login()}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700" }}>
                    Войти
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Список отзывов */}
            {reviews.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Пока нет отзывов. Будьте первым — поделитесь, как прошло общение.
              </Text>
            ) : (
              <View style={{ gap: 14 }}>
                {reviews.map((r, idx) => (
                  <View
                    key={r.id}
                    style={{
                      paddingBottom: idx === reviews.length - 1 ? 0 : 14,
                      borderBottomWidth: idx === reviews.length - 1 ? 0 : 1,
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
                            fill={n <= r.rating ? colors.warning ?? "#f5a623" : "transparent"}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                      {r.text}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Био-заглушка */}
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
              О сотруднике
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 21 }}>
              {fullName} — государственный налоговый инспектор, занимает
              должность «{staff.position.toLowerCase()}»
              {staff.department ? ` в подразделении «${staff.department}»` : ""}{" "}
              в составе {staff.fns.name}. Подробное досье и часы приёма
              появятся после публикации внутренних регламентов инспекции.
            </Text>
          </Card>

          {/* Коллеги по отделу */}
          {staff.colleagues.length > 0 && (
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
                {staff.department ?? "В этой инспекции"} · ещё {staff.colleagues.length}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {staff.colleagues.map((c) => (
                  <View
                    key={c.id}
                    style={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      flexBasis: (isDesktop ? "calc(50% - 6px)" : "100%") as any,
                      flexGrow: 1,
                    }}
                  >
                    <StaffCard staff={c} compact />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

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
    </SafeAreaView>
  );
}
