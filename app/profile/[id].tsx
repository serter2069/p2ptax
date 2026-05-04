import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import Head from "expo-router/head";
import { AlertCircle, Pencil, ChevronLeft } from "lucide-react-native";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ContactsView from "@/components/specialist/ContactsView";
import WorkAreaSection from "@/components/specialist/WorkAreaSection";
import SpecialistHero from "@/components/specialist/SpecialistHero";
import SpecialistAbout from "@/components/specialist/SpecialistAbout";
import SpecialistCredentials from "@/components/specialist/SpecialistCredentials";
import SpecialistContactCTA from "@/components/specialist/SpecialistContactCTA";
import SpecialistGuestLockedContacts from "@/components/specialist/SpecialistGuestLockedContacts";
import SpecialistReviewsPlaceholder from "@/components/specialist/SpecialistReviewsPlaceholder";
import SpecialistMobileBottomCTA from "@/components/specialist/SpecialistMobileBottomCTA";
import type {
  SpecialistDetail,
  ContactMethodItem,
} from "@/components/specialist/types";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors, textStyle, spacing, BREAKPOINT } from "@/lib/theme";
import { track } from "@/lib/analytics";

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const nav = useTypedRouter();
  const { user, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= BREAKPOINT;

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedBookmark, setSavedBookmark] = useState(false);

  const isOwnProfile = !!user && user.id === id;
  // Iter11 — specialist mode is an opt-in flag, not a role.
  const isSpecialist = user?.isSpecialist === true;

  // Wave 7 / contact-views: contacts gated behind 'Показать контакты'.
  // Initial load is authenticated so the server can detect the caller
  // (owner / already-revealed-viewer) and return contacts immediately.
  // revealed=false means the FE shows the reveal button; click → POST
  // /reveal logs the click + returns contacts.
  const [contactsRevealed, setContactsRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [specRes, contactsRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: ContactMethodItem[]; revealed: boolean }>(
            `/api/specialists/${id}/contacts`,
          ).catch(() => ({ items: [], revealed: false })),
        ]);
        setSpecialist(specRes);
        setContacts(contactsRes.items);
        setContactsRevealed(contactsRes.revealed);
      } catch (e) {
        setError("Не удалось загрузить профиль");
        if (__DEV__) console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleRevealContacts = useCallback(async () => {
    if (!id) return;
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/profile/${id}` as never);
      return;
    }
    setRevealing(true);
    try {
      const res = await apiPost<{ items: ContactMethodItem[]; revealed: boolean }>(
        `/api/specialists/${id}/contacts/reveal`,
        {},
      );
      setContacts(res.items);
      setContactsRevealed(true);
    } catch {
      // Silent — keeps existing UI state.
    } finally {
      setRevealing(false);
    }
  }, [id, isAuthenticated, router]);

  // Funnel — fire once per id mount. Re-fires when the user navigates between
  // specialist profiles, which is the desired granularity for PostHog cohorts.
  useEffect(() => {
    if (!id) return;
    track("specialist_profile_view", {
      specialistId: id,
      isOwn: isOwnProfile,
    });
  }, [id, isOwnProfile]);

  // Load initial saved state for authenticated users
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    apiGet<{ items: { id: string }[] }>("/api/specialists?savedOnly=true&page=1&limit=200")
      .then((r) => setSavedBookmark(r.items.some((s) => s.id === id)))
      .catch(() => {});
  }, [isAuthenticated, id]);

  const handleWritePress = useCallback(async () => {
    // 'Написать' is a direct DM, available on any profile (specialist or
    // client, open or closed). Server dedupes — calling this twice with
    // the same target lands on the same thread. Falls back to /requests/new
    // for the legacy 'send a request to this specialist' flow only when
    // the target is a specialist with an open public profile, since there
    // the request-creation form makes more sense than a bare chat box.
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/profile/${id}` as never);
      return;
    }
    if (!id) return;
    try {
      const res = await apiPost<{ threadId: string }>("/api/threads/direct", {
        targetUserId: id,
      });
      nav.dynamic.thread(res.threadId);
    } catch {
      // Fall back to the request-creation flow if the DM endpoint is
      // unavailable for some reason — keeps the button useful instead of
      // silently doing nothing.
      nav.any(`/requests/new?specialistId=${id}`);
    }
  }, [isAuthenticated, router, id, nav]);

  const handleSavePress = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/profile/${id}` as never);
      return;
    }
    const next = !savedBookmark;
    setSavedBookmark(next);
    try {
      if (next) {
        await apiPost(`/api/saved-specialists/${id}`, {});
      } else {
        await apiDelete(`/api/saved-specialists/${id}`);
      }
    } catch {
      // Revert on error
      setSavedBookmark(!next);
    }
  }, [isAuthenticated, router, id, savedBookmark]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  if (error || !specialist) {
    return (
      <SafeAreaView className="flex-1 bg-white">
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
              onPress={() => nav.routes.specialists()}
              fullWidth={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Closed profile — isAvailable = false
  const isClosed = !specialist.isAvailable;

  // Display name: open → firstName + lastName[0]+"." | closed → firstName + lastNameInitial
  const displayLastName = isClosed
    ? (specialist.lastNameInitial ?? null)
    : specialist.lastName
    ? specialist.lastName[0] + "."
    : null;
  const name =
    [specialist.firstName, displayLastName].filter(Boolean).join(" ") ||
    "Специалист";

  // Collect unique cities + FNS codes from fnsServices (open profiles only)
  const citySet = new Set<string>();
  const cities: string[] = [];
  const fnsCodes: string[] = [];
  const serviceNames = new Set<string>();
  for (const g of specialist.fnsServices ?? []) {
    if (!citySet.has(g.city.id)) {
      citySet.add(g.city.id);
      cities.push(g.city.name);
    }
    fnsCodes.push(g.fns.code);
    for (const s of g.services) serviceNames.add(s.name);
  }

  const profile = specialist.profile ?? null;

  const yearsExp =
    profile?.yearsOfExperience ??
    Math.max(1, 2024 - new Date(specialist.createdAt ?? new Date()).getFullYear());

  const ogDescription = profile?.description
    ? profile.description.slice(0, 160)
    : `Специалист по налогам ${cities.length > 0 ? `в ${cities[0]}` : ""}`.trim();

  // Card shadow used by embedded legacy sections
  const legacyShadow = {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  };

  // Role label: prefer the new long-form specializationText (Wave 6),
  // fall back to legacy specializations[0], then to the first
  // service-name from the work area. Same priority for the experience
  // line below the credentials strip.
  const profileSpec = (() => {
    const long = (specialist.profile as { specializationText?: string | null } | null)
      ?.specializationText;
    if (typeof long === "string" && long.trim()) return long.trim();
    const specs = (
      specialist.profile?.specializations as string[] | undefined
    ) ?? null;
    return specs && specs.length > 0 ? specs[0] : null;
  })();
  const rolePrimary = profileSpec ?? [...serviceNames][0] ?? null;
  const profileExperienceText =
    (specialist.profile as { experienceText?: string | null } | null)?.experienceText ??
    null;

  // Closed profile block shown instead of full content
  const closedBlock = (
    <View
      className="rounded-2xl items-center px-6 py-10 mt-4"
      style={{ backgroundColor: colors.surface2 }}
    >
      <View
        className="px-3 py-1 rounded-full mb-4 self-center"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Text
          className="text-xs font-semibold"
          style={{ color: colors.accentSoftInk }}
        >
          Профиль закрыт
        </Text>
      </View>
      <Text
        style={{ ...textStyle.h3, color: colors.text, textAlign: "center" }}
      >
        {name}
      </Text>
      <Text
        style={{
          ...textStyle.body,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Профиль не является публичным
      </Text>
    </View>
  );

  const mainContent = isClosed ? (
    <View>
      {closedBlock}
    </View>
  ) : (
    <View>
      <SpecialistHero
        name={name}
        avatarUrl={specialist.avatarUrl}
        isTablet={isTablet}
        rolePrimary={rolePrimary}
        cityLabel={cities[0] ?? null}
        isExFns={false}
      />
      <SpecialistAbout description={profile?.description} />
      <SpecialistCredentials
        isTablet={isTablet}
        yearsExp={yearsExp}
        cities={cities}
        serviceNames={serviceNames}
        experienceText={profileExperienceText}
        specializationText={
          (specialist.profile as { specializationText?: string | null } | null)
            ?.specializationText ?? null
        }
      />
      <View className="mt-8">
        <WorkAreaSection
          fnsServices={specialist.fnsServices ?? []}
          cardShadow={legacyShadow}
        />
        {!isAuthenticated ? (
          <SpecialistGuestLockedContacts
            cardShadow={legacyShadow}
            onLogin={() => nav.dynamic.loginWithReturnTo(`/profile/${id}`)}
          />
        ) : contactsRevealed ? (
          <ContactsView
            contacts={contacts}
            officeAddress={profile?.officeAddress ?? null}
            workingHours={profile?.workingHours ?? null}
            cardShadow={legacyShadow}
          />
        ) : (
          /* Reveal CTA — click logs the view (server records viewerId,
             ip, UA, ownerId, ts) before returning the contact list. */
          <View
            className="bg-white rounded-2xl border border-border mx-4 mt-4 px-4 py-5"
            style={legacyShadow}
          >
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 3,
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              КОНТАКТЫ
            </Text>
            <Text
              className="text-sm leading-5 mb-4"
              style={{ color: colors.textSecondary }}
            >
              Телефон, Telegram, WhatsApp и другие способы связи —
              нажмите, чтобы увидеть.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Показать контакты"
              onPress={handleRevealContacts}
              disabled={revealing}
              className="items-center justify-center rounded-xl py-3 px-4"
              style={{
                backgroundColor: revealing ? colors.surface2 : colors.primary,
                opacity: revealing ? 0.7 : 1,
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: revealing ? colors.textSecondary : colors.white }}
              >
                {revealing ? "Открываем…" : "Показать контакты"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
      <SpecialistReviewsPlaceholder cardShadow={legacyShadow} />
    </View>
  );

  const rightAction = isOwnProfile ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Редактировать профиль"
      onPress={() => nav.routes.profile()}
    >
      <Pencil size={16} color={colors.text} />
    </Pressable>
  ) : null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface2 }}>
      <Head>
        <title>{name} — специалист по налогам | P2PTax</title>
        <meta
          property="og:title"
          content={`${name} — специалист по налогам | P2PTax`}
        />
        <meta property="og:description" content={ogDescription} />
        <meta
          property="og:url"
          content={`https://p2ptax.ru/profile/${id}`}
        />
        <meta property="og:type" content="profile" />
      </Head>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: isDesktop ? 48 : 120 }}
      >
        <View
          className="w-full items-center"
          style={{ paddingHorizontal: isDesktop ? 32 : 16, paddingTop: 16 }}
        >
          {!isDesktop && (
            <View
              className="w-full flex-row items-center justify-between mb-3"
              style={{ maxWidth: 720 }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Назад"
                onPress={() => router.back()}
                className="flex-row items-center"
                style={{ minHeight: 44 }}
              >
                <ChevronLeft size={20} color={colors.text} />
                <Text className="text-text-base ml-1">Назад</Text>
              </Pressable>
              {rightAction}
            </View>
          )}
          <View
            // House rule: detail pages share 960 cap with feeds (CLAUDE.md).
            className={`${isDesktop ? "flex-row" : "flex-col"} w-full`}
            style={{ maxWidth: 960, gap: isDesktop ? spacing.xl : 0 }}
          >
            {/* Main column flows naturally inside 960 wrapper */}
            <View className="flex-1">
              {isDesktop && (
                <View className="flex-row items-center justify-between mb-4">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Назад"
                    onPress={() => router.back()}
                    className="flex-row items-center"
                    style={{ minHeight: 44 }}
                  >
                    <ChevronLeft size={20} color={colors.text} />
                    <Text className="text-text-base ml-1">Назад</Text>
                  </Pressable>
                  {rightAction}
                </View>
              )}
              {mainContent}
            </View>

            {/* Right sidebar (desktop only). 'Написать' is now available
                on every non-own profile — clients, specialists, even
                closed accounts — because the underlying flow is a direct
                DM (POST /api/threads/direct), not a request-creation. */}
            {isDesktop && !isOwnProfile && (
              <View style={{ width: 320 }}>
                <View style={{ position: "sticky" as "relative", top: 24 }}>
                  <SpecialistContactCTA
                    firstName={specialist.firstName}
                    isAuthenticated={isAuthenticated}
                    isSpecialist={isSpecialist}
                    savedBookmark={savedBookmark}
                    onWritePress={handleWritePress}
                    onSavePress={handleSavePress}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Own profile banner. When the user is viewing their own *closed*
            profile, replace the bare "Это вы" pill with a preview hint —
            this is exactly what other people see, plus a route back to the
            toggle that re-opens the profile. */}
        {isOwnProfile && (
          isClosed ? (
            <View
              className="mx-4 mt-6 mb-4 rounded-2xl px-5 py-4"
              style={{ backgroundColor: colors.surface2 }}
            >
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.text }}
              >
                Так ваш профиль видят другие
              </Text>
              <Text
                className="text-xs leading-5"
                style={{ color: colors.textSecondary }}
              >
                Имя и первая буква фамилии — больше ничего. Чтобы вернуть
                полный профиль в каталог, включите{" "}
                <Text className="font-semibold" style={{ color: colors.text }}>
                  «Публичный профиль»
                </Text>{" "}
                на странице{" "}
                <Text
                  accessibilityRole="link"
                  onPress={() => nav.routes.profile()}
                  className="font-semibold underline"
                  style={{ color: colors.accent }}
                >
                  Профиль
                </Text>
                .
              </Text>
            </View>
          ) : (
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
          )
        )}
      </ScrollView>

      {/* Mobile sticky bottom CTA — same eligibility as the desktop
          sidebar: any non-own profile, regardless of role / open state. */}
      {!isDesktop && !isOwnProfile && (
        <SpecialistMobileBottomCTA
          savedBookmark={savedBookmark}
          onWritePress={handleWritePress}
          onSavePress={handleSavePress}
        />
      )}
    </SafeAreaView>
  );
}
