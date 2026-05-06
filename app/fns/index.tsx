import { useEffect, useState, useCallback, useMemo } from "react";
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
  Search,
  Building2,
  Users,
  FileText,
  ArrowRight,
  MapPin,
  Star,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import LandingHeader from "@/components/landing/LandingHeader";
import FooterSection from "@/components/landing/FooterSection";
import FnsLogo from "@/components/fns/FnsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface CityRow {
  id: string;
  name: string;
  slug: string;
  officesCount?: number;
}

interface FnsCard {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: { id: string; name: string; slug: string };
  yandexRating?: number | null;
  yandexReviewsCount?: number | null;
  specialistCount: number;
  activeRequestCount: number;
}

/**
 * Public catalog of FNS offices — `/fns`. Discovery surface: every
 * FNS in Russia (currently ~100), grouped by city in city-section
 * accordions when no city filter is active. Picking a city collapses
 * the rest into a flat list.
 */
export default function FnsCatalogPage() {
  const router = useRouter();
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ cityId?: string; q?: string }>();
  const initialCityId =
    typeof params.cityId === "string"
      ? params.cityId
      : Array.isArray(params.cityId)
      ? params.cityId[0]
      : null;
  const initialQ =
    typeof params.q === "string"
      ? params.q
      : Array.isArray(params.q)
      ? params.q[0]
      : "";
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [items, setItems] = useState<FnsCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(initialQ);
  const [cityFilterId, setCityFilterId] = useState<string | null>(initialCityId);
  const [cities, setCities] = useState<CityRow[]>([]);

  // Sync URL → state when query param changes (deep-link / back button).
  useEffect(() => {
    setCityFilterId(initialCityId);
  }, [initialCityId]);

  useEffect(() => {
    if (initialQ) setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    api<{ items: CityRow[] }>("/api/cities?limit=200", { noAuth: true })
      .then((res) => setCities(res.items))
      .catch(() => setCities([]));
  }, []);

  const fetchPage = useCallback(async (search: string, cityId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (cityId) params.set("cityId", cityId);
      params.set("limit", "300");
      const res = await api<{ items: FnsCard[]; total: number }>(
        `/api/fns/list?${params}`,
        { noAuth: true }
      );
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить ИФНС";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void fetchPage(q, cityFilterId), 250);
    return () => clearTimeout(t);
  }, [q, cityFilterId, fetchPage]);

  const topCities = useMemo(() => {
    return [...cities]
      .sort((a, b) => (b.officesCount ?? 0) - (a.officesCount ?? 0))
      .slice(0, 14);
  }, [cities]);

  // Group items by city.name when no city filter is active. Cities
  // are sorted alphabetically; FNS within a city are also sorted by
  // name. Server already returns them in that order, but safe to
  // re-sort here in case future endpoints change.
  const groupedByCity = useMemo(() => {
    const buckets = new Map<string, { city: FnsCard["city"]; items: FnsCard[] }>();
    for (const it of items) {
      const key = it.city.id;
      const b = buckets.get(key);
      if (b) b.items.push(it);
      else buckets.set(key, { city: it.city, items: [it] });
    }
    return [...buckets.values()].sort((a, b) =>
      a.city.name.localeCompare(b.city.name, "ru")
    );
  }, [items]);

  const containerPad = isDesktop ? 24 : 16;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <LandingHeader
        isDesktop={isDesktop}
        onHome={() => nav.routes.home()}
        onCatalog={() => nav.routes.specialists()}
        onFnsCatalog={() => nav.any("/fns")}
        onRequestsBoard={() => nav.any("/requests")}
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
        <View style={{ width: "100%", maxWidth: 1080, gap: 16, paddingHorizontal: containerPad, paddingBottom: 40 }}>
          {/* Hero */}
          <View>
            <View
              className="flex-row items-center"
              style={{ gap: 8, marginBottom: 6 }}
            >
              <Building2 size={20} color={colors.primary} />
              <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                Справочник ИФНС России
              </Text>
            </View>
            <Text
              style={{
                fontSize: isDesktop ? 30 : 24,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Найдите свою налоговую инспекцию
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              Все {total > 0 ? `${total} ` : ""}ИФНС России. Для каждой — отдельная страница со списком специалистов, адресом и кнопкой создать запрос. Сгруппировано по городам — найдите свой город ниже или используйте поиск.
            </Text>
          </View>

          {/* Search */}
          <View
            className="flex-row items-center"
            style={{
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              backgroundColor: colors.white,
            }}
          >
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Код ИФНС, название инспекции или город"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                fontSize: 15,
                color: colors.text,
                paddingVertical: 4,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                outlineWidth: 0 as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                outlineStyle: "none" as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                borderStyle: "none" as any,
              }}
            />
          </View>

          {/* City chips */}
          {topCities.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              <CityChip
                label="Все города"
                active={cityFilterId == null}
                onPress={() => setCityFilterId(null)}
              />
              {topCities.map((c) => (
                <CityChip
                  key={c.id}
                  label={`${c.name}${c.officesCount ? ` (${c.officesCount})` : ""}`}
                  active={cityFilterId === c.id}
                  onPress={() =>
                    setCityFilterId(cityFilterId === c.id ? null : c.id)
                  }
                />
              ))}
            </ScrollView>
          )}

          {!loading && !error && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {q || cityFilterId
                ? `Найдено: ${items.length}${total > items.length ? ` из ${total}` : ""}`
                : `Всего ИФНС: ${total} в ${groupedByCity.length} городах`}
            </Text>
          )}

          {/* Body */}
          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <Card>
              <Text style={{ color: colors.error }}>{error}</Text>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary }}>
                По вашему запросу ничего не найдено.
              </Text>
            </Card>
          ) : cityFilterId || q ? (
            // Flat list — when filtering or searching, no need for
            // city grouping (results are usually homogeneous already).
            <FnsGrid items={items} isDesktop={isDesktop} onPress={(id) => router.push(`/fns/${id}` as never)} />
          ) : (
            // Grouped — default browse mode.
            <View style={{ gap: 24 }}>
              {groupedByCity.map((group) => (
                <View key={group.city.id} style={{ gap: 10 }}>
                  <View
                    className="flex-row items-center"
                    style={{
                      gap: 8,
                      paddingHorizontal: 4,
                    }}
                  >
                    <MapPin size={14} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {group.city.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      · {group.items.length} {group.items.length === 1 ? "ИФНС" : "ИФНС"}
                    </Text>
                  </View>
                  <FnsGrid
                    items={group.items}
                    isDesktop={isDesktop}
                    onPress={(id) => router.push(`/fns/${id}` as never)}
                  />
                </View>
              ))}
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

function FnsGrid({
  items,
  isDesktop,
  onPress,
}: {
  items: FnsCard[];
  isDesktop: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="link"
          accessibilityLabel={`Открыть ${item.name}`}
          onPress={() => onPress(item.id)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={({ pressed }) => [
            {
              flexBasis: isDesktop ? "calc(50% - 6px)" : "100%" as any,
              flexGrow: 1,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              gap: 8,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View className="flex-row items-start" style={{ gap: 10 }}>
            <FnsLogo name={item.name} size="sm" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                код {item.code}
                {item.address && ` · ${item.city.name}`}
              </Text>
            </View>
            <ArrowRight size={14} color={colors.textMuted} />
          </View>
          <View
            className="flex-row"
            style={{
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 8,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
            {item.yandexRating != null && (
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Star size={11} color={colors.warning ?? "#f5a623"} fill={colors.warning ?? "#f5a623"} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>
                    {item.yandexRating.toFixed(1)}
                  </Text>
                  {item.yandexReviewsCount ? ` · ${item.yandexReviewsCount}` : ""}
                </Text>
              </View>
            )}
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Users size={11} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Спецов:{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {item.specialistCount}
                </Text>
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <FileText size={11} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Запросов:{" "}
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {item.activeRequestCount}
                </Text>
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function CityChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Фильтр: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.white,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: active ? "600" : "400",
          color: active ? colors.white : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
