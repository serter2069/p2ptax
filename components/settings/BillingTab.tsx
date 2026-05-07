import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
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
  Search,
  Sparkles,
  Check,
  Clock,
  Zap,
  MapPin,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import FnsLogo from "@/components/fns/FnsLogo";
import { dialog } from "@/lib/dialog";
import { apiGet, apiPost, apiDelete, ApiError } from "@/lib/api";
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
  planNextChargeAt: string | null;
  /** Запланированная смена на следующее продление (downgrade или
   *  равноценный план). null когда смены не запланировано. */
  pendingPlan: PlanRow | null;
  pendingPlanScheduledAt: string | null;
  /** Список FNS-id, которые юзер выбрал ОСТАВИТЬ при apply. Пустой
   *  массив = trim не требуется. */
  pendingPlanKeepFnsIds: string[];
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
  // Первое подключение → ЮKassa redirect.
  needsRedirect?: boolean;
  confirmationUrl?: string;
  // Same plan idempotent.
  alreadyActive?: boolean;
  // Upgrade: списано прямо сейчас, цикл сброшен.
  charged?: number;
  plan?: PlanRow;
  nextChargeAt?: string;
  // Downgrade/equal: смена запланирована на следующее продление.
  scheduled?: boolean;
  pendingPlan?: PlanRow;
  currentPlan?: PlanRow | null;
  applyAt?: string | null;
  pendingPlanKeepFnsIds?: string[];
  // Описание для UI.
  message?: string;
}

/** 409 ответ когда downgrade требует выбора, какие ИФНС оставить. */
interface NeedsKeepResponse {
  error: string;
  needsKeepSelection: true;
  newPlan: PlanRow;
  newLimit: number;
  currentSlots: number;
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
      return "Подключение тарифа";
    case "plan_upgrade":
      return "Апгрейд тарифа";
    case "plan_scheduled":
      return "Смена тарифа запланирована";
    case "plan_pending_cancelled":
      return "Смена тарифа отменена";
    case "plan_applied":
      return "Применён новый тариф";
    case "plan_switch":
      return "Смена тарифа";
    case "plan_cancelled":
      return "Тариф отменён";
    case "monthly_charge":
      return "Ежемесячное списание";
    case "charge_failed":
      return "Списание отклонено";
    case "card_unbound":
      return "Карта отвязана";
    default:
      return kind;
  }
}

// Old per-day model — скрываем из истории, чтобы не путать
// пользователей пачкой 16,67 ₽-записей и «платежей в обработке».
const HIDDEN_TX_KINDS = new Set(["daily_charge", "bind_pending"]);

