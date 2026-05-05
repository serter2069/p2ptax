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
import { useRouter } from "expo-router";
import { Search, Building2, Users, FileText, ArrowRight } from "lucide-react-native";
import Card from "@/components/ui/Card";
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

/**
 * Public catalog of FNS offices — `/fns`. The single most-discoverable
 * entry point into individual FNS landings:
 *   - Search box (code / name / city, debounced 250ms)
 *   - Horizontal city-chip filter (top cities by office count)
 *   - Grid of FNS cards with quick stats (specialists, active requests)
 *
 * Each card links to /fns/[id] which already exists (specialist roster,
 * "Оставить запрос" CTA, admin description).
 *
 * No-auth friendly so anon visitors can browse before signing up.
 */
export default function FnsCatalogPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  const [items, setItems] = useState<FnsCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cityFilterId, setCityFilterId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);

  // Cities (with counts) for the chip filter.
  useEffect(() => {
    api<{ items: CityRow[] }>("/api/cities?limit=100", { noAuth: true })
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
      params.set("limit", "60");
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

  // Debounced fetch on q / cityFilter change.
  useEffect(() => {
    const t = setTimeout(() => void fetchPage(q, cityFilterId), 250);
    return () => clearTimeout(t);
  }, [q, cityFilterId, fetchPage]);

  // Top 12 cities by office count for the chip strip — keeps the row
  // shootable horizontally without overwhelming small screens.
  const topCities = useMemo(() => {
    return [...cities]
      .sort((a, b) => (b.officesCount ?? 0) - (a.officesCount ?? 0))
      .slice(0, 12);
  }, [cities]);

  const containerPad = isDesktop ? 24 : 16;
  const colCount = isDesktop ? 2 : 1;
  const cardWidth = colCount === 1 ? "100%" : "calc(50% - 8px)";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
          paddingHorizontal: containerPad,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: 1080, gap: 16 }}>
          {/* Hero */}
          <View>
            <Text
              style={{
                fontSize: isDesktop ? 28 : 22,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Справочник ИФНС России
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              Найдите свою налоговую и посмотрите, какие специалисты по ней работают. Для каждой ИФНС — отдельная страница со списком специалистов и кнопкой создать запрос.
            </Text>
          </View>

          {/* Search */}
          <View
            className="flex-row items-center"
            style={{
              gap: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
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
              placeholder="Код ИФНС, название или город"
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
                  label={c.name}
                  active={cityFilterId === c.id}
                  onPress={() =>
                    setCityFilterId(cityFilterId === c.id ? null : c.id)
                  }
                />
              ))}
            </ScrollView>
          )}

          {/* Result count */}
          {!loading && !error && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              Найдено: {total}
              {total > items.length && ` (показаны первые ${items.length})`}
            </Text>
          )}

          {/* Grid */}
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
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="link"
                  accessibilityLabel={`Открыть ${item.name}`}
                  onPress={() => router.push(`/fns/${item.id}` as never)}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  style={({ pressed }) => [
                    {
                      width: cardWidth as any,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 14,
                      padding: 16,
                      gap: 8,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View className="flex-row items-start" style={{ gap: 10 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: colors.accentSoft,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {item.city.name} · код {item.code}
                      </Text>
                    </View>
                    <ArrowRight size={16} color={colors.textMuted} />
                  </View>

                  <View
                    className="flex-row"
                    style={{
                      gap: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingTop: 10,
                      marginTop: 4,
                    }}
                  >
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Users size={12} color={colors.textMuted} />
                      <Text
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
                        Специалистов:{" "}
                        <Text style={{ color: colors.text, fontWeight: "600" }}>
                          {item.specialistCount}
                        </Text>
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <FileText size={12} color={colors.textMuted} />
                      <Text
                        style={{ fontSize: 12, color: colors.textSecondary }}
                      >
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
