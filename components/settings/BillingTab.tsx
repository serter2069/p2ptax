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
  Sparkles,
  Check,
  Clock,
  Zap,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import { dialog } from "@/lib/dialog";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

interface PlanRow {
  id: string;
  code: string;
  name: string;
  monthlyPriceKopeks: number;
  monthlyPriceRub: number;
  dailyChargeKopeks: number;
  fnsLimit: number;
  sortOrder: number;
}

interface ActiveVipFns {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
  activatedAt: string;
}

interface MePayload {
  isSpecialist: boolean;
  hasPaymentMethod: boolean;
  paymentMethodTitle: string | null;
  lastChargeFailedAt: string | null;
  plan: PlanRow | null;
  planStartedAt: string | null;
  activeVipFns: ActiveVipFns[];
  slotsUsed: number;
  slotsLimit: number;
}

interface SearchableFns {
  fnsId: string;
  fnsName: string;
  fnsCode: string;
  cityId: string;
  cityName: string;
}

interface CityRow {
  id: string;
  name: string;
  slug: string;
}

interface PlanResponse {
  ok: boolean;
  needsRedirect?: boolean;
  confirmationUrl?: string;
  alreadyActive?: boolean;
  charged?: number;
  plan?: PlanRow;
}

interface PlanTrimResponse {
  error: string;
  needsTrim: true;
  plan: PlanRow;
  slotsLimit: number;
  currentVipFns: ActiveVipFns[];
}

interface VipFnsResponse {
  ok: boolean;
  alreadyActive?: boolean;
  needsPlan?: boolean;
  slotsLimit?: number;
  slotsUsed?: number;
}

interface TxItem {
  id: string;
  amountKopeks: number;
  kind: string;
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
    case "bind_plan":
      return "Привязка карты + день 1";
    case "bind_pending":
      return "Платёж в обработке";
    case "plan_switch":
      return "Смена тарифа — день 1";
    case "plan_cancelled":
      return "Тариф отменён";
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
 * PRO tab — per-account plan + per-FNS slots.
 *
 * Three plans (Lite/Pro/Premium, editable by admin) with a fixed
 * monthly price and an FNS limit. Selecting a plan binds a card
 * (first time) or autopays one day at the new rate (mid-session
 * switch). Adding ИФНС inside the limit is free.
 */
export default function BillingTab({
  topupSuccess = false,
}: {
  topupSuccess?: boolean;
}) {
  const [data, setData] = useState<MePayload | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [txs, setTxs] = useState<TxItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [busyFnsId, setBusyFnsId] = useState<string | null>(null);
  const [unbindBusy, setUnbindBusy] = useState(false);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);
  const [trimDialog, setTrimDialog] = useState<{
    plan: PlanRow;
    keep: ActiveVipFns[];
    drop: ActiveVipFns[];
  } | null>(null);

