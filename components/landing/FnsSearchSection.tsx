import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Building2, ArrowRight, MapPin, X, Users, FileText } from "lucide-react-native";
import { api } from "@/lib/api";
import { useCities } from "@/lib/hooks/useCities";
import { colors } from "@/lib/theme";
import FnsLogo from "@/components/fns/FnsLogo";

interface FnsCard {
  id: string;
  name: string;
  code: string;
  city: { id: string; name: string; slug: string };
  specialistCount: number;
  activeRequestCount: number;
}

const TOP_CITY_NAMES = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"];

/**
 * Лендинговая секция «Найдите специалиста по своей ИФНС».
 *
 * Показывает «живые» ИФНС — где есть и специалисты, и активные
 * запросы (отсортированы по активности). Поиск только по городу:
 * typeahead-инпут + 5 чипов популярных городов. Раньше был freetext-
 * поиск по коду/имени, плюс показывались любые ИФНС включая пустые
 * — пользователь жаловался на горизонтальный скролл и шум.
 */
export default function FnsSearchSection({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const { cities } = useCities();

  const [items, setItems] = useState<FnsCard[]>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityFilterId, setCityFilterId] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchActive = useCallback((cityId: string | null) => {
    const params = new URLSearchParams({ activeOnly: "1", limit: "6" });
    if (cityId) params.set("cityId", cityId);
    api<{ items: FnsCard[] }>(`/api/fns/list?${params}`, { noAuth: true })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    fetchActive(cityFilterId);
  }, [cityFilterId, fetchActive]);

  const topCities = useMemo(
    () =>
      TOP_CITY_NAMES.map((name) => cities.find((c) => c.name === name)).filter(
        (c): c is { id: string; name: string; slug?: string; officesCount?: number } => !!c,
      ),
    [cities],
  );

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    if (cityFilterId) {
      const cur = cities.find((c) => c.id === cityFilterId);
      if (cur && cur.name.toLowerCase() === q) return [];
    }
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cityQuery, cities, cityFilterId]);

  const pickCity = useCallback((city: { id: string; name: string }) => {
    setCityFilterId(city.id);
    setCityQuery(city.name);
    setDropdownOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setCityFilterId(null);
    setCityQuery("");
    setDropdownOpen(false);
  }, []);

  return (
    <View
      style={{
        paddingVertical: isDesktop ? 56 : 36,
        paddingHorizontal: 16,
        backgroundColor: colors.white,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ width: "100%", maxWidth: 960, gap: 16 }}>
        <View
          className="flex-row items-center"
          style={{ gap: 8, justifyContent: isDesktop ? "flex-start" : "center" }}
        >
          <Building2 size={22} color={colors.primary} />
          <Text
            style={{
              fontSize: 12,
              color: colors.primary,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Справочник ИФНС России
          </Text>
        </View>
        <View>
          <Text
            style={{
              fontSize: isDesktop ? 28 : 22,
              fontWeight: "700",
              color: colors.text,
              textAlign: isDesktop ? "left" : "center",
            }}
          >
            Найдите специалиста по своей ИФНС
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginTop: 6,
              lineHeight: 20,
              textAlign: isDesktop ? "left" : "center",
            }}
          >
            Выберите город — покажем активные ИФНС с экспертами и свежими запросами.
          </Text>
        </View>

        {/* City typeahead. */}
        <View style={{ position: "relative", zIndex: 100 }}>
          <View
            className="flex-row items-center"
            style={{
              gap: 10,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              backgroundColor: colors.white,
            }}
          >
            <Search size={20} color={colors.textMuted} />
            <TextInput
              value={cityQuery}
              onChangeText={(t) => {
                setCityQuery(t);
                setDropdownOpen(t.trim().length >= 2);
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
                if (blurTimer.current) clearTimeout(blurTimer.current);
                blurTimer.current = setTimeout(() => setDropdownOpen(false), 150);
              }}
              placeholder="Введите город — например, Москва"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                fontSize: 16,
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
              <Pressable accessibilityRole="button" accessibilityLabel="Очистить" onPress={clearCity} hitSlop={6}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {dropdownOpen && cityMatches.length > 0 && (
            <View
              style={{
                position: "absolute",
                top: 56,
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
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Топ-5 чипов */}
        {topCities.length > 0 && (
          <View
            className="flex-row flex-wrap"
            style={{ gap: 6, justifyContent: isDesktop ? "flex-start" : "center" }}
          >
            {topCities.map((c) => {
              const active = cityFilterId === c.id;
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Фильтр: ${c.name}`}
                  onPress={() => (active ? clearCity() : pickCity(c))}
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
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Cards: только живые ИФНС, отсортированы по активности. */}
        {items.length > 0 ? (
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
                onPress={() => router.push(`/fns/${item.id}` as never)}
                style={({ pressed }) => [
                  {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    flexBasis: (isDesktop ? "calc(33.333% - 8px)" : "100%") as any,
                    flexGrow: 1,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 14,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View className="flex-row items-start" style={{ gap: 10 }}>
                  <FnsLogo name={item.name} cityName={item.city.name} size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {item.city.name} · код {item.code}
                    </Text>
                  </View>
                </View>
                <View
                  className="flex-row"
                  style={{
                    marginTop: 10,
                    gap: 12,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    flexWrap: "wrap",
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Users size={11} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      <Text style={{ color: colors.text, fontWeight: "600" }}>{item.specialistCount}</Text> спец.
                    </Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <FileText size={11} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      <Text style={{ color: colors.text, fontWeight: "600" }}>{item.activeRequestCount}</Text> запр.
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {cityFilterId
              ? "В этом городе пока нет ИФНС с активными запросами."
              : "Пока нет ИФНС с активными запросами."}
          </Text>
        )}

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Открыть полный справочник ИФНС"
          onPress={() =>
            router.push(
              cityFilterId ? (`/fns?cityId=${cityFilterId}` as never) : ("/fns" as never),
            )
          }
          style={({ pressed }) => [
            {
              alignSelf: isDesktop ? "flex-start" : "stretch",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary,
              backgroundColor: colors.white,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
            Смотреть все ИФНС России
          </Text>
          <ArrowRight size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
