import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Save, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import Card from "@/components/ui/Card";
import { dialog } from "@/lib/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch } from "@/lib/api";
import { colors } from "@/lib/theme";
import { useNoIndex } from "@/components/seo/NoIndex";

interface AdminFnsRow {
  id: string;
  name: string;
  code: string;
  cityId: string;
  address: string | null;
  description: string | null;
  vipMonthlyPriceKopeks: number | null;
  city: { id: string; name: string };
}

interface AdminFnsResponse {
  items: AdminFnsRow[];
  total: number;
  hasMore: boolean;
}

/**
 * Admin → "Тарифы ИФНС" page. One row per FnsOffice with two inline
 * editors:
 *   - Месячный тариф (₽) — vipMonthlyPriceKopeks. Empty = VIP off
 *     for this office (specialists can't subscribe).
 *   - Описание — admin-managed prose shown on /fns/[id].
 *
 * Search across name + code via the /api/admin/ifns?q= endpoint.
 * Inline save button per row writes a PATCH; "✓ saved" badge flashes
 * briefly so the admin sees the write landed without a global toast.
 */
export default function AdminFnsPricesPage() {
  useNoIndex();
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const [items, setItems] = useState<AdminFnsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, { price?: string; description?: string; saving?: boolean; saved?: boolean }>>({});

  const isAdmin = user?.role === "ADMIN";

  // Wait until auth resolves; non-admins get bounced to home.
  useEffect(() => {
    if (!ready) return;
    if (!isAdmin) {
      router.replace("/" as never);
    }
  }, [ready, isAdmin, router]);

  const fetchPage = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = search.trim()
        ? `/api/admin/ifns?limit=100&q=${encodeURIComponent(search.trim())}`
        : `/api/admin/ifns?limit=100`;
      const res = await apiGet<AdminFnsResponse>(url);
      setItems(res.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось загрузить ИФНС";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !isAdmin) return;
    void fetchPage("");
  }, [ready, isAdmin, fetchPage]);

  // Debounced search.
  useEffect(() => {
    if (!ready || !isAdmin) return;
    const t = setTimeout(() => void fetchPage(q), 250);
    return () => clearTimeout(t);
  }, [q, ready, isAdmin, fetchPage]);

  const handleSave = useCallback(
    async (row: AdminFnsRow) => {
      const draft = edits[row.id] ?? {};
      const priceStr = draft.price ?? (
        row.vipMonthlyPriceKopeks != null
          ? (row.vipMonthlyPriceKopeks / 100).toString()
          : ""
      );
      const description = draft.description ?? row.description ?? "";

      let priceKopeks: number | null;
      if (priceStr.trim() === "") {
        priceKopeks = null;
      } else {
        const n = parseFloat(priceStr.replace(",", "."));
        if (!Number.isFinite(n) || n < 1 || n > 1_000_000) {
          await dialog.alert({
            title: "Цена вне диапазона",
            message: "Месячный тариф должен быть от 1 ₽ до 1 000 000 ₽ (или пусто).",
          });
          return;
        }
        priceKopeks = Math.round(n * 100);
      }

      setEdits((prev) => ({ ...prev, [row.id]: { ...draft, saving: true } }));
      try {
        await apiPatch(`/api/admin/ifns/${row.id}`, {
          vipMonthlyPriceKopeks: priceKopeks,
          description: description || null,
        });
        // Reflect new state locally without a full re-fetch.
        setItems((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, vipMonthlyPriceKopeks: priceKopeks, description: description || null }
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

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        `${a.city.name}|${a.name}`.localeCompare(`${b.city.name}|${b.name}`, "ru")
      ),
    [items]
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
      <View
        className="flex-row items-center px-4 py-4 border-b border-border bg-white"
        style={{ gap: 8 }}
      >
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Поиск по названию или коду ИФНС"
          placeholderTextColor={colors.placeholder}
          style={{
            flex: 1,
            fontSize: 14,
            color: colors.text,
            paddingVertical: 8,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            outlineWidth: 0 as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            outlineStyle: "none" as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            borderStyle: "none" as any,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
          paddingHorizontal: 16,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%", maxWidth: 900, gap: 12 }}>
          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <Card>
              <Text style={{ color: colors.error }}>{error}</Text>
            </Card>
          ) : sortedItems.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary }}>Ничего не найдено.</Text>
            </Card>
          ) : (
            sortedItems.map((row) => {
              const draft = edits[row.id];
              const priceValue =
                draft?.price ??
                (row.vipMonthlyPriceKopeks != null
                  ? String(row.vipMonthlyPriceKopeks / 100)
                  : "");
              const descValue = draft?.description ?? row.description ?? "";
              return (
                <Card key={row.id}>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                      {row.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {row.city.name} · код {row.code}
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center mt-3"
                    style={{ gap: 8 }}
                  >
                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 110 }}>
                      Тариф ₽/мес
                    </Text>
                    <TextInput
                      value={priceValue}
                      onChangeText={(v) =>
                        setEdits((prev) => ({
                          ...prev,
                          [row.id]: { ...(prev[row.id] ?? {}), price: v },
                        }))
                      }
                      placeholder="—"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        fontSize: 14,
                        backgroundColor: colors.white,
                        color: colors.text,
                      }}
                    />
                  </View>
                  <View className="mt-3">
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
                      Описание (для /fns/{row.id})
                    </Text>
                    <TextInput
                      value={descValue}
                      onChangeText={(v) =>
                        setEdits((prev) => ({
                          ...prev,
                          [row.id]: { ...(prev[row.id] ?? {}), description: v },
                        }))
                      }
                      placeholder="Можно оставить пустым"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      style={{
                        minHeight: 60,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        fontSize: 14,
                        backgroundColor: colors.white,
                        color: colors.text,
                        textAlignVertical: "top",
                      }}
                    />
                  </View>
                  <View className="flex-row items-center justify-end mt-3" style={{ gap: 8 }}>
                    {draft?.saved && (
                      <View
                        className="flex-row items-center"
                        style={{ gap: 4 }}
                      >
                        <Check size={14} color={colors.success} />
                        <Text style={{ fontSize: 12, color: colors.success }}>Сохранено</Text>
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Сохранить изменения по этой ИФНС"
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
