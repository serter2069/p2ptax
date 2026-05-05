import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Plus, Users, FileText, MapPin } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { api } from "@/lib/api";
import { colors, BREAKPOINT } from "@/lib/theme";

interface FnsDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  description: string | null;
  city: { id: string; name: string; slug: string };
  specialistCount: number;
  activeRequestCount: number;
}

interface SpecialistRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  description: string | null;
}

/**
 * Public landing page for a single FNS office. Three blocks:
 *   - Header: name + city + address + admin-edited description
 *   - "Оставить запрос" CTA → /requests/new?fnsId=… (the new wizard
 *     pre-selects this FNS so the user goes straight to title/text)
 *   - Specialist roster — everyone whose work area covers this FNS
 *
 * Reachable from any catalog FNS chip + the "+N" overflow on cards.
 * No-auth friendly so anon visitors can see what specialists are
 * available before signing up.
 */
export default function FnsDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fnsId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : null;
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;

  const [fns, setFns] = useState<FnsDetail | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!fnsId) return;
    setLoading(true);
    setError(null);
    try {
      const [fnsRes, specRes] = await Promise.all([
        api<FnsDetail>(`/api/fns/${fnsId}`, { noAuth: true }),
        api<{ specialists: SpecialistRow[] }>(
          `/api/specialists?fns_ids=${fnsId}&limit=50`,
          { noAuth: true }
        ).catch(() => ({ specialists: [] })),
      ]);
      setFns(fnsRes);
      setSpecialists(specRes.specialists ?? []);
    } catch (e) {
      if (__DEV__) console.error("fns load error", e);
      setError("Не удалось загрузить ИФНС");
    } finally {
      setLoading(false);
    }
  }, [fnsId]);

  useEffect(() => {
    void load();
  }, [load]);

  const goCreateRequest = useCallback(() => {
    if (!fnsId) return;
    router.push(`/requests/new?fnsId=${fnsId}` as never);
  }, [fnsId, router]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !fns) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <ErrorState message={error ?? "ИФНС не найдена"} onRetry={load} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: isDesktop ? 760 : "100%", gap: 16 }}>
          {/* Header card */}
          <Card>
            <View className="flex-row items-start" style={{ gap: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
                  {fns.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {fns.city.name} · код {fns.code}
                </Text>
              </View>
            </View>

            {fns.address && (
              <View
                className="flex-row items-start mt-3"
                style={{ gap: 8 }}
              >
                <MapPin size={14} color={colors.textMuted} style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                  {fns.address}
                </Text>
              </View>
            )}

            {fns.description && (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.text,
                  lineHeight: 20,
                  marginTop: 12,
                }}
              >
                {fns.description}
              </Text>
            )}

            {/* Stat strip */}
            <View
              className="flex-row mt-4"
              style={{
                gap: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 12,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Users size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Специалистов: <Text style={{ color: colors.text, fontWeight: "600" }}>{fns.specialistCount}</Text>
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 4,
                }}
              />
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <FileText size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Активных запросов: <Text style={{ color: colors.text, fontWeight: "600" }}>{fns.activeRequestCount}</Text>
                </Text>
              </View>
            </View>

            {/* Primary CTA */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Оставить запрос по этой ИФНС"
              onPress={goCreateRequest}
              style={({ pressed }) => [
                {
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Plus size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: "600" }}>
                Оставить запрос
              </Text>
            </Pressable>
          </Card>

          {/* Specialists list */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Специалисты по этой ИФНС
            </Text>
            {!specialists || specialists.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Users}
                  title="Пока нет специалистов"
                  subtitle="По этой ИФНС никто ещё не подключился. Оставьте запрос — мы оповестим их, когда появятся."
                />
              </Card>
            ) : (
              <Card>
                {specialists.map((s, idx) => {
                  const fullName = [s.firstName, s.lastName].filter(Boolean).join(" ") || "Специалист";
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="link"
                      accessibilityLabel={`Профиль ${fullName}`}
                      onPress={() => router.push(`/profile/${s.id}` as never)}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingVertical: 12,
                          borderTopWidth: idx === 0 ? 0 : 1,
                          borderTopColor: colors.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Avatar
                        name={fullName}
                        imageUrl={s.avatarUrl ?? undefined}
                        size="md"
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                          {fullName}
                        </Text>
                        {s.description && (
                          <Text
                            style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}
                            numberOfLines={2}
                          >
                            {s.description}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
