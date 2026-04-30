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
import ContactsSection from "@/components/specialist/ContactsSection";
import WorkAreaSection from "@/components/specialist/WorkAreaSection";
import SpecialistHero from "@/components/specialist/SpecialistHero";
import SpecialistAbout from "@/components/specialist/SpecialistAbout";
import SpecialistCredentials from "@/components/specialist/SpecialistCredentials";
import SpecialistServicesCities from "@/components/specialist/SpecialistServicesCities";
import SpecialistContactCTA from "@/components/specialist/SpecialistContactCTA";
import SpecialistGuestLockedContacts from "@/components/specialist/SpecialistGuestLockedContacts";
import SpecialistReviewsPlaceholder from "@/components/specialist/SpecialistReviewsPlaceholder";
import SpecialistMobileBottomCTA from "@/components/specialist/SpecialistMobileBottomCTA";
import type {
  SpecialistDetail,
  ContactMethodItem,
} from "@/components/specialist/types";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiPost } from "@/lib/api";
import { colors, textStyle, spacing, BREAKPOINT } from "@/lib/theme";

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
        console.error("Specialist detail error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const [writeLoading, setWriteLoading] = useState(false);

  const handleWritePress = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/specialists/${id}` as never);
      return;
    }
    if (writeLoading) return;
    setWriteLoading(true);
    try {
      const res = await apiPost<{ threadId: string }>("/api/threads/direct", { specialistId: id });
      nav.any(`/threads/${res.threadId}`);
    } catch {
      // Fallback: open new request form
      nav.routes.requestsNew();
    } finally {
      setWriteLoading(false);
    }
  }, [isAuthenticated, router, id, nav, writeLoading]);

  const handleSavePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=/specialists/${id}` as never);
      return;
    }
    setSavedBookmark((prev) => !prev);
    // Future: POST /api/bookmarks
  }, [isAuthenticated, router, id]);

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

  const name =
    [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") ||
    "Специалист";

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

  const yearsExp =
    profile?.yearsOfExperience ??
    Math.max(1, 2024 - new Date(specialist.createdAt).getFullYear());
  const specializations = profile?.specializations ?? [];
  const certifications = profile?.certifications ?? [];
  const isExFns = !!(profile?.exFnsStartYear && profile?.exFnsEndYear);

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

  const mainContent = (
    <View>
      <SpecialistHero
        name={name}
        avatarUrl={specialist.avatarUrl}
        isTablet={isTablet}
        rolePrimary="Налоговый консультант"
        cityLabel={cities[0] ?? "Россия"}
        isExFns={isExFns}
        exFnsStartYear={profile?.exFnsStartYear}
        exFnsEndYear={profile?.exFnsEndYear}
      />
      <SpecialistAbout description={profile?.description} />
      <SpecialistCredentials
        isTablet={isTablet}
        yearsExp={yearsExp}
        isExFns={isExFns}
        cities={cities}
        fnsCodes={fnsCodes}
        specializations={specializations}
        serviceNames={serviceNames}
        certifications={certifications}
      />
      <SpecialistServicesCities serviceNames={serviceNames} cities={cities} />
      <View className="mt-8">
        <WorkAreaSection
          fnsServices={specialist.fnsServices}
          cardShadow={legacyShadow}
        />
        {isAuthenticated ? (
          <ContactsSection
            contacts={contacts}
            officeAddress={profile?.officeAddress ?? null}
            workingHours={profile?.workingHours ?? null}
            cardShadow={legacyShadow}
          />
        ) : (
          <SpecialistGuestLockedContacts
            cardShadow={legacyShadow}
            onLogin={() => nav.any(`/login?returnTo=/specialists/${id}`)}
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
      onPress={() => nav.routes.settings()}
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
          <View
            className={`${isDesktop ? "flex-row" : "flex-col"} w-full`}
            style={{ maxWidth: 1200, gap: isDesktop ? spacing.xl : 0 }}
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
      {!isDesktop && !isOwnProfile && !isSpecialist && (
        <SpecialistMobileBottomCTA
          savedBookmark={savedBookmark}
          onWritePress={handleWritePress}
          onSavePress={handleSavePress}
        />
      )}
    </SafeAreaView>
  );
}
