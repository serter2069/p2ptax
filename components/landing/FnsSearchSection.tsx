import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Building2, ArrowRight, Star } from "lucide-react-native";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import FnsLogo from "@/components/fns/FnsLogo";

interface FnsCard {
  id: string;
  name: string;
  code: string;
  city: { id: string; name: string; slug: string };
  yandexRating?: number | null;
  yandexReviewsCount?: number | null;
  specialistCount: number;
  activeRequestCount: number;
}

/**
 * Lands directly under the trust pillars on the marketing home page.
 * One-line value prop + a search box that hits /api/ifns/search and
 * shows up to 6 suggestions. Clicking a suggestion goes to /fns/[id]
 * (which has the specialist roster + "Оставить запрос" CTA already).
 *
 * "Все ИФНС" CTA links to /fns — the full paginated catalog with the
 * city filter — so users who don't have a specific code in mind can
 * still browse. The catalog page is browsable by anonymous visitors;
 * the per-FNS landing too.
 */
export default function FnsSearchSection({ isDesktop }: { isDesktop: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<FnsCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInitial, setShowInitial] = useState(true);

  // Initial load — top FNS by activity for the "browse-mode" preview.
  useEffect(() => {
    api<{ items: FnsCard[] }>("/api/fns/list?limit=6", { noAuth: true })
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      if (!query.trim()) {
        // Empty input → restore preview list.
        const res = await api<{ items: FnsCard[] }>(
          "/api/fns/list?limit=6",
          { noAuth: true }
        );
        setItems(res.items);
        setShowInitial(true);
      } else {
        const res = await api<{ items: FnsCard[] }>(
          `/api/ifns/search?q=${encodeURIComponent(query.trim())}`,
          { noAuth: true }
        );
        setItems(res.items.slice(0, 6));
        setShowInitial(false);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(q), 250);
    return () => clearTimeout(t);
  }, [q, search]);

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
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
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
            Введите код или название инспекции — у нас есть отдельная страница для каждой ИФНС с экспертами и кнопкой создать запрос.
          </Text>
        </View>

        {/* Search input */}
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
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => {
              const trimmed = q.trim();
              if (trimmed) {
                router.push(`/fns?q=${encodeURIComponent(trimmed)}` as never);
              } else {
                router.push("/fns" as never);
              }
            }}
            returnKeyType="search"
            placeholder="Например, 7703 или «Москва»"
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
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Если что-то введено — кнопка перехода в полный каталог
            с этим запросом (Enter делает то же самое). */}
        {q.trim().length > 0 && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Все результаты для «${q.trim()}»`}
            onPress={() =>
              router.push(`/fns?q=${encodeURIComponent(q.trim())}` as never)
            }
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: colors.primary,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 14 }}>
              Все результаты для «{q.trim()}» →
            </Text>
          </Pressable>
        )}

        {/* Results / preview */}
        {items.length > 0 ? (
          <ScrollView
            horizontal={isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              isDesktop
                ? { gap: 12, paddingVertical: 4 }
                : { gap: 12 }
            }
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="link"
                accessibilityLabel={`Открыть ${item.name}`}
                onPress={() => router.push(`/fns/${item.id}` as never)}
                style={({ pressed }) => [
                  {
                    width: isDesktop ? 280 : "100%",
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
                    <Text
                      style={{
                        fontSize: 14,
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
                </View>
                <View
                  className="flex-row items-center"
                  style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}
                >
                  {item.yandexRating != null && (
                    <View className="flex-row items-center" style={{ gap: 3 }}>
                      <Star size={11} color={colors.warning ?? "#f5a623"} fill={colors.warning ?? "#f5a623"} />
                      <Text style={{ fontSize: 12, color: colors.text, fontWeight: "600" }}>
                        {item.yandexRating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {item.specialistCount} спец. · {item.activeRequestCount} запр.
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : !loading ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            По вашему запросу ничего не найдено.
          </Text>
        ) : null}

        {/* Browse-all CTA */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Открыть полный справочник ИФНС"
          onPress={() => router.push("/fns" as never)}
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
            {showInitial ? "Смотреть все ИФНС России" : "Открыть полный справочник"}
          </Text>
          <ArrowRight size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
