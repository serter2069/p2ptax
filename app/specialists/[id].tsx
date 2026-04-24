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
import Head from "expo-router/head";
import { AlertCircle, Pencil } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import SpecialistCard from "@/components/SpecialistCard";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import ProfileHero from "@/components/specialist/ProfileHero";
import StatsRow from "@/components/specialist/StatsRow";
import WorkAreaSection from "@/components/specialist/WorkAreaSection";
import ContactsSection from "@/components/specialist/ContactsSection";
import type { SpecialistDetail, ContactMethodItem, SimilarSpecialist } from "@/components/specialist/types";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { colors, textStyle } from "@/lib/theme";
import EmptyState from "@/components/ui/EmptyState";

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

export default function SpecialistPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;

  const [specialist, setSpecialist] = useState<SpecialistDetail | null>(null);
  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [similar, setSimilar] = useState<SimilarSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !!user && user.id === id;
  const isSpecialist = user?.role === "SPECIALIST";

  useEffect(() => {
    async function load() {
      try {
        const [specRes, similarRes, contactsRes] = await Promise.all([
          api<SpecialistDetail>(`/api/specialists/${id}`, { noAuth: true }),
          api<{ items: SimilarSpecialist[] }>("/api/specialists/featured", { noAuth: true }),
          api<{ items: ContactMethodItem[] }>(`/api/specialists/${id}/contacts`, { noAuth: true }),
        ]);
        setSpecialist(specRes);
        setSimilar(similarRes.items.filter((s) => s.id !== id));
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

  const handleSimilarPress = useCallback(
    (specId: string) => {
      router.push(`/specialists/${specId}` as never);
    },
    [router]
  );

  const handleWritePress = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/auth/email" as never);
    } else {
      router.push("/requests/new" as never);
    }
  }, [isAuthenticated, router]);

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
          <Text style={{ ...textStyle.h3, color: colors.text, marginTop: 16, textAlign: "center" }}>
            Специалист не найден
          </Text>
          <Text style={{ ...textStyle.small, color: colors.textSecondary, marginTop: 8, textAlign: "center" }}>
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
    [specialist.firstName, specialist.lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(specialist.firstName, specialist.lastName);

  // Collect unique cities from fnsServices
  const citySet = new Set<string>();
  const cities: string[] = [];
  for (const g of specialist.fnsServices) {
    if (!citySet.has(g.city.id)) {
      citySet.add(g.city.id);
      cities.push(g.city.name);
    }
  }

  const fnsCount = specialist.fnsServices.length;
  const servicesCount = new Set(specialist.fnsServices.flatMap((g) => g.services.map((s) => s.id))).size;

  const rightAction = isOwnProfile ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Редактировать профиль"
      onPress={() => router.push("/settings" as never)}
    >
      <Pencil size={16} color={colors.text} />
    </Pressable>
  ) : undefined;

  const cardShadow = {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  const ogDescription = specialist.profile?.description
    ? specialist.profile.description.slice(0, 160)
    : `Специалист по налогам P2P ${cities.length > 0 ? `в ${cities[0]}` : ""}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Head>
        <title>{name} — специалист по налогам P2P | P2PTax</title>
        <meta property="og:title" content={`${name} — специалист по налогам P2P | P2PTax`} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={`https://p2ptax.ru/specialists/${id}`} />
        <meta property="og:type" content="profile" />
      </Head>
      <HeaderBack title="Профиль специалиста" rightAction={rightAction} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
          <View className="py-4" style={{ paddingBottom: isDesktop ? 32 : 0 }}>
            <ProfileHero
              name={name}
              initials={initials}
              cities={cities}
              isAvailable={specialist.isAvailable}
              createdAt={specialist.createdAt}
              isOwnProfile={isOwnProfile}
              isSpecialist={isSpecialist}
              onWritePress={handleWritePress}
            />

            <StatsRow
              requestsCount={specialist.requestsCount ?? fnsCount}
              fnsCount={fnsCount}
              servicesCount={servicesCount}
            />

            {/* About */}
            {specialist.profile?.description ? (
              <View
                className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
                style={cardShadow}
              >
                <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                  О СЕБЕ
                </Text>
                <Text className="text-base leading-6" style={{ color: colors.textSecondary }}>
                  {specialist.profile.description}
                </Text>
              </View>
            ) : null}

            <WorkAreaSection fnsServices={specialist.fnsServices} cardShadow={cardShadow} />

            <ContactsSection
              contacts={contacts}
              officeAddress={specialist.profile?.officeAddress ?? null}
              workingHours={specialist.profile?.workingHours ?? null}
              cardShadow={cardShadow}
            />

            {/* Reviews */}
            <View
              className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
              style={cardShadow}
            >
              <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                ОТЗЫВЫ
              </Text>
              <EmptyState title="Пока нет отзывов" subtitle="Отзывы появятся после завершения первых заявок" />
            </View>

            {/* Similar specialists */}
            <View className="mx-4 mt-4 mb-4">
              <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 3, marginBottom: 8 }}>
                ПОХОЖИЕ СПЕЦИАЛИСТЫ
              </Text>
              {similar.length === 0 ? (
                <EmptyState title="Нет похожих специалистов" subtitle="В вашем регионе пока нет других специалистов" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {similar.slice(0, 5).map((s) => (
                    <SpecialistCard
                      key={s.id}
                      id={s.id}
                      firstName={s.firstName}
                      lastName={s.lastName}
                      avatarUrl={s.avatarUrl}
                      services={s.services}
                      cities={s.cities}
                      onPress={handleSimilarPress}
                      variant="horizontal"
                    />
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Own profile banner */}
            {isOwnProfile && (
              <View className="mx-4 mt-2 mb-4 rounded-xl py-3.5 items-center" style={{ backgroundColor: colors.surface2 }}>
                <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Это вы</Text>
              </View>
            )}

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
