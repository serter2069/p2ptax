import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  X,
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
  specialistCount: number;
  activeRequestCount: number;
}

// Топ-5 городов на чипах. Больше не нужно — список можно найти через
// поиск-typeahead (мышью по горизонтали скроллить неудобно).
const TOP_CITY_NAMES = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"];

/**
 * Public catalog of FNS offices — `/fns`. Discovery surface: every
 * FNS in Russia (currently ~100), grouped by city in city-section
 * accordions when no city filter is active. Picking a city collapses
 * the rest into a flat list.
 */
export default function FnsCatalogPage() {
  const router = useRouter();
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ cityId?: string }>();
  const initialCityId =
    typeof params.cityId === "string"
      ? params.cityId
      : Array.isArray(params.cityId)
      ? params.cityId[0]
      : null;
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [items, setItems] = useState<FnsCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Typeahead-инпут: ищем город по имени, после выбора подставляем
  // имя в инпут и фиксируем cityFilterId.
  const [cityQuery, setCityQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityFilterId, setCityFilterId] = useState<string | null>(initialCityId);
  const [cities, setCities] = useState<CityRow[]>([]);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL → state when query param changes (deep-link / back button).
  useEffect(() => {
    setCityFilterId(initialCityId);
  }, [initialCityId]);

  useEffect(() => {
    api<{ items: CityRow[] }>("/api/cities?limit=1000", { noAuth: true })
      .then((res) => setCities(res.items))
      .catch(() => setCities([]));
  }, []);

  const fetchPage = useCallback(async (cityId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (cityId) params.set("cityId", cityId);
      params.set("limit", "500");
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
    void fetchPage(cityFilterId);
  }, [cityFilterId, fetchPage]);

  // Если URL принёс cityId — подставим имя в инпут.
  useEffect(() => {
    if (cityFilterId && cities.length > 0) {
      const c = cities.find((x) => x.id === cityFilterId);
      if (c && cityQuery !== c.name) setCityQuery(c.name);
    }
  }, [cityFilterId, cities]); // eslint-disable-line react-hooks/exhaustive-deps

  // Топ-5 городов жёстко по списку (Москва, СПб и т.д.).
  const topCities = useMemo(() => {
    return TOP_CITY_NAMES
      .map((name) => cities.find((c) => c.name === name))
      .filter((c): c is CityRow => !!c);
  }, [cities]);

  // Совпадения для дропдауна (≥2 символов, до 8 результатов).
  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    // Если уже выбран город и имя совпадает — не показываем
    // (иначе сразу после выбора дропдаун висит пустой).
    if (cityFilterId) {
      const cur = cities.find((c) => c.id === cityFilterId);
      if (cur && cur.name.toLowerCase() === q) return [];
    }
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cityQuery, cities, cityFilterId]);

  const pickCity = useCallback((city: CityRow) => {
    setCityFilterId(city.id);
    setCityQuery(city.name);
    setDropdownOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setCityFilterId(null);
    setCityQuery("");
    setDropdownOpen(false);
  }, []);

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
              Все {total > 0 ? `${total} ` : ""}ИФНС России. Выберите город — ниже появятся все ИФНС в нём со ссылками на детальные страницы.
            </Text>
          </View>

          {/* City typeahead.
              position:relative + zIndex POPOVER, чтобы дропдаун
              перекрывал карточки списка ниже на web. */}
          <View style={{ position: "relative", zIndex: 100 }}>
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
                value={cityQuery}
                onChangeText={(t) => {
                  setCityQuery(t);
                  setDropdownOpen(t.trim().length >= 2);
                  // Если стерли имя выбранного города — снимаем фильтр.
                  if (cityFilterId) {
                    const cur = cities.find((c) => c.id === cityFilterId);
                    if (!cur || !cur.name.toLowerCase().startsWith(t.trim().toLowerCase())) {
                      setCityFilterId(null);
                    }
                  }
                }}
                onFocus={() => {
                  if (cityQuery.trim().length >= 2) setDropdownOpen(true);
                }}
                onBlur={() => {
                  // Закрываем с задержкой, чтобы клик по строке дропдауна успел отработать.
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  blurTimer.current = setTimeout(() => setDropdownOpen(false), 150);
                }}
                placeholder="Введите город — например, Москва"
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
              {cityQuery.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Очистить"
                  onPress={clearCity}
                  hitSlop={6}
                >
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Dropdown с совпадениями. */}
            {dropdownOpen && cityMatches.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  overflow: "hidden",
                  zIndex: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                }}
              >
                {cityMatches.map((c, idx) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    onPress={() => pickCity(c)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      },
                      pressed && { backgroundColor: colors.surface },
                    ]}
                  >
                    <MapPin size={14} color={colors.textMuted} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{c.name}</Text>
                    {c.officesCount ? (
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>
                        {c.officesCount} ИФНС
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Топ-5 чипов под инпутом — быстрый выбор без печатания. */}
          {topCities.length > 0 && (
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {topCities.map((c) => (
                <CityChip
                  key={c.id}
                  label={`${c.name}${c.officesCount ? ` (${c.officesCount})` : ""}`}
                  active={cityFilterId === c.id}
                  onPress={() => (cityFilterId === c.id ? clearCity() : pickCity(c))}
                />
              ))}
              {cityFilterId && (
                <CityChip label="Все города" active={false} onPress={clearCity} />
              )}
            </View>
          )}

          {!loading && !error && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {cityFilterId
                ? `В выбранном городе: ${items.length} ${items.length === 1 ? "ИФНС" : "ИФНС"}`
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
                По выбранному городу ничего не найдено.
              </Text>
            </Card>
          ) : cityFilterId ? (
            // Город выбран → плоский список всех ИФНС этого города.
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