// Те же чипы, что на /fns — быстрый выбор без печатания.
const TOP_CITY_NAMES = ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"];

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
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [cancelPendingBusy, setCancelPendingBusy] = useState(false);
  // Keep-picker для downgrade когда currentSlots > newLimit. Юзер
  // выбирает какие N (newLimit) ИФНС оставить — остальные cron
  // отключит на следующем продлении.
  const [keepPicker, setKeepPicker] = useState<{
    plan: PlanRow;
    keepIds: Set<string>;
  } | null>(null);

  // Catalog search — city-first: typeahead по городу, после выбора
  // показываем все ИФНС в нём (как на /fns).
  const [cityQuery, setCityQuery] = useState("");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [cityFilterId, setCityFilterId] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [searchResults, setSearchResults] = useState<SearchableFns[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    apiGet<{ items: CityRow[] }>("/api/cities?limit=1000")
      .then((res) => setCities(res.items))
      .catch(() => undefined);
  }, []);

  // Топ-5 городов на чипах — быстрый выбор, как на /fns.
  const topCities = useMemo(() => {
    return TOP_CITY_NAMES.map((name) => cities.find((c) => c.name === name)).filter(
      (c): c is CityRow => !!c
    );
  }, [cities]);

  // Совпадения для дропдауна (≥2 символов, до 8 результатов).
  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    if (cityFilterId) {
      const cur = cities.find((c) => c.id === cityFilterId);
      if (cur && cur.name.toLowerCase() === q) return [];
    }
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cityQuery, cities, cityFilterId]);

  const pickCity = useCallback((city: CityRow) => {
    setCityFilterId(city.id);
    setCityQuery(city.name);
    setCityDropdownOpen(false);
  }, []);

  const clearCity = useCallback(() => {
    setCityFilterId(null);
    setCityQuery("");
    setCityDropdownOpen(false);
  }, []);

  // Когда подписан последний слот — авто-закрываем панель «подключить»,
  // иначе пользователь смотрит на бесполезный поиск с дисабленными
  // кнопками. Дальнейшее действие — апгрейд тарифа.
  useEffect(() => {
    if (!data) return;
    const left = data.slotsLimit - data.slotsUsed;
    if (left <= 0 && showAddSearch) {
      setShowAddSearch(false);
      clearCity();
    }
  }, [data, showAddSearch, clearCity]);

  // Catalog search — fires только когда выбран город (паттерн как на /fns).
  useEffect(() => {
    if (!data?.isSpecialist || !data.plan || !cityFilterId) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const params = new URLSearchParams();
    params.set("cityId", cityFilterId);
    params.set("limit", "100");
    apiGet<{ items: SearchableFns[] }>(`/api/billing/fns-search?${params}`)
      .then((res) => setSearchResults(res.items))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [cityFilterId, data?.isSpecialist, data?.plan, data?.activeVipFns.length]);

  const redirect = useCallback((url: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = url;
    } else {
      void Linking.openURL(url);
    }
  }, []);

  const submitPlan = useCallback(
    async (planId: string, keepFnsIds?: string[]) => {
      setBusyPlanId(planId);
      try {
        const ok = await apiPost<PlanResponse>("/api/billing/plan", {
          planId,
          ...(keepFnsIds ? { keepFnsIds } : {}),
        });
        // ── Path 1: первое подключение → ЮKassa redirect ──
        if (ok.needsRedirect && ok.confirmationUrl) {
          redirect(ok.confirmationUrl);
          return;
        }
        setShowPlanSwitcher(false);
        setKeepPicker(null);
        await refresh();

        // ── Path 2: апгрейд → списано прямо сейчас, цикл сброшен ──
        if (typeof ok.charged === "number" && ok.charged > 0 && ok.plan) {
          void dialog.alert({
            tone: "success",
            title: "Тариф апгрейднут",
            message:
              ok.message ??
              `«${ok.plan.name}» подключён сразу. Списано ${(ok.charged / 100).toFixed(0)} ₽.`,
          });
          return;
        }

        // ── Path 3: даунгрейд/равноценный → запланировано ──
        if (ok.scheduled) {
          void dialog.alert({
            tone: "success",
            title: "Смена тарифа запланирована",
            message:
              ok.message ??
              "Текущий тариф работает до конца оплаченного цикла, затем включится новый. Деньги сейчас не списываются.",
          });
          return;
        }
      } catch (e: unknown) {
        // 409 needsKeepSelection → открыть keep-picker диалог.
        if (e instanceof ApiError && e.status === 409) {
          const d = e.data as Partial<NeedsKeepResponse>;
          if (d.needsKeepSelection && d.newPlan) {
            // Авто-преселект последних N (newLimit) подключённых VIP —
            // юзер всё равно может перевыбрать. activeVipFns уже
            // отсортирован по activatedAt desc.
            const newest = data?.activeVipFns
              .slice(0, d.newPlan.fnsLimit)
              .map((v) => v.fnsId) ?? [];
            setKeepPicker({ plan: d.newPlan, keepIds: new Set(newest) });
            return;
          }
        }
        const msg = e instanceof Error ? e.message : "Не удалось сменить тариф";
        await dialog.alert({ title: "Ошибка", message: msg });
      } finally {
        setBusyPlanId(null);
      }
    },
    [redirect, refresh, data?.activeVipFns]
  );

  const toggleKeep = useCallback((fnsId: string) => {
    setKeepPicker((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.keepIds);
      if (next.has(fnsId)) next.delete(fnsId);
      else next.add(fnsId);
      return { ...prev, keepIds: next };
    });
  }, []);

  const handleCancelPending = useCallback(async () => {
    const ok = await dialog.confirm({
      title: "Отменить смену тарифа?",
      message: "Текущий тариф продолжит действовать без изменений.",
      confirmLabel: "Отменить смену",
    });
    if (!ok) return;
    setCancelPendingBusy(true);
    try {
      await apiPost("/api/billing/plan/cancel-pending", {});
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось отменить";
      await dialog.alert({ title: "Ошибка", message: msg });
    } finally {
      setCancelPendingBusy(false);
    }
  }, [refresh]);

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
            message: "Чтобы подключать приоритет по ИФНС, нужен активный тариф PRO.",
          });
          return;
        }
        await refresh();
        if (!res.alreadyActive) {
          void dialog.alert({
            tone: "success",
            title: "Подключено",
            message: "Приоритет по ИФНС включён — новые запросы будут приходить мгновенно.",
          });
        }
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
        title: `Отключить приоритет по «${sub.fnsName}»?`,
        message:
          "Запросы по этой ИФНС снова будут приходить с задержкой 5 минут. Подключить приоритет можно в любой момент.",
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
        "Все приоритеты по ИФНС будут отключены, ежемесячные списания прекратятся. Карта останется привязанной — её можно отвязать отдельно.",
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
        "Это отменит тариф и отключит приоритеты по всем ИФНС. Чтобы возобновить — придётся выбрать тариф заново и привязать карту.",
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
          PRO доступен только специалистам. Заполните профиль специалиста, чтобы подключить тариф и получать приоритетные уведомления по выбранным ИФНС.
        </Text>
      </Card>
    );
  }

  const hasPlan = !!data.plan;
  const pendingPlan = data.pendingPlan;

  // ─── keep-picker (downgrade с overflow) — рендерим вместо обычного UI
  if (keepPicker) {
    const { plan: targetPlan, keepIds } = keepPicker;
    const tooMany = keepIds.size > targetPlan.fnsLimit;
    const tooFew = keepIds.size === 0;
    const canConfirm = !tooMany && !tooFew && !busyPlanId;
    return (
      <Card>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
          Какие ИФНС оставить на «{targetPlan.name}»?
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 }}>
          Лимит нового тарифа — {targetPlan.fnsLimit} {targetPlan.fnsLimit === 1 ? "ИФНС" : "ИФНС"}. Сейчас у вас {data.activeVipFns.length}.
          Выберите, что останется после смены тарифа на следующем продлении (
          {data.planNextChargeAt ? formatActivatedAt(data.planNextChargeAt) : "DD.MM"}). До этой
          даты текущий тариф «{data.plan?.name}» работает целиком.
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: tooMany ? colors.error : colors.primary,
            fontWeight: "600",
            marginTop: 10,
          }}
        >
          Выбрано {keepIds.size} из {targetPlan.fnsLimit}
          {tooMany ? " — больше лимита" : ""}
        </Text>
        <View style={{ marginTop: 12 }}>
          {data.activeVipFns.map((sub, idx) => {
            const keep = keepIds.has(sub.fnsId);
            return (
              <Pressable
                key={sub.fnsId}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: keep }}
                onPress={() => toggleKeep(sub.fnsId)}
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
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: keep ? colors.primary : colors.border,
                    backgroundColor: keep ? colors.primary : colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {keep && <Check size={12} color={colors.white} strokeWidth={3} />}
                </View>
                <FnsLogo name={sub.fnsName} cityName={sub.cityName} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.text }} numberOfLines={2}>
                    {sub.fnsName}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {sub.cityName} · код {sub.fnsCode}
                  </Text>
                </View>
                {keep ? (
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>
                    Оставить
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Отключится
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
            onPress={() => setKeepPicker(null)}
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
            accessibilityLabel={`Запланировать смену на ${targetPlan.name}`}
            disabled={!canConfirm}
            onPress={() => submitPlan(targetPlan.id, Array.from(keepIds))}
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
              !canConfirm && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={{ color: colors.white, fontWeight: "600" }}>
              {busyPlanId === targetPlan.id ? "..." : "Запланировать смену"}
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
              text="Lite, Pro или Premium — отличаются только лимитом ИФНС, по которым вы получаете запросы мгновенно (приоритетная очередь)."
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
            Тариф = лимит ИФНС с приоритетом. Полная стоимость тарифа списывается раз в месяц с привязанной карты. Сменить тариф или отменить — в любой момент.
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
            a="Один раз в месяц автоматически с привязанной карты — целиком стоимость тарифа за 30 дней. Один платёж покрывает все ИФНС из вашего списка."
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
            a="Да, кнопкой «Отменить тариф». Следующее месячное списание не пройдёт, приоритеты по всем ИФНС отключатся, карта останется привязанной."
            last
          />
        </Card>
      </View>
    );
  }

  // ─── has plan: management screen ────────────────────────────────
  const plan = data.plan!;
  const slotsLeft = data.slotsLimit - data.slotsUsed;
  const visibleTxs = (txs ?? []).filter((t) => !HIDDEN_TX_KINDS.has(t.kind));

  return (
    <View style={{ gap: 16 }}>
      {/* Главная карточка тарифа: всё управление в одном блоке —
          заголовок → слоты → активные ИФНС → подключить → действия. */}
      <Card>
        {/* Header */}
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
                {formatRub(plan.monthlyPriceKopeks)}/мес
                {data.planNextChargeAt
                  ? ` · следующий платёж ${formatActivatedAt(data.planNextChargeAt)}`
                  : data.planStartedAt
                  ? ` · с ${formatActivatedAt(data.planStartedAt)}`
                  : ""}
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
            Подключено ИФНС: <Text style={{ color: colors.text, fontWeight: "700" }}>
              {data.slotsUsed} из {data.slotsLimit}
            </Text>
            {slotsLeft > 0 && ` · можно ещё ${slotsLeft}`}
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

        {/* Pending plan banner — запланированная смена тарифа на
            следующее продление. Показываем дату применения, новый
            тариф и кнопку отмены. */}
        {pendingPlan && (
          <View
            style={{
              marginTop: 16,
              paddingTop: 12,
              paddingBottom: 4,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
                backgroundColor: colors.accentSoft,
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Clock size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  Запланирована смена на «{pendingPlan.name}»
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                  Текущий тариф «{plan.name}» работает до{" "}
                  {data.planNextChargeAt
                    ? formatActivatedAt(data.planNextChargeAt)
                    : "следующего продления"}
                  . После этой даты включится «{pendingPlan.name}» ({formatRub(pendingPlan.monthlyPriceKopeks)}/мес,
                  до {pendingPlan.fnsLimit} ИФНС). Деньги сейчас не списываются.
                </Text>
                {pendingPlan.fnsLimit < data.slotsUsed && (
                  <View style={{ marginTop: 8 }}>
                    {data.pendingPlanKeepFnsIds.length > 0 ? (
                      <>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                          Останутся при смене ({data.pendingPlanKeepFnsIds.length}):
                        </Text>
                        {data.activeVipFns
                          .filter((v) => data.pendingPlanKeepFnsIds.includes(v.fnsId))
                          .map((v) => (
                            <Text
                              key={v.fnsId}
                              style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}
                              numberOfLines={1}
                            >
                              · {v.fnsName} ({v.cityName})
                            </Text>
                          ))}
                        {data.activeVipFns.some(
                          (v) => !data.pendingPlanKeepFnsIds.includes(v.fnsId)
                        ) && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.warning ?? colors.error,
                              marginTop: 6,
                              lineHeight: 16,
                            }}
                          >
                            Остальные{" "}
                            {data.activeVipFns.length - data.pendingPlanKeepFnsIds.length} отключатся автоматически.
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={{ fontSize: 11, color: colors.warning ?? colors.error, lineHeight: 16 }}>
                        У вас сейчас {data.slotsUsed} ИФНС, новый лимит {pendingPlan.fnsLimit}.
                        {" "}Самые старые подключения отключатся автоматически.
                      </Text>
                    )}
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Отменить смену тарифа"
                  onPress={handleCancelPending}
                  disabled={cancelPendingBusy}
                  style={({ pressed }) => [
                    {
                      alignSelf: "flex-start",
                      marginTop: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      backgroundColor: colors.white,
                    },
                    pressed && { opacity: 0.7 },
                    cancelPendingBusy && { opacity: 0.5 },
                  ]}
                >
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}>
                    {cancelPendingBusy ? "..." : "Отменить смену"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Active priority FNS — встроены в карточку тарифа. */}
        {data.activeVipFns.length > 0 && (
          <View
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Мои приоритетные ИФНС
            </Text>
            {data.activeVipFns.map((sub, idx) => {
              const busy = busyFnsId === sub.fnsId;
              return (
                <View
                  key={sub.fnsId}
                  className="flex-row items-center"
                  style={{
                    gap: 12,
                    paddingTop: idx === 0 ? 4 : 12,
                    paddingBottom: idx === data.activeVipFns.length - 1 ? 0 : 12,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <FnsLogo name={sub.fnsName} cityName={sub.cityName} size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: colors.text }}
                      numberOfLines={2}
                    >
                      {sub.fnsName}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                      {sub.cityName} · код {sub.fnsCode} · с {formatActivatedAt(sub.activatedAt)}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Отключить приоритет по ${sub.fnsName}`}
                      onPress={() => handleRemoveFns(sub)}
                      style={({ pressed }) => [
                        {
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.white,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <X size={12} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Подключить ИФНС — раскрывающийся блок поиска. */}
        <View
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {!showAddSearch ? (
            // ОДНА кнопка «Добавить больше ИФНС» — если есть слот,
            // открывает поиск; если лимит исчерпан, показывает тарифы
            // (раньше было две раздельные кнопки «Лимит исчерпан» +
            // «Сменить тариф», что путало).
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                slotsLeft > 0 ? "Подключить приоритет по ИФНС" : "Сменить тариф для подключения новых ИФНС"
              }
              onPress={() => {
                if (slotsLeft > 0) {
                  setShowAddSearch(true);
                } else {
                  setShowPlanSwitcher(true);
                }
              }}
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.primary,
                  backgroundColor: colors.white,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Plus size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                {data.activeVipFns.length === 0
                  ? "Подключить первую ИФНС"
                  : slotsLeft > 0
                  ? "Добавить ещё ИФНС"
                  : "Добавить больше ИФНС"}
              </Text>
            </Pressable>
          ) : (
            // zIndex POPOVER на корневом контейнере панели — иначе
            // дропдаун городов уходил ПОД action-кнопки «Сменить
            // тариф / Отменить» (это сиблинги ниже в Card'е) и под
            // карточки «Сохранённая карта» / «История» вне Card'а:
            // shadowOffset на тех элементах создавал свои stacking
            // contexts на web. zIndex на самом typeahead'e не помогал
            // — нужен был на ВСЕЙ панели целиком.
            <View style={{ position: "relative", zIndex: 100 }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  Подключить приоритет
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Скрыть поиск"
                  onPress={() => {
                    setShowAddSearch(false);
                    clearCity();
                  }}
                  style={({ pressed }) => [
                    { padding: 4 },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* City typeahead — паттерн как на /fns. position:relative
                  + zIndex чтобы дропдаун перекрывал список ниже. Парент
                  panel поднят выше — здесь bump zIndex выше парента. */}
              <View style={{ position: "relative", zIndex: 200, marginBottom: 10 }}>
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
                  }}
                >
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    value={cityQuery}
                    onChangeText={(t) => {
                      setCityQuery(t);
                      setCityDropdownOpen(t.trim().length >= 2);
                      if (cityFilterId) {
                        const cur = cities.find((c) => c.id === cityFilterId);
                        if (
                          !cur ||
                          !cur.name.toLowerCase().startsWith(t.trim().toLowerCase())
                        ) {
                          setCityFilterId(null);
                        }
                      }
                    }}
                    onFocus={() => {
                      if (cityQuery.trim().length >= 2) setCityDropdownOpen(true);
                    }}
                    onBlur={() => {
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      blurTimer.current = setTimeout(() => setCityDropdownOpen(false), 150);
                    }}
                    placeholder="Введите город — например, Москва"
                    placeholderTextColor={colors.placeholder}
                    autoFocus
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
                  {cityQuery.length > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Очистить"
                      onPress={clearCity}
                      hitSlop={6}
                    >
                      <X size={14} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                {cityDropdownOpen && cityMatches.length > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 44,
                      left: 0,
                      right: 0,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      overflow: "hidden",
                      // zIndex 1000 (=Z.MODAL уровень) — гарантированно
                      // выше любых сиблингов с elevation/shadow,
                      // включая Card'и с историей операций ниже.
                      zIndex: 1000,
                      // elevation для RN Web mapper (некоторые версии
                      // мапят elevation→zIndex авторитарнее, чем zIndex).
                      elevation: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 16,
                    }}
                  >
                    {cityMatches.map((c, idx) => (
                      <Pressable
                        key={c.id}
                        accessibilityRole="button"
                        accessibilityLabel={c.name}
                        onPress={() => pickCity(c)}
                        style={({ pressed }) => [
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderTopWidth: idx === 0 ? 0 : 1,
                            borderTopColor: colors.border,
                          },
                          pressed && { backgroundColor: colors.surface },
                        ]}
                      >
                        <MapPin size={14} color={colors.textMuted} />
                        <Text style={{ flex: 1, fontSize: 13, color: colors.text }}>
                          {c.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {topCities.length > 0 && (
                <View
                  className="flex-row flex-wrap"
                  style={{ gap: 6, paddingBottom: 10 }}
                >
                  {topCities.map((c) => (
                    <CityChip
                      key={c.id}
                      label={c.name}
                      active={cityFilterId === c.id}
                      onPress={() => (cityFilterId === c.id ? clearCity() : pickCity(c))}
                    />
                  ))}
                </View>
              )}

              {!cityFilterId ? (
                <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>
                  Выберите город — ниже появятся все ИФНС в нём.
                </Text>
              ) : searchLoading ? (
                <View className="items-center py-6">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : searchResults.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>
                  В этом городе ИФНС не найдены.
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
                        paddingTop: idx === 0 ? 4 : 12,
                        paddingBottom: 12,
                        borderTopWidth: idx === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <FnsLogo name={item.fnsName} cityName={item.cityName} size="sm" />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{ fontSize: 13, fontWeight: "600", color: colors.text }}
                          numberOfLines={2}
                        >
                          {item.fnsName}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                          {item.cityName} · код {item.fnsCode}
                        </Text>
                      </View>
                      {busy ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Подключить приоритет по ${item.fnsName}`}
                          onPress={() => handleSubscribeFns(item.fnsId)}
                          style={({ pressed }) => [
                            {
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: colors.primary,
                            },
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <Plus size={12} color={colors.white} />
                          <Text style={{ color: colors.white, fontSize: 12, fontWeight: "600" }}>
                            Подключить
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Действия — отделяем от списков визуально. */}
        <View
          className="flex-row"
          style={{
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
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

      {/* History — без устаревших ежедневных списаний и pending-платежей. */}
      {visibleTxs.length > 0 && (
        <Card>
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            История операций
          </Text>
          {visibleTxs.map((t) => {
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
              Списание раз в месяц
            </Text>
            <View
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View className="flex-row items-start" style={{ gap: 6 }}>
                <Check size={14} color={colors.success} style={{ marginTop: 3 }} />
                <Text style={{ fontSize: 13, color: colors.text, flex: 1, lineHeight: 18 }}>
                  До <Text style={{ fontWeight: "700" }}>{p.fnsLimit}</Text> ИФНС с мгновенным доступом к новым запросам
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
