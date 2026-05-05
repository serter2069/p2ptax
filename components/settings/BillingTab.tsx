import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { Wallet, CreditCard, Crown, Check } from "lucide-react-native";
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

interface BalancePayload {
  isSpecialist: boolean;
  balanceKopeks: number;
  balanceRub: number;
  dailyChargeKopeks: number;
  dailyChargeRub: number;
  daysCovered: number | null;
  fnsCatalog: FnsCatalogItem[];
}

interface TopupResponse {
  paymentId: string;
  confirmationUrl: string;
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

const QUICK_TOPUPS_KOPEKS = [50000, 100000, 200000, 500000];

function formatRub(kopeks: number): string {
  const rub = kopeks / 100;
  return `${rub.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

function txKindLabel(kind: string): string {
  switch (kind) {
    case "topup": return "Пополнение";
    case "topup_pending": return "Платёж в обработке";
    case "daily_charge": return "Ежедневное списание";
    case "vip_deactivated": return "VIP отключён (нет средств)";
    case "refund": return "Возврат";
    case "admin_adjust": return "Корректировка";
    default: return kind;
  }
}

/**
 * Billing tab — VIP wallet + per-FNS subscription toggles + transaction
 * history. Shown on /profile?tab=billing for users with isSpecialist=true.
 *
 * Architecture note: top-up creates a redirect-flow ЮKassa Payment;
 * we open the confirmation_url and let the user pay over there. On
 * success ЮKassa returns them to /profile?tab=billing&topup=ok and
 * fires the webhook on the server, which credits the wallet — the FE
 * just refetches the balance when ?topup=ok is present.
 */
export default function BillingTab({
  topupSuccess = false,
}: {
  topupSuccess?: boolean;
}) {
  const [data, setData] = useState<BalancePayload | null>(null);
  const [txs, setTxs] = useState<TxItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyFnsId, setBusyFnsId] = useState<string | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);
  const [customTopup, setCustomTopup] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [bal, tx] = await Promise.all([
        apiGet<BalancePayload>("/api/billing/balance"),
        apiGet<{ transactions: TxItem[] }>("/api/billing/transactions"),
      ]);
      setData(bal);
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

  // After ЮKassa redirects back with ?topup=ok, the webhook may take a
  // beat to land. Refetch once on mount, then again 4s later, so the
  // updated balance shows up without a manual refresh.
  useEffect(() => {
    if (!topupSuccess) return;
    const t = setTimeout(() => void refresh(), 4000);
    return () => clearTimeout(t);
  }, [topupSuccess, refresh]);

  const handleToggle = useCallback(
    async (item: FnsCatalogItem, next: boolean) => {
      if (item.monthlyPriceKopeks == null) return;
      setBusyFnsId(item.fnsId);
      try {
        if (next) {
          await apiPost(`/api/billing/vip-fns/${item.fnsId}`, {});
        } else {
          await apiDelete(`/api/billing/vip-fns/${item.fnsId}`);
        }
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось изменить подписку";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [refresh]
  );

  const handleTopup = useCallback(
    async (kopeks: number) => {
      if (kopeks < 10000 || kopeks > 10_000_000) {
        await dialog.alert({
          title: "Сумма вне диапазона",
          message: "Минимум 100 ₽, максимум 100 000 ₽ за один платёж.",
        });
        return;
      }
      setTopupBusy(true);
      try {
        const res = await apiPost<TopupResponse>("/api/billing/topup", {
          amountKopeks: kopeks,
        });
        // Redirect the browser straight to the ЮKassa hosted checkout.
        // On native we'd Linking.openURL — on web window.location.href
        // keeps the user inside the same browser tab so they come back
        // to /profile?tab=billing&topup=ok after paying.
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.location.href = res.confirmationUrl;
        } else {
          await Linking.openURL(res.confirmationUrl);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось создать платёж";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setTopupBusy(false);
      }
    },
    []
  );

  const customTopupKopeks = useMemo(() => {
    const n = parseFloat(customTopup.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }, [customTopup]);

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

  return (
    <View style={{ gap: 16 }}>
      {/* WALLET HEADER */}
      <Card>
        <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
          <Wallet size={18} color={colors.primary} />
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            VIP-баланс
          </Text>
        </View>
        <Text style={{ fontSize: 32, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          {formatRub(data.balanceKopeks)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
          {data.dailyChargeKopeks > 0
            ? `Расход ${formatRub(data.dailyChargeKopeks)}/день · хватит на ${data.daysCovered ?? "—"} дн.`
            : "Активных VIP-подписок нет"}
        </Text>
        {topupSuccess && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.limeSoft,
              padding: 10,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <Check size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 13, flex: 1 }}>
              Платёж принят. Баланс обновится в течение нескольких секунд.
            </Text>
          </View>
        )}
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {QUICK_TOPUPS_KOPEKS.map((amount) => (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityLabel={`Пополнить на ${formatRub(amount)}`}
              onPress={() => handleTopup(amount)}
              disabled={topupBusy}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: colors.accentSoft,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
                topupBusy && { opacity: 0.5 },
              ]}
            >
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                + {formatRub(amount)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View
          className="flex-row items-center mt-3"
          style={{ gap: 8 }}
        >
          <TextInput
            value={customTopup}
            onChangeText={setCustomTopup}
            placeholder="Своя сумма (₽)"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              backgroundColor: colors.white,
              color: colors.text,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Пополнить произвольной суммой"
            disabled={!customTopupKopeks || topupBusy}
            onPress={() => customTopupKopeks && handleTopup(customTopupKopeks)}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: colors.primary,
              },
              (!customTopupKopeks || topupBusy) && { opacity: 0.5 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <CreditCard size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: "600", fontSize: 14 }}>
              {topupBusy ? "..." : "Пополнить"}
            </Text>
          </Pressable>
        </View>
      </Card>

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
            const positive = t.amountKopeks > 0;
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
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: positive ? colors.success : colors.text,
                  }}
                >
                  {positive ? "+" : ""}
                  {formatRub(Math.abs(t.amountKopeks))}
                </Text>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}
