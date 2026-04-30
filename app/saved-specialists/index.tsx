import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import { Bookmark, MessageCircle, User as UserIcon } from "lucide-react-native";
import { apiGet } from "@/lib/api";
import { colors } from "@/lib/theme";

interface CityRef {
  id: string;
  name: string;
}
interface FnsRef {
  id: string;
  fnsId: string;
  fnsName: string;
}
interface ServiceRef {
  id: string;
  name: string;
}

interface SpecialistItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  cities: CityRef[];
  fnsNames: FnsRef[];
  services: ServiceRef[];
  profile: {
    description: string | null;
    yearsOfExperience: number | null;
    exFnsStartYear: number | null;
  };
  casesCount: number;
  reviewsCount: number;
}

interface CityListResp {
  items: { id: string; name: string; slug: string }[];
}
interface FnsListResp {
  offices: { id: string; name: string; cityId: string }[];
}
interface ServiceListResp {
  items: { id: string; name: string }[];
}

function getInitials(firstName: string | null, lastName: string | null) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-full"
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.white,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text
        style={{
          color: active ? colors.white : colors.text,
          fontSize: 13,
          fontWeight: active ? "600" : "500",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface SpecialistFeedCardProps {
  item: SpecialistItem;
  onProfile: (id: string) => void;
  onMessage: (id: string) => void;
}

function SpecialistFeedCard({
  item,
  onProfile,
  onMessage,
}: SpecialistFeedCardProps) {
  const name =
    [item.firstName, item.lastName].filter(Boolean).join(" ") || "Специалист";
  const initials = getInitials(item.firstName, item.lastName);

  const cityNames = item.cities.map((c) => c.name);
  const visibleCities = cityNames.slice(0, 2).join(", ");
  const cityOverflow = cityNames.length - Math.min(cityNames.length, 2);

  const firstFns = item.fnsNames[0]?.fnsName ?? null;

  const visibleServices = item.services.slice(0, 2);
  const serviceOverflow = item.services.length - visibleServices.length;

  const desc = item.profile.description
    ? item.profile.description.length > 100
      ? item.profile.description.slice(0, 100) + "..."
      : item.profile.description
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onProfile(item.id)}
      className="bg-white rounded-2xl mb-3"
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 1,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View className="flex-row" style={{ gap: 14 }}>
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            style={{ width: 56, height: 56, borderRadius: 28, flexShrink: 0 }}
            accessibilityLabel={name}
          />
        ) : (
          <View
            className="items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              flexShrink: 0,
            }}
          >
            <Text
              style={{ color: colors.white, fontWeight: "700", fontSize: 18 }}
            >
              {initials}
            </Text>
          </View>
        )}

        {/* Main column */}
        <View className="flex-1" style={{ minWidth: 0, gap: 6 }}>
          {/* Name + availability */}
          <View
            className="flex-row items-center flex-wrap"
            style={{ gap: 8 }}
          >
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {item.isAvailable && (
              <View
                className="flex-row items-center rounded-full"
                style={{
                  backgroundColor: "#e7f7ee",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#22a558",
                  }}
                />
                <Text style={{ color: "#1f7a45", fontSize: 11, fontWeight: "600" }}>
                  Онлайн
                </Text>
              </View>
            )}
          </View>

          {/* Cities */}
          {cityNames.length > 0 && (
            <Text
              style={{ color: colors.textMuted, fontSize: 13 }}
              numberOfLines={1}
            >
              {visibleCities}
              {cityOverflow > 0 ? ` и ещё ${cityOverflow}` : ""}
            </Text>
          )}

          {/* FNS */}
          {firstFns && (
            <Text
              style={{ color: colors.textMuted, fontSize: 12 }}
              numberOfLines={1}
            >
              {firstFns}
              {item.fnsNames.length > 1
                ? ` · +${item.fnsNames.length - 1}`
                : ""}
            </Text>
          )}

          {/* Description preview */}
          {desc && (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {desc}
            </Text>
          )}

          {/* Service chips */}
          {visibleServices.length > 0 && (
            <View
              className="flex-row flex-wrap"
              style={{ gap: 6, marginTop: 2 }}
            >
              {visibleServices.map((s) => (
                <View
                  key={s.id}
                  className="rounded-full"
                  style={{
                    backgroundColor: colors.accentSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{ color: colors.primary, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </View>
              ))}
              {serviceOverflow > 0 && (
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    alignSelf: "center",
                  }}
                >
                  +{serviceOverflow}
                </Text>
              )}
            </View>
          )}

          {/* Site-since line */}
          {item.profile.exFnsStartYear && (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              Опыт с {item.profile.exFnsStartYear}
            </Text>
          )}

          {/* Action buttons */}
          <View
            className="flex-row flex-wrap"
            style={{ gap: 8, marginTop: 8 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Профиль"
              onPress={(e) => {
                e.stopPropagation?.();
                onProfile(item.id);
              }}
              className="flex-row items-center rounded-lg"
              style={({ pressed }) => [
                {
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  gap: 6,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <UserIcon size={14} color={colors.text} />
              <Text
                style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}
              >
                Профиль
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Написать"
              onPress={(e) => {
                e.stopPropagation?.();
                onMessage(item.id);
              }}
              className="flex-row items-center rounded-lg"
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  gap: 6,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <MessageCircle size={14} color={colors.white} />
              <Text
                style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}
              >
                Написать
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function SavedSpecialistsScreen() {
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [cityId, setCityId] = useState<string | null>(null);
  const [fnsId, setFnsId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  // Filter source data
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [fnsList, setFnsList] = useState<{ id: string; name: string; cityId: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      nav.replaceRoutes.login();
    }
  }, [authLoading, isAuthenticated, nav]);

  // Load filter source lists
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [c, s] = await Promise.all([
          apiGet<CityListResp>("/api/cities"),
          apiGet<ServiceListResp>("/api/services"),
        ]);
        setCities(c.items.map((it) => ({ id: it.id, name: it.name })));
        setServices(s.items);
      } catch {
        // soft fail — filters degrade gracefully
      }
    })();
  }, [isAuthenticated]);

  // Load FNS offices when a city is selected
  useEffect(() => {
    if (!cityId) {
      setFnsList([]);
      setFnsId(null);
      return;
    }
    (async () => {
      try {
        const r = await apiGet<FnsListResp>(`/api/fns?city_id=${cityId}`);
        setFnsList(
          r.offices.map((o) => ({ id: o.id, name: o.name, cityId: o.cityId }))
        );
      } catch {
        setFnsList([]);
      }
    })();
  }, [cityId]);

  const queryString = useMemo(() => {
    const parts: string[] = [];
    if (cityId) parts.push(`cityId=${encodeURIComponent(cityId)}`);
    if (fnsId) parts.push(`fnsId=${encodeURIComponent(fnsId)}`);
    if (serviceId) parts.push(`serviceId=${encodeURIComponent(serviceId)}`);
    return parts.length ? `?${parts.join("&")}` : "";
  }, [cityId, fnsId, serviceId]);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await apiGet<{ items: SpecialistItem[] }>(
        `/api/saved-specialists/full${queryString}`
      );
      setSpecialists(res.items);
    } catch {
      setSpecialists([]);
    }
  }, [queryString]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetchSaved().finally(() => setLoading(false));
  }, [isAuthenticated, fetchSaved]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSaved();
    setRefreshing(false);
  }, [fetchSaved]);

  const handleProfile = useCallback(
    (id: string) => nav.dynamic.specialist(id),
    [nav]
  );

  const handleMessage = useCallback(
    (id: string) => nav.any(`/messages?specialist=${encodeURIComponent(id)}`),
    [nav]
  );

  const handleResetFilters = useCallback(() => {
    setCityId(null);
    setFnsId(null);
    setServiceId(null);
  }, []);

  const hasAnyFilter = Boolean(cityId || fnsId || serviceId);

  if (authLoading || (loading && !refreshing)) {
    return (
      <SafeAreaView className="flex-1 bg-surface2 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {/* Header + filters region */}
      <View
        style={{
          width: "100%",
          maxWidth: isDesktop ? 800 : undefined,
          alignSelf: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 4,
        }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
          <Text className="text-xl font-bold text-text-base">
            Мои специалисты
          </Text>
          {hasAnyFilter && (
            <Pressable
              accessibilityRole="button"
              onPress={handleResetFilters}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Сбросить
              </Text>
            </Pressable>
          )}
        </View>

        {/* City filter */}
        {cities.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 6,
              }}
            >
              Город
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              <FilterChip
                label="Все"
                active={!cityId}
                onPress={() => {
                  setCityId(null);
                  setFnsId(null);
                }}
              />
              {cities.map((c) => (
                <FilterChip
                  key={c.id}
                  label={c.name}
                  active={cityId === c.id}
                  onPress={() => {
                    setCityId(c.id);
                    setFnsId(null);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* FNS filter (after city selected) */}
        {cityId && fnsList.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 6,
              }}
            >
              ИФНС
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              <FilterChip
                label="Все"
                active={!fnsId}
                onPress={() => setFnsId(null)}
              />
              {fnsList.map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.name}
                  active={fnsId === f.id}
                  onPress={() => setFnsId(f.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Service filter */}
        {services.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                marginBottom: 6,
              }}
            >
              Услуга
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              <FilterChip
                label="Все"
                active={!serviceId}
                onPress={() => setServiceId(null)}
              />
              {services.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.name}
                  active={serviceId === s.id}
                  onPress={() => setServiceId(s.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Feed */}
      {specialists.length === 0 ? (
        hasAnyFilter ? (
          <EmptyState
            icon={Bookmark}
            title="Ничего не найдено"
            subtitle="Попробуйте сбросить фильтры или изменить запрос"
            actionLabel="Сбросить фильтры"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Вы ещё не добавили специалистов в избранное"
            subtitle="Сохраняйте специалистов с страницы поиска, чтобы быстро возвращаться к ним позже"
            actionLabel="Найти специалиста"
            onAction={() => nav.routes.specialists()}
          />
        )
      ) : (
        <FlatList
          key="saved-feed"
          data={specialists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 48,
            maxWidth: isDesktop ? 800 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: "100%" as const,
          }}
          renderItem={({ item }) => (
            <SpecialistFeedCard
              item={item}
              onProfile={handleProfile}
              onMessage={handleMessage}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
