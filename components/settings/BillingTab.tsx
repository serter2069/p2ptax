import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import {
  CreditCard,
  Crown,
  AlertCircle,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Search,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import { dialog } from "@/lib/dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

interface ActiveSub {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
  monthlyPriceKopeks: number | null;
  monthlyPriceRub: number | null;
  dailyChargeKopeks: number | null;
  activatedAt: string;
}

interface MePayload {
  isSpecialist: boolean;
  hasPaymentMethod: boolean;
  paymentMethodTitle: string | null;
  lastChargeFailedAt: string | null;
  dailyChargeKopeks: number;
  dailyChargeRub: number;
  monthlyEstimateKopeks: number;
  monthlyEstimateRub: number;
  activeSubscriptions: ActiveSub[];
}

interface SearchableFns {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
  monthlyPriceKopeks: number;
  monthlyPriceRub: number;
  dailyChargeKopeks: number;
}

interface CityRow {
  id: string;
  name: string;
  slug: string;
}

interface VipFnsResponse {
  ok: boolean;
  needsRedirect?: boolean;
  confirmationUrl?: string;
  alreadyActive?: boolean;
  charged?: number;
}

interface TxItem {
  id: string;
  amountKopeks: number;
  kind: string;
  fnsId: string | null;
  externalRef: string | null;
  description: string | null;
  createdAt: string;
}

function formatRub(kopeks: number): string {
  const rub = kopeks / 100;
  return `${rub.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

function formatActivatedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function txKindLabel(kind: string): string {
  switch (kind) {
    case "bind_first_charge":
      return "Привязка карты + день 1";
    case "bind_pending":
      return "Платёж в обработке";
    case "daily_charge":
      return "Ежедневное списание";
    case "charge_failed":
      return "Списание отклонено";
    case "card_unbound":
      return "Карта отвязана";
    default:
      return kind;
  }
}

/**
 * Billing tab — recurring autopay model with independent VIP catalog.
 *
 * VIP-подписки независимы от рабочей зоны: специалист может подписаться
 * на ЛЮБУЮ ИФНС России, не обязательно из своих ИФНС в каталоге. Поэтому
 * поиск работает по всем ИФНС с настроенным тарифом, а не только по
 * рабочей зоне пользователя.
 *
 * Sections:
 *   1. Hero (объяснение + ₽/мес итог + алерты)
 *   2. Saved card (если привязана) + кнопка отвязать
 *   3. "Мои подписки" — me.activeSubscriptions (включая ИФНС вне
 *      рабочей зоны)
 *   4. "Подключить новую ИФНС" — поиск + city filter chip + список
 *      результатов с кнопкой "+ N ₽/мес"
 *   5. История операций
 */
export default function BillingTab({
  topupSuccess = false,
}: {
  topupSuccess?: boolean;
}) {
  const [data, setData] = useState<MePayload | null>(null);
  const [txs, setTxs] = useState<TxItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyFnsId, setBusyFnsId] = useState<string | null>(null);
  const [unbindBusy, setUnbindBusy] = useState(false);

  // Catalog search state
  const [q, setQ] = useState("");
  const [cityFilterId, setCityFilterId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [searchResults, setSearchResults] = useState<SearchableFns[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [me, tx] = await Promise.all([
        apiGet<MePayload>("/api/billing/me"),
        apiGet<{ transactions: TxItem[] }>("/api/billing/transactions"),
      ]);
      setData(me);
      setTxs(tx.transactions);
    } catch (e) {
      if (__DEV__) console.error("billing fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ЮKassa webhook may take a beat after redirect-back. Refetch on
  // mount + 4s later so the FE catches up without a manual reload.
  useEffect(() => {
    if (!topupSuccess) return;
    const t = setTimeout(() => void refresh(), 4000);
    return () => clearTimeout(t);
  }, [topupSuccess, refresh]);

  // Cities list for the filter chips. Loaded once.
  useEffect(() => {
    apiGet<{ items: CityRow[] }>("/api/cities?limit=100")
      .then((res) => setCities(res.items))
      .catch((e) => __DEV__ && console.error("cities load", e));
  }, []);

  // Catalog search — debounced 250ms.
  useEffect(() => {
    if (!data?.isSpecialist) return;
    setSearchLoading(true);
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (cityFilterId) params.set("cityId", cityFilterId);
      params.set("limit", "30");
      apiGet<{ items: SearchableFns[] }>(`/api/billing/fns-search?${params}`)
        .then((res) => setSearchResults(res.items))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cityFilterId, data?.isSpecialist, data?.activeSubscriptions.length]);

  const redirect = useCallback((url: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      void Linking.openURL(url);
    }
  }, []);

  const handleSubscribe = useCallback(
    async (fnsId: string, fnsName: string, monthlyKopeks: number) => {
      void monthlyKopeks; // already shown on the button; backend re-reads canonical price
      void fnsName;
      setBusyFnsId(fnsId);
      try {
        const res = await apiPost<VipFnsResponse>(
          `/api/billing/vip-fns/${fnsId}`,
          {}
        );
        if (res.needsRedirect && res.confirmationUrl) {
          redirect(res.confirmationUrl);
          return;
        }
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось подключить VIP";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [redirect, refresh]
  );

  const handleUnsubscribe = useCallback(
    async (sub: ActiveSub) => {
      const confirmed = await dialog.confirm({
        title: `Отключить VIP по «${sub.fnsName}»?`,
        message:
          "Списания за эту ИФНС прекратятся со следующего дня. Карту это не отвяжет — другие подписки продолжат работать.",
        confirmLabel: "Отключить",
        destructive: true,
      });
      if (!confirmed) return;
      setBusyFnsId(sub.fnsId);
      try {
        await apiDelete(`/api/billing/vip-fns/${sub.fnsId}`);
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось отключить VIP";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [refresh]
  );

  const handleUnbind = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: "Отвязать карту?",
      message:
        "Это отключит ВСЕ ваши VIP-подписки. Чтобы возобновить — придётся привязать карту заново через любую подписку.",
      confirmLabel: "Отвязать",
      destructive: true,
    });
    if (!confirmed) return;
    setUnbindBusy(true);
    try {
      await apiDelete("/api/billing/payment-method");
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось отвязать карту";
      await dialog.alert({ title: "Ошибка", message: msg });
    } finally {
      setUnbindBusy(false);
    }
  }, [refresh]);

  // City chip-list — show top 8 with the most VIP-priced FNS to reduce
  // visual noise, plus an "Все" pseudo-chip to clear the filter.
  const cityChips = useMemo(() => {
    return cities.slice(0, 12);
  }, [cities]);

  if (loading || !data) {
    return (
      <View className="items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data.isSpecialist) {
    return (
      <Card>
        <Text className="text-base" style={{ color: colors.text }}>
          Биллинг доступен только специалистам. Заполните профиль специалиста, чтобы получать запросы клиентов и подключать приоритетные уведомления по любой ИФНС России.
        </Text>
      </Card>
    );
  }

  const activeSubs = data.activeSubscriptions;

  return (
    <View style={{ gap: 16 }}>
      {/* HERO */}
      <Card>
        <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
          <Crown size={20} color={colors.primary} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            VIP-уведомления по ИФНС
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
          Подключите подписку на любые ИФНС России — и получайте email мгновенно, как только клиент создаст запрос. Без VIP уведомление приходит с задержкой 5 минут. Списания каждый день автоматически с привязанной карты.
        </Text>

        {activeSubs.length > 0 && (
          <View
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Сейчас вы платите
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
                marginTop: 2,
              }}
            >
              {formatRub(data.monthlyEstimateKopeks)}
              <Text style={{ fontSize: 14, fontWeight: "400", color: colors.textSecondary }}>
                {" "}/ месяц
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              ≈ {formatRub(data.dailyChargeKopeks)} в день · {activeSubs.length} {activeSubs.length === 1 ? "подписка" : "подписки"}
            </Text>
          </View>
        )}

        {data.lastChargeFailedAt && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.dangerSoft,
              padding: 10,
              borderRadius: 10,
              marginTop: 16,
            }}
          >
            <AlertCircle size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>
              Последнее списание не прошло. Все подписки отключены — обновите карту, чтобы возобновить.
            </Text>
          </View>
        )}

        {topupSuccess && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.limeSoft,
              padding: 10,
              borderRadius: 10,
              marginTop: 16,
            }}
          >
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 13, flex: 1 }}>
              Платёж принят. Подписка активируется в течение нескольких секунд.
            </Text>
          </View>
        )}
      </Card>

      {/* CARD ON FILE */}
      {data.hasPaymentMethod && (
        <Card>
          <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Карта для автосписаний
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                  {data.paymentMethodTitle ?? "Карта"}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отвязать карту"
              onPress={handleUnbind}
              disabled={unbindBusy}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.white,
                },
                pressed && { opacity: 0.7 },
                unbindBusy && { opacity: 0.5 },
              ]}
            >
              <Trash2 size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {unbindBusy ? "..." : "Отвязать"}
              </Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* MY SUBSCRIPTIONS */}
      {activeSubs.length > 0 && (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
            Мои подписки
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
            За эти ИФНС вы получаете уведомления мгновенно
          </Text>
          {activeSubs.map((sub, idx) => {
            const busy = busyFnsId === sub.fnsId;
            return (
              <View
                key={sub.fnsId}
                className="flex-row items-center"
                style={{
                  gap: 12,
                  paddingTop: idx === 0 ? 0 : 12,
                  paddingBottom: 12,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <CheckCircle2 size={18} color={colors.success} style={{ flexShrink: 0 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
                    numberOfLines={1}
                  >
                    {sub.fnsName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {sub.cityName}
                    {sub.monthlyPriceKopeks != null && ` · ${formatRub(sub.monthlyPriceKopeks)}/мес`}
                    {` · с ${formatActivatedAt(sub.activatedAt)}`}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Отключить VIP по ${sub.fnsName}`}
                    onPress={() => handleUnsubscribe(sub)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.white,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <X size={12} color={colors.textSecondary} />
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      Отключить
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {/* SUBSCRIBE TO A NEW FNS */}
      <Card>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          Подключить новую ИФНС
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          {data.hasPaymentMethod
            ? "Поиск по любой ИФНС России. Подключение списывает первый день сразу с привязанной карты."
            : "Поиск по любой ИФНС России. При первом подключении вы привяжете карту и оплатите первый день одним платежом."}
        </Text>

        {/* Search input */}
        <View
          className="flex-row items-center"
          style={{
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            backgroundColor: colors.white,
            marginBottom: 12,
          }}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Код, имя ИФНС или город"
            placeholderTextColor={colors.placeholder}
            style={{
              flex: 1,
              fontSize: 14,
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

        {/* City filter chips */}
        {cityChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingBottom: 12 }}
          >
            <CityChip
              label="Все города"
              active={cityFilterId == null}
              onPress={() => setCityFilterId(null)}
            />
            {cityChips.map((c) => (
              <CityChip
                key={c.id}
                label={c.name}
                active={cityFilterId === c.id}
                onPress={() => setCityFilterId(cityFilterId === c.id ? null : c.id)}
              />
            ))}
          </ScrollView>
        )}

        {/* Results */}
        {searchLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : searchResults.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>
            {q || cityFilterId
              ? "По вашему запросу ничего не найдено."
              : "Все ИФНС с настроенным тарифом уже подключены."}
          </Text>
        ) : (
          searchResults.map((item, idx) => {
            const busy = busyFnsId === item.fnsId;
            return (
              <View
                key={item.fnsId}
                className="flex-row items-center"
                style={{
                  gap: 12,
                  paddingTop: idx === 0 ? 0 : 12,
                  paddingBottom: 12,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.fnsName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {item.cityName} · код {item.fnsCode}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Подключить VIP по ${item.fnsName}`}
                    onPress={() => handleSubscribe(item.fnsId, item.fnsName, item.monthlyPriceKopeks)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Plus size={14} color={colors.white} />
                    <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}>
                      {formatRub(item.monthlyPriceKopeks)}/мес
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </Card>

      {/* HISTORY */}
      {txs && txs.length > 0 && (
        <Card>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            История операций
          </Text>
          {txs.map((t) => {
            const isFailed = t.kind === "charge_failed";
            return (
              <View
                key={t.id}
                className="flex-row items-center py-2"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.text }}>
                    {txKindLabel(t.kind)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {new Date(t.createdAt).toLocaleString("ru-RU")}
                  </Text>
                </View>
                {t.amountKopeks !== 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isFailed ? colors.error : colors.text,
                    }}
                  >
                    {formatRub(Math.abs(t.amountKopeks))}
                  </Text>
                )}
              </View>
            );
          })}
        </Card>
      )}
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
          fontSize: 12,
          fontWeight: active ? "600" : "400",
          color: active ? colors.white : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
