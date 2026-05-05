import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Save, Check, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import Card from "@/components/ui/Card";
import { dialog } from "@/lib/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";
import { useNoIndex } from "@/components/seo/NoIndex";

interface AdminPlanRow {
  id: string;
  code: string;
  name: string;
  monthlyPriceKopeks: number;
  fnsLimit: number;
  sortOrder: number;
  isActive: boolean;
  subscribersCount: number;
}

interface PlanEdit {
  name?: string;
  priceRub?: string;
  fnsLimit?: string;
  sortOrder?: string;
  isActive?: boolean;
  saving?: boolean;
  saved?: boolean;
}

/**
 * Admin → "Тарифы PRO" page. One row per SubscriptionPlan with inline
 * editors for display name, monthly price, FNS limit, sort order and
 * active flag. The `code` is fixed (analytics keys off it).
 *
 * After PATCH: green "Сохранено" badge for 1.5s, then row resets to
 * unedited state from the canonical refetch.
 */
export default function AdminPlansPage() {
  useNoIndex();
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [items, setItems] = useState<AdminPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, PlanEdit>>({});

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!ready) return;
    if (!isAdmin) router.replace("/" as never);
  }, [ready, isAdmin, router]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ plans: AdminPlanRow[] }>("/api/admin/plans");
      setItems(res.plans);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить тарифы";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void refresh();
  }, [ready, isAdmin, refresh]);

  const handleSave = useCallback(
    async (row: AdminPlanRow) => {
      const draft = edits[row.id] ?? {};

      const name = draft.name ?? row.name;
      const priceRubStr = draft.priceRub ?? (row.monthlyPriceKopeks / 100).toString();
      const fnsLimitStr = draft.fnsLimit ?? row.fnsLimit.toString();
      const sortOrderStr = draft.sortOrder ?? row.sortOrder.toString();
      const isActive = draft.isActive ?? row.isActive;

      const priceRub = parseFloat(priceRubStr.replace(",", "."));
      if (!Number.isFinite(priceRub) || priceRub < 0 || priceRub > 1_000_000) {
        await dialog.alert({
          title: "Цена вне диапазона",
          message: "Месячная цена должна быть от 0 до 1 000 000 ₽.",
        });
        return;
      }
      const fnsLimit = parseInt(fnsLimitStr, 10);
      if (!Number.isFinite(fnsLimit) || fnsLimit < 0 || fnsLimit > 10000) {
        await dialog.alert({
          title: "Лимит вне диапазона",
          message: "Лимит ИФНС — от 0 до 10000.",
        });
        return;
      }
      const sortOrder = parseInt(sortOrderStr, 10);

      setEdits((prev) => ({ ...prev, [row.id]: { ...draft, saving: true } }));
      try {
        await apiPatch(`/api/admin/plans/${row.id}`, {
          name,
          monthlyPriceKopeks: Math.round(priceRub * 100),
          fnsLimit,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : row.sortOrder,
          isActive,
        });
        setItems((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  name,
                  monthlyPriceKopeks: Math.round(priceRub * 100),
                  fnsLimit,
                  sortOrder: Number.isFinite(sortOrder) ? sortOrder : r.sortOrder,
                  isActive,
                }
              : r
          )
        );
        setEdits((prev) => ({ ...prev, [row.id]: { saving: false, saved: true } }));
        setTimeout(() => {
          setEdits((prev) => {
            const next = { ...prev };
            delete next[row.id];
            return next;
          });
        }, 1500);
      } catch (e) {
        setEdits((prev) => ({ ...prev, [row.id]: { ...draft, saving: false } }));
        const msg = e instanceof Error ? e.message : "Не удалось сохранить";
        await dialog.alert({ title: "Ошибка", message: msg });
      }
    },
    [edits]
  );

  if (!ready || !isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={{ width: "100%", maxWidth: 900, gap: 16 }}>
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Sparkles size={22} color={colors.primary} />
            <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text }}>
              Тарифы PRO
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
            На каждом тарифе своя месячная цена и лимит ИФНС в VIP. Cron каждый день списывает 1/30 цены тарифа с привязанной карты специалиста.
          </Text>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <Card>
              <Text style={{ color: colors.error }}>{error}</Text>
            </Card>
          ) : (
            items.map((row) => {
              const draft = edits[row.id];
              const nameValue = draft?.name ?? row.name;
              const priceValue = draft?.priceRub ?? (row.monthlyPriceKopeks / 100).toString();
              const limitValue = draft?.fnsLimit ?? row.fnsLimit.toString();
              const sortValue = draft?.sortOrder ?? row.sortOrder.toString();
              const activeValue = draft?.isActive ?? row.isActive;
              return (
                <Card key={row.id}>
                  <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        code: {row.code}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                      Подписчиков: {row.subscribersCount}
                    </Text>
                  </View>

                  {/* Name */}
                  <Field label="Название (видит специалист)">
                    <TextInput
                      value={nameValue}
                      onChangeText={(v) =>
                        setEdits((prev) => ({
                          ...prev,
                          [row.id]: { ...(prev[row.id] ?? {}), name: v },
                        }))
                      }
                      style={inputStyle}
                    />
                  </Field>

                  <View className="flex-row" style={{ gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Цена ₽/мес">
                        <TextInput
                          value={priceValue}
                          onChangeText={(v) =>
                            setEdits((prev) => ({
                              ...prev,
                              [row.id]: { ...(prev[row.id] ?? {}), priceRub: v },
                            }))
                          }
                          keyboardType="numeric"
                          style={inputStyle}
                        />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Лимит ИФНС">
                        <TextInput
                          value={limitValue}
                          onChangeText={(v) =>
                            setEdits((prev) => ({
                              ...prev,
                              [row.id]: { ...(prev[row.id] ?? {}), fnsLimit: v },
                            }))
                          }
                          keyboardType="numeric"
                          style={inputStyle}
                        />
                      </Field>
                    </View>
                    <View style={{ width: 100 }}>
                      <Field label="Сорт.">
                        <TextInput
                          value={sortValue}
                          onChangeText={(v) =>
                            setEdits((prev) => ({
                              ...prev,
                              [row.id]: { ...(prev[row.id] ?? {}), sortOrder: v },
                            }))
                          }
                          keyboardType="numeric"
                          style={inputStyle}
                        />
                      </Field>
                    </View>
                  </View>

                  <View
                    className="flex-row items-center"
                    style={{ gap: 10, marginTop: 8 }}
                  >
                    <Switch
                      value={activeValue}
                      onValueChange={(v) =>
                        setEdits((prev) => ({
                          ...prev,
                          [row.id]: { ...(prev[row.id] ?? {}), isActive: v },
                        }))
                      }
                    />
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      {activeValue ? "Активен (виден в выборе)" : "Скрыт от новых подписчиков"}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-end mt-3" style={{ gap: 8 }}>
                    {draft?.saved && (
                      <View className="flex-row items-center" style={{ gap: 4 }}>
                        <Check size={14} color={colors.success} />
                        <Text style={{ fontSize: 12, color: colors.success }}>Сохранено</Text>
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Сохранить тариф ${row.name}`}
                      onPress={() => handleSave(row)}
                      disabled={draft?.saving}
                      style={({ pressed }) => [
                        {
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 10,
                          backgroundColor: colors.primary,
                        },
                        draft?.saving && { opacity: 0.5 },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Save size={14} color={colors.white} />
                      <Text style={{ color: colors.white, fontWeight: "600", fontSize: 13 }}>
                        {draft?.saving ? "..." : "Сохранить"}
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 14,
  backgroundColor: colors.white,
  color: colors.text,
} as const;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text
        style={{
          fontSize: 11,
          color: colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
