import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import {
  CreditCard,
  Crown,
  AlertCircle,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import { dialog } from "@/lib/dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

interface FnsCatalogItem {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
  monthlyPriceKopeks: number | null;
  monthlyPriceRub: number | null;
  dailyChargeKopeks: number | null;
  vipActive: boolean;
  activatedAt: string | null;
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
  fnsCatalog: FnsCatalogItem[];
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
 * Billing tab — recurring autopay model.
 *
 * Two-list layout:
 *   1. "Мои VIP-подписки" — what's active right now, with the price
 *      and "Отключить" button. Empty-state explains how it works.
 *   2. "Доступно для подключения" — FNS in the specialist's working
 *      area with a configured price and no active subscription.
 *      Each row has a single "Подключить за N ₽/мес" CTA — first
 *      click redirects to ЮKassa to bind the card; subsequent rows
 *      autopay instantly.
 *
 * Card details + monthly summary live in a top hero card so the
 * user can see at a glance what they pay and which card it'll come
 * from. History is collapsed at the bottom — most users won't open it.
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

  const redirect = useCallback((url: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      void Linking.openURL(url);
    }
  }, []);

  const handleSubscribe = useCallback(
    async (item: FnsCatalogItem) => {
      if (item.monthlyPriceKopeks == null) return;
      setBusyFnsId(item.fnsId);
      try {
        const res = await apiPost<VipFnsResponse>(
          `/api/billing/vip-fns/${item.fnsId}`,
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
    async (item: FnsCatalogItem) => {
      const confirmed = await dialog.confirm({
        title: `Отключить VIP по «${item.fnsName}»?`,
        message:
          "Списания за эту ИФНС прекратятся со следующего дня. Карту это не отвяжет — другие подписки продолжат работать.",
        confirmLabel: "Отключить",
        destructive: true,
      });
      if (!confirmed) return;
      setBusyFnsId(item.fnsId);
      try {
        await apiDelete(`/api/billing/vip-fns/${item.fnsId}`);
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

  const { activeSubs, available, unavailable } = useMemo(() => {
    if (!data) return { activeSubs: [], available: [], unavailable: [] };
    const active: FnsCatalogItem[] = [];
    const avail: FnsCatalogItem[] = [];
    const unav: FnsCatalogItem[] = [];
    for (const item of data.fnsCatalog) {
      if (item.vipActive) active.push(item);
      else if (item.monthlyPriceKopeks == null) unav.push(item);
      else avail.push(item);
    }
    return { activeSubs: active, available: avail, unavailable: unav };
  }, [data]);

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
          Биллинг доступен только специалистам. Заполните профиль специалиста, чтобы получать запросы клиентов и подключать приоритетные уведомления по вашим ИФНС.
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* HERO — что такое VIP + что я уже плачу */}
      <Card>
        <View className="flex-row items-center" style={{ gap: 8, marginBottom: 8 }}>
          <Crown size={20} color={colors.primary} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            VIP-уведомления по ИФНС
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
          Подключаете подписку на нужные ИФНС — приходит email сразу, как только клиент создаст запрос. Без VIP уведомление приходит с задержкой 5 минут. Списания каждый день автоматически с привязанной карты.
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
          {activeSubs.map((item, idx) => {
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
                <CheckCircle2 size={18} color={colors.success} style={{ flexShrink: 0 }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
                    numberOfLines={1}
                  >
                    {item.fnsName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {item.cityName} · {formatRub(item.monthlyPriceKopeks!)}/мес
                    {item.activatedAt && ` · с ${formatActivatedAt(item.activatedAt)}`}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Отключить VIP по ${item.fnsName}`}
                    onPress={() => handleUnsubscribe(item)}
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

      {/* AVAILABLE TO SUBSCRIBE */}
      <Card>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          Доступно для подключения
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          {data.hasPaymentMethod
            ? "Подключение списывает первый день сразу с привязанной карты."
            : "При первом подключении вы привяжете карту и оплатите первый день."}
        </Text>

        {available.length === 0 && unavailable.length === 0 && (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Сначала добавьте ИФНС в рабочую зону на вкладке «Профиль».
          </Text>
        )}

        {available.length === 0 && unavailable.length === 0 ? null : available.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Все доступные ИФНС вашей рабочей зоны уже подключены.
          </Text>
        ) : (
          available.map((item, idx) => {
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
                    onPress={() => handleSubscribe(item)}
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
                      {formatRub(item.monthlyPriceKopeks!)}/мес
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        {unavailable.length > 0 && (
          <View
            style={{
              marginTop: available.length > 0 ? 16 : 0,
              paddingTop: available.length > 0 ? 12 : 0,
              borderTopWidth: available.length > 0 ? 1 : 0,
              borderTopColor: colors.border,
            }}
          >
            <View
              className="flex-row items-center"
              style={{ gap: 6, marginBottom: 6 }}
            >
              <Clock size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Тариф пока не настроен
              </Text>
            </View>
            {unavailable.map((item) => (
              <Text
                key={item.fnsId}
                style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}
              >
                {item.fnsName} · {item.cityName}
              </Text>
            ))}
          </View>
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
