import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { CreditCard, Crown, AlertCircle, Trash2 } from "lucide-react-native";
import Card from "@/components/ui/Card";
import StyledSwitch from "@/components/ui/StyledSwitch";
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
 * Billing tab — recurring autopay model. No top-ups, no balance.
 *
 *   - First VIP-FNS toggle: backend creates a redirect-flow ЮKassa
 *     payment for one day's price + save_payment_method:true. We
 *     send the user to confirmation_url; on return ?vip=ok we
 *     refetch /me until the webhook lands the saved card.
 *   - Subsequent toggles: server-to-server autopay using the saved
 *     card, instant. The toggle returns ok+charged immediately.
 *   - The cron handles daily renewals; nothing for the user to do.
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

  // After ЮKassa redirects back with ?vip=ok the webhook may still
  // be in flight. Refetch on mount + 4s later so the UI catches up.
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

  const handleToggle = useCallback(
    async (item: FnsCatalogItem, next: boolean) => {
      if (item.monthlyPriceKopeks == null) return;
      setBusyFnsId(item.fnsId);
      try {
        if (next) {
          const res = await apiPost<VipFnsResponse>(
            `/api/billing/vip-fns/${item.fnsId}`,
            {}
          );
          if (res.needsRedirect && res.confirmationUrl) {
            redirect(res.confirmationUrl);
            return;
          }
          await refresh();
        } else {
          await apiDelete(`/api/billing/vip-fns/${item.fnsId}`);
          await refresh();
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось изменить подписку";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [redirect, refresh]
  );

  const handleUnbind = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: "Отвязать карту?",
      message:
        "Это отключит все ваши VIP-подписки. Чтобы возобновить — придётся привязать карту заново.",
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
          Биллинг доступен только специалистам. Заполните профиль специалиста, чтобы получать запросы клиентов и подписаться на приоритетные уведомления по вашим ИФНС.
        </Text>
      </Card>
    );
  }

  const activeCount = data.fnsCatalog.filter((f) => f.vipActive).length;

  return (
    <View style={{ gap: 16 }}>
      {/* CARD HEADER */}
      <Card>
        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
          <CreditCard size={18} color={colors.primary} />
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            Способ оплаты
          </Text>
        </View>

        {data.hasPaymentMethod ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
              {data.paymentMethodTitle ?? "Карта"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
              Списания происходят раз в день автоматически. Включите подписку у нужной ИФНС ниже.
            </Text>
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
                  alignSelf: "flex-start",
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
                {unbindBusy ? "..." : "Отвязать карту"}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Карта пока не привязана. Включите VIP у любой ИФНС ниже — сначала вы оплатите первый день и привяжете карту, дальше списания автоматические.
          </Text>
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
              marginTop: 12,
            }}
          >
            <AlertCircle size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>
              Последнее списание не прошло. Привяжите действующую карту, чтобы возобновить подписки.
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
              marginTop: 12,
            }}
          >
            <Text style={{ color: colors.success, fontSize: 13, flex: 1 }}>
              Платёж принят. Подписка активируется в течение нескольких секунд.
            </Text>
          </View>
        )}
      </Card>

      {/* SUMMARY */}
      {activeCount > 0 && (
        <Card>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Активных подписок: <Text style={{ color: colors.text, fontWeight: "600" }}>{activeCount}</Text>
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 4 }}>
            {formatRub(data.dailyChargeKopeks)}
            <Text style={{ fontSize: 14, fontWeight: "400", color: colors.textSecondary }}>
              {" "}/ день
            </Text>
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            ≈ {formatRub(data.monthlyEstimateKopeks)} в месяц
          </Text>
        </Card>
      )}

      {/* FNS LIST */}
      <Card>
        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
          <Crown size={18} color={colors.primary} />
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            Приоритетные уведомления по ИФНС
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
          VIP получает email о новом запросе сразу, остальные специалисты — через 5 минут.
          Стоимость списывается ежедневно из месячного тарифа ÷ 30.
        </Text>
        {data.fnsCatalog.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Сначала добавьте ИФНС в рабочую зону на вкладке «Профиль».
          </Text>
        ) : (
          data.fnsCatalog.map((item) => {
            const noTariff = item.monthlyPriceKopeks == null;
            const busy = busyFnsId === item.fnsId;
            return (
              <View
                key={item.fnsId}
                className="flex-row items-center py-3"
                style={{
                  gap: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                    {item.fnsName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {item.cityName}
                    {!noTariff && ` · ${formatRub(item.monthlyPriceKopeks!)}/мес`}
                  </Text>
                </View>
                {noTariff ? (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    тариф не настроен
                  </Text>
                ) : busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <StyledSwitch
                    value={item.vipActive}
                    onValueChange={(v) => handleToggle(item, v)}
                  />
                )}
              </View>
            );
          })
        )}
      </Card>

      {/* TRANSACTION HISTORY */}
      <Card>
        <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
          История операций
        </Text>
        {!txs || txs.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Операций пока нет.
          </Text>
        ) : (
          txs.map((t) => {
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
          })
        )}
      </Card>
    </View>
  );
}
