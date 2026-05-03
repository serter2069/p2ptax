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
        if (__DEV__) console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

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

  const handleWritePress = useCallback(() => {
    const targetPath = `/requests/new?specialistId=${id}`;
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(targetPath)}` as never);
    } else {
      nav.any(targetPath);
    }
  }, [isAuthenticated, router, id, nav]);

  const handleSavePress = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/specialists/${id}` as never);
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

  // Role label is derived from the first service the specialist offers via
  // their work-area entries (the only thing actually editable in settings).
  const rolePrimary = [...serviceNames][0] ?? null;

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
        Специалист временно не принимает новых клиентов
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
      />
      <View className="mt-8">
        <WorkAreaSection
          fnsServices={specialist.fnsServices ?? []}
          cardShadow={legacyShadow}
        />
        {isAuthenticated ? (
          <ContactsView
            contacts={contacts}
            officeAddress={profile?.officeAddress ?? null}
            workingHours={profile?.workingHours ?? null}
            cardShadow={legacyShadow}
          />
        ) : (
          <SpecialistGuestLockedContacts
            cardShadow={legacyShadow}
            onLogin={() => nav.dynamic.loginWithReturnTo(`/specialists/${id}`)}
          />
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
          content={`https://p2ptax.ru/specialists/${id}`}
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

            {/* Right sidebar (desktop only) */}
            {isDesktop && !isOwnProfile && !isSpecialist && !isClosed && (
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
      {!isDesktop && !isOwnProfile && !isSpecialist && !isClosed && (
        <SpecialistMobileBottomCTA
          savedBookmark={savedBookmark}
          onWritePress={handleWritePress}
          onSavePress={handleSavePress}
        />
      )}
    </SafeAreaView>
  );
}
