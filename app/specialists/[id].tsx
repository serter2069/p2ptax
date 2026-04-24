import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import {
  AlertCircle,
  Pencil,
  ShieldCheck,
  Briefcase,
  Target,
  ScrollText,
  Bookmark,
} from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import Avatar from "@/components/ui/Avatar";
import RatingStars from "@/components/ui/RatingStars";
import MetricCard from "@/components/ui/MetricCard";
import CaseCard from "@/components/specialist/CaseCard";
import ReviewCard from "@/components/specialist/ReviewCard";
import ContactsSection from "@/components/specialist/ContactsSection";
import WorkAreaSection from "@/components/specialist/WorkAreaSection";
import type {
  SpecialistDetail,
  ContactMethodItem,
  SpecialistCaseItem,
} from "@/components/specialist/types";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { colors, textStyle, spacing } from "@/lib/theme";

function getInitials(
  firstName: string | null,
  lastName: string | null,
): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

const CASE_FILTERS: Array<{ label: string; match: (c: SpecialistCaseItem) => boolean }> = [
  { label: "Все", match: () => true },
  { label: "Выездные", match: (c) => /выездн/i.test(c.category) },
  { label: "Камеральные", match: (c) => /камеральн/i.test(c.category) },
  { label: "115-ФЗ", match: (c) => /115|блокировк/i.test(c.category) },
];

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 640;

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [caseFilter, setCaseFilter] = useState(0);
  const [casesExpanded, setCasesExpanded] = useState(false);

  const isOwnProfile = !!user && user.id === id;
  const isSpecialist = user?.role === "SPECIALIST";

  useEffect(() => {
    async function load() {
      try {
        const [specRes, contactsRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: ContactMethodItem[] }>(
            `/api/specialists/${id}/contacts`,
            { noAuth: true },
          ),
        ]);
        setSpecialist(specRes);
        setContacts(contactsRes.items);
      } catch (e) {
        setError("Не удалось загрузить профиль");
        console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleWritePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push(
        `/auth/email?returnTo=/specialists/${id}` as never,
      );
    } else {
      router.push("/requests/new" as never);
    }
  }, [isAuthenticated, router, id]);

  const handleSavePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push(
        `/auth/email?returnTo=/specialists/${id}` as never,
      );
    }
    // Future: POST /api/bookmarks
  }, [isAuthenticated, router, id]);

  // Filter cases
  const filteredCases = useMemo(() => {
    const all = specialist?.cases ?? [];
    return all.filter(CASE_FILTERS[caseFilter].match);
  }, [specialist?.cases, caseFilter]);

  const visibleCases = casesExpanded ? filteredCases : filteredCases.slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Профиль специалиста" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  if (error || !specialist) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <HeaderBack title="Профиль специалиста" />
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={48} color={colors.placeholder} />
          <Text
            style={{
              ...textStyle.h3,
              color: colors.text,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Специалист не найден
          </Text>
          <Text
            style={{
              ...textStyle.small,
              color: colors.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Возможно, профиль был удалён или вы перешли по неверной ссылке
          </Text>
          <View className="mt-6">
            <Button
              label="Назад к каталогу"
              onPress={() => router.push("/specialists" as never)}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const name =
    [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") ||
    "Специалист";
  const initials = getInitials(specialist.firstName, specialist.lastName);

  // Collect unique cities + FNS codes from fnsServices
  const citySet = new Set<string>();
  const cities: string[] = [];
  const fnsCodes: string[] = [];
  const serviceNames = new Set<string>();
  for (const g of specialist.fnsServices) {
    if (!citySet.has(g.city.id)) {
      citySet.add(g.city.id);
      cities.push(g.city.name);
    }
    fnsCodes.push(g.fns.code);
    for (const s of g.services) serviceNames.add(s.name);
  }

  const profile = specialist.profile;
  const cases = specialist.cases ?? [];
  const reviews = specialist.reviews ?? [];
  const reviewCount = specialist.reviewCount ?? reviews.length;
  const averageRating = specialist.averageRating ?? null;

  const yearsExp =
    profile?.yearsOfExperience ?? Math.max(1, 2024 - new Date(specialist.createdAt).getFullYear());
  const specializations = profile?.specializations ?? [];
  const certifications = profile?.certifications ?? [];
  const isExFns = profile?.exFnsStartYear && profile?.exFnsEndYear;

  const rightAction = isOwnProfile ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Редактировать профиль"
      onPress={() => router.push("/settings" as never)}
    >
      <Pencil size={16} color={colors.text} />
    </Pressable>
  ) : undefined;

  const ogDescription = profile?.description
    ? profile.description.slice(0, 160)
    : `Специалист по налогам ${cities.length > 0 ? `в ${cities[0]}` : ""}`.trim();

  const rolePrimary = "Налоговый консультант";
  const cityLabel = cities[0] ?? "Россия";

  // ─── Render pieces ─────────────────────────────────────────────────

  const hero = (
    <View
      className={`${isTablet ? "flex-row" : "flex-col"} items-start`}
      style={{ gap: isTablet ? spacing.lg : spacing.base }}
    >
      <Avatar
        name={name}
        imageUrl={specialist.avatarUrl ?? undefined}
        size={isTablet ? 160 : 96}
        tint={colors.accentSoft}
        inkColor={colors.accentSoftInk}
      />
      <View className="flex-1">
        <Text style={{ ...textStyle.h1, color: colors.text }}>{name}</Text>
        <Text
          style={{
            ...textStyle.body,
            color: colors.textSecondary,
            marginTop: 4,
          }}
        >
          {rolePrimary} · {cityLabel}
        </Text>

        {fnsCodes.length > 0 && (
          <View
            className="flex-row flex-wrap mt-3"
            style={{ gap: 6 }}
          >
            {fnsCodes.slice(0, 4).map((code) => (
              <View
                key={code}
                className="px-2 py-1 rounded-md"
                style={{ backgroundColor: colors.surface2 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: colors.textSecondary,
                    letterSpacing: 0.5,
                  }}
                >
                  ИФНС №{code}
                </Text>
              </View>
            ))}
            {fnsCodes.length > 4 && (
              <View
                className="px-2 py-1 rounded-md"
                style={{ backgroundColor: colors.surface2 }}
              >
                <Text
                  style={{ fontSize: 12, color: colors.textMuted }}
                >
                  +{fnsCodes.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}

        <View
          className="flex-row items-center flex-wrap mt-3"
          style={{ gap: 10 }}
        >
          <RatingStars
            rating={averageRating ?? 0}
            size={14}
            showNumber
            reviewCount={reviewCount}
          />
          {cases.length > 0 && (
            <>
              <Text style={{ color: colors.textMuted }}>·</Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.text }}
              >
                {cases.length} {cases.length === 1 ? "дело" : cases.length < 5 ? "дела" : "дел"}
              </Text>
            </>
          )}
        </View>

        {isExFns && (
          <View
            className="flex-row items-center self-start mt-3 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "#fef3c7", gap: 6 }}
          >
            <ShieldCheck size={14} color="#b45309" />
            <Text
              className="text-xs font-semibold"
              style={{ color: "#b45309" }}
            >
              Ex-ФНС {profile?.exFnsStartYear}–{profile?.exFnsEndYear}
            </Text>
          </View>
        )}

        <View
          className={`${isTablet ? "flex-row" : "flex-col"} mt-4`}
          style={{ gap: 8 }}
        >
          {!isOwnProfile && !isSpecialist && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Написать"
              onPress={handleWritePress}
              className="rounded-xl px-6 h-11 items-center justify-center flex-row"
              style={{
                backgroundColor: colors.primary,
                alignSelf: isTablet ? "flex-start" : "stretch",
              }}
            >
              <Text className="text-white font-semibold text-sm">Написать</Text>
              <Text className="text-white text-sm ml-2">· бесплатно</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  // Credentials 3-up grid
  const credentialsBlock = (
    <View className="mt-8">
      <View
        className={`${isTablet ? "flex-row" : "flex-col"}`}
        style={{ gap: spacing.md }}
      >
        <MetricCard
          icon={Briefcase}
          title="Опыт"
          value={`${yearsExp} ${yearsExp === 1 ? "год" : yearsExp < 5 ? "года" : "лет"}`}
          lines={
            isExFns
              ? [
                  `Ex-ФНС ${cities[0] ?? ""}`,
                  fnsCodes.length > 0
                    ? `ИФНС ${fnsCodes.slice(0, 2).map((c) => `№${c}`).join(", ")}`
                    : "",
                ].filter(Boolean)
              : [
                  `Налоговая практика`,
                  cities.length > 0 ? `Регион: ${cities.join(", ")}` : "",
                ].filter(Boolean)
          }
        />
        <MetricCard
          icon={Target}
          title="Специализация"
          value={
            specializations.length > 0
              ? specializations[0]
              : [...serviceNames][0] ?? "Налоговая практика"
          }
          lines={
            specializations.length > 0
              ? specializations.slice(1, 4)
              : [...serviceNames].slice(1, 4)
          }
        />
        <MetricCard
          icon={ScrollText}
          title="Сертификации"
          value={
            certifications.length > 0
              ? certifications[0]
              : "Практикующий консультант"
          }
          lines={certifications.slice(1, 4)}
        />
      </View>
    </View>
  );

  // Cases section
  const casesBlock = (
    <View className="mt-8">
      <View
        className="flex-row items-center justify-between mb-4"
        style={{ gap: 8 }}
      >
        <Text style={{ ...textStyle.h2, color: colors.text }}>
          Избранные дела ({cases.length})
        </Text>
      </View>

      {cases.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <View className="flex-row" style={{ gap: 6 }}>
            {CASE_FILTERS.map((f, i) => {
              const active = caseFilter === i;
              return (
                <Pressable
                  key={f.label}
                  onPress={() => setCaseFilter(i)}
                  accessibilityRole="button"
                  className="px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: active ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {cases.length === 0 ? (
        <View
          className="rounded-2xl border border-border p-6 items-center"
          style={{ backgroundColor: colors.surface2 }}
        >
          <Text
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Пока нет опубликованных дел
          </Text>
        </View>
      ) : filteredCases.length === 0 ? (
        <View
          className="rounded-2xl border border-border p-6 items-center"
          style={{ backgroundColor: colors.surface2 }}
        >
          <Text
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Нет дел по выбранному фильтру
          </Text>
        </View>
      ) : (
        <>
          {visibleCases.map((c) => (
            <CaseCard key={c.id} case={c} />
          ))}
          {filteredCases.length > 3 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCasesExpanded((v) => !v)}
              className="items-center justify-center py-3 rounded-xl border border-border"
              style={{ backgroundColor: colors.surface }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                {casesExpanded
                  ? "Свернуть"
                  : `Показать ещё ${filteredCases.length - 3}`}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );

  // Reviews section
  const reviewsBlock = (
    <View className="mt-8">
      <View
        className="flex-row items-end justify-between mb-4"
        style={{ gap: 8 }}
      >
        <Text style={{ ...textStyle.h2, color: colors.text }}>
          Отзывы клиентов ({reviewCount})
        </Text>
        {averageRating !== null && (
          <View className="items-end">
            <Text
              style={{ ...textStyle.h1, color: colors.text, fontSize: 28 }}
            >
              {averageRating.toFixed(1)}
            </Text>
            <RatingStars rating={averageRating} size={14} />
          </View>
        )}
      </View>
      {reviews.length === 0 ? (
        <View
          className="rounded-2xl border border-border p-6 items-center"
          style={{ backgroundColor: colors.surface2 }}
        >
          <Text
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Пока нет отзывов
          </Text>
        </View>
      ) : (
        reviews.slice(0, 3).map((r) => <ReviewCard key={r.id} review={r} />)
      )}
    </View>
  );

  // Services & cities
  const servicesCitiesBlock = (
    <View className="mt-8">
      {serviceNames.size > 0 && (
        <View className="mb-6">
          <Text
            className="uppercase mb-3"
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: colors.textSecondary,
              fontWeight: "600",
            }}
          >
            Услуги
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {[...serviceNames].map((s) => (
              <View
                key={s}
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.accentSoftInk }}
                >
                  {s}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {cities.length > 0 && (
        <View>
          <Text
            className="uppercase mb-3"
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: colors.textSecondary,
              fontWeight: "600",
            }}
          >
            Города
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {cities.map((city) => (
              <View
                key={city}
                className="px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: colors.text }}
                >
                  {city}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  // Sidebar / sticky CTA (desktop right column; mobile bottom)
  const ctaContent = (
    <View
      className="rounded-2xl border border-border p-5"
      style={{
        backgroundColor: colors.surface,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <Text style={{ ...textStyle.h3, color: colors.text, marginBottom: 8 }}>
        Написать {specialist.firstName ?? "специалисту"}
      </Text>
      <Text
        className="text-sm leading-5 mb-2"
        style={{ color: colors.textSecondary }}
      >
        Ваша заявка будет прочитана в течение рабочего дня.
      </Text>
      <View
        className="flex-row items-center px-2.5 py-1.5 rounded-md self-start mb-4"
        style={{ backgroundColor: colors.greenSoft, gap: 6 }}
      >
        <View
          className="rounded-full"
          style={{ width: 6, height: 6, backgroundColor: colors.success }}
        />
        <Text
          className="text-xs font-semibold"
          style={{ color: colors.success }}
        >
          Первое сообщение — бесплатно
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Написать"
        onPress={handleWritePress}
        className="items-center justify-center rounded-xl flex-row"
        style={{
          backgroundColor: colors.primary,
          height: 56,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Text className="text-white font-semibold text-base">Написать</Text>
      </Pressable>

      {isAuthenticated && !isSpecialist && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Сохранить"
          onPress={handleSavePress}
          className="items-center justify-center rounded-xl flex-row mt-2 border border-border"
          style={{ backgroundColor: colors.surface, height: 44, gap: 6 }}
        >
          <Bookmark size={14} color={colors.textSecondary} />
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.textSecondary }}
          >
            Сохранить
          </Text>
        </Pressable>
      )}
    </View>
  );

  const aboutBlock = profile?.description ? (
    <View className="mt-8">
      <Text
        className="uppercase mb-3"
        style={{
          fontSize: 11,
          letterSpacing: 3,
          color: colors.textSecondary,
          fontWeight: "600",
        }}
      >
        О специалисте
      </Text>
      <Text
        className="text-base leading-7"
        style={{ color: colors.text }}
      >
        {profile.description}
      </Text>
    </View>
  ) : null;

  // Cards with lighter shadow for embedded legacy sections
  const legacyShadow = {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  };

  const mainContent = (
    <View>
      {hero}
      {aboutBlock}
      {credentialsBlock}
      {casesBlock}
      {reviewsBlock}
      {servicesCitiesBlock}
      <View className="mt-8">
        <WorkAreaSection
          fnsServices={specialist.fnsServices}
          cardShadow={legacyShadow}
        />
        <ContactsSection
          contacts={contacts}
          officeAddress={profile?.officeAddress ?? null}
          workingHours={profile?.workingHours ?? null}
          cardShadow={legacyShadow}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: "#fafbfc" }}>
      <Head>
        <title>{name} — специалист по налогам | P2PTax</title>
        <meta
          property="og:title"
          content={`${name} — специалист по налогам | P2PTax`}
        />
        <meta property="og:description" content={ogDescription} />
        <meta
          property="og:url"
          content={`https://p2ptax.ru/specialists/${id}`}
        />
        <meta property="og:type" content="profile" />
      </Head>
      <HeaderBack title="Профиль специалиста" rightAction={rightAction} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isDesktop ? 48 : 120,
        }}
      >
        <View
          className="w-full items-center"
          style={{ paddingHorizontal: isDesktop ? 32 : 16, paddingTop: 16 }}
        >
          <View
            className={`${isDesktop ? "flex-row" : "flex-col"} w-full`}
            style={{
              maxWidth: 1200,
              gap: isDesktop ? spacing.xl : 0,
            }}
          >
            {/* Main column */}
            <View
              className="flex-1"
              style={{ maxWidth: isDesktop ? 860 : undefined }}
            >
              {mainContent}
            </View>

            {/* Right sidebar (desktop only) */}
            {isDesktop && !isOwnProfile && !isSpecialist && (
              <View style={{ width: 320 }}>
                <View
                  style={{
                    position: "sticky" as "relative",
                    top: 24,
                  }}
                >
                  {ctaContent}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Own profile banner */}
        {isOwnProfile && (
          <View
            className="mx-4 mt-6 mb-4 rounded-xl py-3.5 items-center"
            style={{ backgroundColor: colors.surface2 }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.textSecondary }}
            >
              Это вы
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Mobile sticky bottom CTA */}
      {!isDesktop && !isOwnProfile && !isSpecialist && (
        <View
          className="border-t border-border"
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Написать"
            onPress={handleWritePress}
            className="items-center justify-center rounded-xl flex-row"
            style={{
              backgroundColor: colors.primary,
              height: 52,
            }}
          >
            <Text className="text-white font-semibold text-base">
              Написать
            </Text>
            <Text className="text-white text-sm ml-2 opacity-80">
              · первое сообщение бесплатно
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