  // Catalog search
  const [q, setQ] = useState("");
  const [cityFilterId, setCityFilterId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [searchResults, setSearchResults] = useState<SearchableFns[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [me, plansRes, tx] = await Promise.all([
        apiGet<MePayload>("/api/billing/me"),
        apiGet<{ plans: PlanRow[] }>("/api/billing/plans"),
        apiGet<{ transactions: TxItem[] }>("/api/billing/transactions"),
      ]);
      setData(me);
      setPlans(plansRes.plans);
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

  useEffect(() => {
    if (!topupSuccess) return;
    const t = setTimeout(() => void refresh(), 4000);
    return () => clearTimeout(t);
  }, [topupSuccess, refresh]);

  useEffect(() => {
    apiGet<{ items: CityRow[] }>("/api/cities?limit=100")
      .then((res) => setCities(res.items))
      .catch(() => undefined);
  }, []);

  // Catalog search debounced 250ms.
  useEffect(() => {
    if (!data?.isSpecialist || !data.plan) {
      setSearchResults([]);
      return;
    }
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
  }, [q, cityFilterId, data?.isSpecialist, data?.plan, data?.activeVipFns.length]);

  const redirect = useCallback((url: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      void Linking.openURL(url);
    }
  }, []);

  const submitPlan = useCallback(
    async (planId: string, removeFnsIds?: string[]) => {
      setBusyPlanId(planId);
      try {
        const res = await apiPost<PlanResponse | PlanTrimResponse>(
          "/api/billing/plan",
          { planId, removeFnsIds }
        );
        if ((res as PlanTrimResponse).needsTrim) {
          const tr = res as PlanTrimResponse;
          // Auto-pre-select newest rows to drop.
          const overflow = tr.currentVipFns.length - tr.slotsLimit;
          const drop = tr.currentVipFns.slice(0, overflow);
          const keep = tr.currentVipFns.slice(overflow);
          setTrimDialog({ plan: tr.plan, keep, drop });
          return;
        }
        const ok = res as PlanResponse;
        if (ok.needsRedirect && ok.confirmationUrl) {
          redirect(ok.confirmationUrl);
          return;
        }
        setShowPlanSwitcher(false);
        setTrimDialog(null);
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось сменить тариф";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyPlanId(null);
      }
    },
    [redirect, refresh]
  );

  const handleSubscribeFns = useCallback(
    async (fnsId: string) => {
      setBusyFnsId(fnsId);
      try {
        const res = await apiPost<VipFnsResponse>(
          `/api/billing/vip-fns/${fnsId}`,
          {}
        );
        if (res.needsPlan) {
          await dialog.alert({
            title: "Сначала выберите тариф",
            message: "Чтобы добавлять ИФНС в VIP, нужен активный тариф PRO.",
          });
          return;
        }
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось добавить ИФНС";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [refresh]
  );

  const handleRemoveFns = useCallback(
    async (sub: ActiveVipFns) => {
      const confirmed = await dialog.confirm({
        title: `Убрать «${sub.fnsName}» из VIP?`,
        message:
          "Уведомления по этой ИФНС снова будут приходить с задержкой 5 минут. Вернуть в VIP можно в любой момент.",
        confirmLabel: "Убрать",
        destructive: true,
      });
      if (!confirmed) return;
      setBusyFnsId(sub.fnsId);
      try {
        await apiDelete(`/api/billing/vip-fns/${sub.fnsId}`);
        await refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Не удалось убрать ИФНС";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyFnsId(null);
      }
    },
    [refresh]
  );

  const handleCancelPlan = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: "Отменить тариф?",
      message:
        "Все VIP-ИФНС будут сняты, ежедневные списания прекратятся. Карта останется привязанной — её можно отвязать отдельно.",
      confirmLabel: "Отменить тариф",
      destructive: true,
    });
    if (!confirmed) return;
    setBusyPlanId("__cancel__");
    try {
      await apiDelete("/api/billing/plan");
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось отменить тариф";
      await dialog.alert({ title: "Ошибка", message: msg });
    } finally {
      setBusyPlanId(null);
    }
  }, [refresh]);

  const handleUnbind = useCallback(async () => {
    const confirmed = await dialog.confirm({
      title: "Отвязать карту?",
      message:
        "Это отменит тариф и снимет все VIP-ИФНС. Чтобы возобновить — придётся выбрать тариф заново и привязать карту.",
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

  const cityChips = useMemo(() => cities.slice(0, 12), [cities]);

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
          PRO доступен только специалистам. Заполните профиль специалиста, чтобы подключить тариф и получать приоритетные уведомления по выбранным ИФНС.
        </Text>
      </Card>
    );
  }

  const hasPlan = !!data.plan;

  // ─── trim dialog (downgrade) ─────────────────────────────────────
  if (trimDialog) {
    const overflow = trimDialog.drop.length;
    const allFns = [...trimDialog.keep, ...trimDialog.drop];
    const dropIds = new Set(trimDialog.drop.map((f) => f.fnsId));
    const toggleDrop = (sub: ActiveVipFns) => {
      const newDrop = new Set(dropIds);
      if (newDrop.has(sub.fnsId)) newDrop.delete(sub.fnsId);
      else newDrop.add(sub.fnsId);
      const drop = allFns.filter((f) => newDrop.has(f.fnsId));
      const keep = allFns.filter((f) => !newDrop.has(f.fnsId));
      setTrimDialog({ ...trimDialog, drop, keep });
    };
    const canSwitch = trimDialog.drop.length === overflow;
    return (
      <Card>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          Перейти на тариф {trimDialog.plan.name}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 }}>
          Лимит тарифа — {trimDialog.plan.fnsLimit} ИФНС. У вас сейчас{" "}
          {allFns.length}, нужно убрать {overflow}. Отметьте, какие исключить:
        </Text>
        <View style={{ marginTop: 12 }}>
          {allFns.map((sub, idx) => {
            const drop = dropIds.has(sub.fnsId);
            return (
              <Pressable
                key={sub.fnsId}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: drop }}
                onPress={() => toggleDrop(sub)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: drop ? colors.error : colors.border,
                    backgroundColor: drop ? colors.error : colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {drop && <Check size={12} color={colors.white} strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.text }} numberOfLines={1}>
                    {sub.fnsName}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {sub.cityName} · код {sub.fnsCode}
                  </Text>
                </View>
                {drop && (
                  <Text style={{ fontSize: 11, color: colors.error, fontWeight: "600" }}>
                    Убрать
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row" style={{ gap: 8, marginTop: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отменить смену тарифа"
            onPress={() => setTrimDialog(null)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 11,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.white,
                alignItems: "center",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
              Отмена
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Перейти на тариф ${trimDialog.plan.name}`}
            disabled={!canSwitch || busyPlanId === trimDialog.plan.id}
            onPress={() =>
              submitPlan(
                trimDialog.plan.id,
                trimDialog.drop.map((d) => d.fnsId)
              )
            }
            style={({ pressed }) => [
              {
                flex: 2,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              },
              (!canSwitch || busyPlanId === trimDialog.plan.id) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ color: colors.white, fontWeight: "600" }}>
              {busyPlanId === trimDialog.plan.id
                ? "..."
                : `Перейти на ${trimDialog.plan.name}`}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  // ─── no plan: upsell screen ─────────────────────────────────────
  if (!hasPlan) {
    return (
      <View style={{ gap: 16 }}>
        {/* Hero — value prop */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            padding: 24,
            gap: 8,
          }}
        >
          <View
            className="flex-row items-center"
            style={{ gap: 6, marginBottom: 4 }}
          >
            <Crown size={16} color={colors.white} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.white,
                textTransform: "uppercase",
                letterSpacing: 1,
                opacity: 0.9,
              }}
            >
              PRO для специалистов
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.white, lineHeight: 30 }}>
            Получайте новые запросы первым
          </Text>
          <Text style={{ fontSize: 14, color: colors.white, opacity: 0.92, lineHeight: 20, marginTop: 4 }}>
            Email о свежем запросе клиента приходит мгновенно. Без PRO — с задержкой 5 минут, и пока вы получаете уведомление, на запрос уже отвечают другие специалисты.
          </Text>
        </View>

        {/* "How it works" card */}
        <Card>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Как работает PRO
          </Text>
          <View style={{ gap: 14 }}>
            <BulletRow
              n={1}
              title="Выбираете тариф"
              text="Lite, Pro или Premium — отличаются только лимитом ИФНС, по которым вы получаете VIP-уведомления."
            />
            <BulletRow
              n={2}
              title="Отмечаете нужные ИФНС"
              text="В пределах лимита тарифа можно подписаться на любые ИФНС России и менять список в любой момент бесплатно."
            />
            <BulletRow
              n={3}
              title="Получаете запросы мгновенно"
              text="Как только клиент создаст запрос по вашей ИФНС, email уходит к вам сразу — без 5-минутной задержки."
            />
          </View>
        </Card>

        {/* Comparison: free vs PRO */}
        <Card>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Без PRO и с PRO
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>
                  Без PRO
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                Email о запросе приходит через 5 минут. К этому моменту первые отклики уже улетели от других.
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.primary,
                gap: 8,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Zap size={14} color={colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
                  С PRO
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.text, lineHeight: 18 }}>
                Email приходит мгновенно. Вы первый видите запрос — больше шансов получить клиента.
              </Text>
            </View>
          </View>
        </Card>

        {/* Plans header */}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            Выберите тариф
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
            Тариф = лимит ИФНС в VIP. Цена списывается каждый день автоматически (1/30 от месячной). Можно сменить тариф или отменить в любой момент.
          </Text>
        </View>

        {data.lastChargeFailedAt && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.dangerSoft,
              padding: 10,
              borderRadius: 10,
            }}
          >
            <AlertCircle size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>
              Прошлое списание не прошло. Подключитесь снова — попросим обновить карту.
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
            }}
          >
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={{ color: colors.success, fontSize: 13, flex: 1 }}>
              Платёж принят. Тариф активируется в течение нескольких секунд.
            </Text>
          </View>
        )}

        <PlanCardsRow
          plans={plans}
          activePlanId={null}
          busyPlanId={busyPlanId}
          onSelect={(p) => submitPlan(p.id)}
        />

        {/* FAQ */}
        <Card>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            Частые вопросы
          </Text>
          <FaqItem
            q="Как происходит списание?"
            a="Раз в день автоматически с привязанной карты — 1/30 от месячной цены тарифа. Один платёж покрывает все ИФНС, которые вы добавили в VIP."
          />
          <FaqItem
            q="Можно ли менять список ИФНС?"
            a="Да, в любой момент. Добавлять и убирать ИФНС в пределах лимита тарифа — бесплатно. Денег за конкретные ИФНС не берём."
          />
          <FaqItem
            q="А если я хочу больше ИФНС?"
            a="Нажмите «Сменить тариф» и выберите более ёмкий. Со следующего дня списание будет по новой цене."
          />
          <FaqItem
            q="Можно ли отменить?"
            a="Да, кнопкой «Отменить тариф». Списания прекратятся со следующего дня, все VIP-ИФНС снимутся, карта останется привязанной."
            last
          />
        </Card>
      </View>
    );
  }

  // ─── has plan: management screen ────────────────────────────────
  const plan = data.plan!;
  const slotsLeft = data.slotsLimit - data.slotsUsed;

  return (
    <View style={{ gap: 16 }}>
      {/* Plan header */}
      <Card>
        <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
          <View className="flex-row items-center" style={{ gap: 10, flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Ваш тариф
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
                {plan.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {formatRub(plan.monthlyPriceKopeks)}/мес · ≈ {formatRub(plan.dailyChargeKopeks)}/день
                {data.planStartedAt && ` · с ${formatActivatedAt(data.planStartedAt)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Slot counter */}
        <View
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Слотов ИФНС: <Text style={{ color: colors.text, fontWeight: "700" }}>
              {data.slotsUsed}/{data.slotsLimit}
            </Text>
            {slotsLeft > 0 && ` · свободно ${slotsLeft}`}
          </Text>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.surface,
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.min(100, (data.slotsUsed / Math.max(1, data.slotsLimit)) * 100)}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>

        <View className="flex-row" style={{ gap: 8, marginTop: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Сменить тариф"
            onPress={() => setShowPlanSwitcher((v) => !v)}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.white,
                alignItems: "center",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
              {showPlanSwitcher ? "Скрыть тарифы" : "Сменить тариф"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отменить тариф"
            onPress={handleCancelPlan}
            disabled={busyPlanId === "__cancel__"}
            style={({ pressed }) => [
              {
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.white,
                alignItems: "center",
                flexDirection: "row",
                gap: 6,
              },
              pressed && { opacity: 0.7 },
              busyPlanId === "__cancel__" && { opacity: 0.5 },
            ]}
          >
            <X size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 13 }}>
              Отменить
            </Text>
          </Pressable>
        </View>

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
              Последнее списание не прошло. Обновите карту.
            </Text>
          </View>
        )}
      </Card>

      {/* Plan switcher (when toggled) */}
      {showPlanSwitcher && (
        <PlanCardsRow
          plans={plans}
          activePlanId={plan.id}
          busyPlanId={busyPlanId}
          onSelect={(p) => submitPlan(p.id)}
        />
      )}

      {/* Saved card */}
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

      {/* Active VIP FNS */}
      {data.activeVipFns.length > 0 && (
        <Card>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
            Мои VIP-ИФНС
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
            По этим ИФНС email приходит мгновенно
          </Text>
          {data.activeVipFns.map((sub, idx) => {
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
                    {sub.cityName} · код {sub.fnsCode} · с {formatActivatedAt(sub.activatedAt)}
                  </Text>
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Убрать ${sub.fnsName} из VIP`}
                    onPress={() => handleRemoveFns(sub)}
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
                      Убрать
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {/* Add ИФНС */}
      <Card>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          Добавить ИФНС в VIP
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          {slotsLeft > 0
            ? `Свободно ${slotsLeft} из ${data.slotsLimit}. Поиск по любой ИФНС России.`
            : `Лимит тарифа исчерпан (${data.slotsUsed}/${data.slotsLimit}). Чтобы добавить ещё — повысьте тариф или уберите одну из текущих.`}
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
            opacity: slotsLeft <= 0 ? 0.5 : 1,
          }}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Код, имя ИФНС или город"
            placeholderTextColor={colors.placeholder}
            editable={slotsLeft > 0}
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
        {slotsLeft > 0 && cityChips.length > 0 && (
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
        {slotsLeft <= 0 ? null : searchLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : searchResults.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>
            {q || cityFilterId
              ? "По вашему запросу ничего не найдено."
              : "Все доступные ИФНС уже добавлены в VIP."}
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
                    accessibilityLabel={`Добавить ${item.fnsName} в VIP`}
                    onPress={() => handleSubscribeFns(item.fnsId)}
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
                      Добавить
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </Card>

      {/* History */}
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

// ─── plan cards row (used both for upsell and switcher) ──────────────

function PlanCardsRow({
  plans,
  activePlanId,
  busyPlanId,
  onSelect,
}: {
  plans: PlanRow[];
  activePlanId: string | null;
  busyPlanId: string | null;
  onSelect: (p: PlanRow) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {plans.map((p) => {
        const active = p.id === activePlanId;
        const busy = busyPlanId === p.id;
        return (
          <View
            key={p.id}
            style={{
              flexBasis: 240,
              flexGrow: 1,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.primary : colors.border,
              borderRadius: 14,
              padding: 16,
              backgroundColor: colors.white,
              gap: 8,
            }}
          >
            <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
                {p.name}
              </Text>
              {active && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: colors.accentSoft,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>
                    ВАШ ТАРИФ
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 4 }}>
              {formatRub(p.monthlyPriceKopeks)}
              <Text style={{ fontSize: 13, fontWeight: "400", color: colors.textSecondary }}>
                {" "}/ мес
              </Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              ≈ {formatRub(p.dailyChargeKopeks)} в день
            </Text>
            <View
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Check size={14} color={colors.success} />
                <Text style={{ fontSize: 13, color: colors.text }}>
                  До <Text style={{ fontWeight: "700" }}>{p.fnsLimit}</Text> ИФНС в VIP
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 6, marginTop: 6 }}>
                <Check size={14} color={colors.success} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Email о новом запросе мгновенно
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Подключить тариф ${p.name}`}
              disabled={active || busy}
              onPress={() => onSelect(p)}
              style={({ pressed }) => [
                {
                  marginTop: 12,
                  paddingVertical: 11,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: active ? colors.surface : colors.primary,
                  borderWidth: active ? 1 : 0,
                  borderColor: colors.border,
                },
                pressed && !active && { opacity: 0.85 },
                busy && { opacity: 0.6 },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.textSecondary : colors.white,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {busy
                  ? "..."
                  : active
                  ? "Уже активен"
                  : activePlanId
                  ? `Перейти на ${p.name}`
                  : `Подключить за ${formatRub(p.monthlyPriceKopeks)}/мес`}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function BulletRow({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.accentSoft,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
          {n}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

function FaqItem({ q, a, last }: { q: string; a: string; last?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
        {q}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
        {a}
      </Text>
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
