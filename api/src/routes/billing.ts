import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import {
  createPayment,
  chargeWithSavedMethod,
  fetchPayment,
  paymentMethodTitle,
} from "../lib/yookassa";

const router = Router();

/**
 * PRO subscription routes — per-account plan + per-FNS slots.
 *
 *   - Three plans (Lite/Pro/Premium, editable on /admin/plans). Each
 *     plan has a fixed monthlyPriceKopeks and an fnsLimit. Plans are
 *     a per-user concept; FNS slots are free within the limit.
 *
 *   - Activation flow:
 *     POST /plan {planId} when user has no plan → ЮKassa redirect-flow
 *     payment for plan.monthlyPriceKopeks/30 with save_payment_method.
 *     Webhook captures the saved card and sets users.subscriptionPlanId.
 *     POST /plan {planId} when user has a card already (mid-session
 *     plan switch) → server-to-server autopay one day at the new rate
 *     and switch in the same transaction.
 *
 *   - Switching:
 *     Upgrade: instant. Tomorrow's daily charge is at the new rate.
 *     Downgrade where current vip_count > new.fnsLimit: backend returns
 *     409 with `needsTrim: true` and the current FNS list. FE asks the
 *     user to drop N rows and re-submit POST /plan {planId, removeFnsIds}.
 *
 *   - VIP slot toggles:
 *     POST /vip-fns/:id and DELETE /vip-fns/:id are now free (no charge).
 *     Adding past the limit returns 409.
 *
 *   - Failures: cron deactivates everything (plan + vip-fns) on a
 *     declined autopay and emails the user.
 */

const KOPEKS_IN_RUB = 100;

function dailyChargeKopeks(monthlyKopeks: number): number {
  return Math.ceil(monthlyKopeks / 30);
}

interface PlanBrief {
  id: string;
  code: string;
  name: string;
  monthlyPriceKopeks: number;
  monthlyPriceRub: number;
  dailyChargeKopeks: number;
  fnsLimit: number;
  sortOrder: number;
}

function planBrief(p: {
  id: string;
  code: string;
  name: string;
  monthlyPriceKopeks: number;
  fnsLimit: number;
  sortOrder: number;
}): PlanBrief {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    monthlyPriceKopeks: p.monthlyPriceKopeks,
    monthlyPriceRub: p.monthlyPriceKopeks / KOPEKS_IN_RUB,
    dailyChargeKopeks: dailyChargeKopeks(p.monthlyPriceKopeks),
    fnsLimit: p.fnsLimit,
    sortOrder: p.sortOrder,
  };
}

// ─────────────────────────────────────────────────────────── plans

// GET /api/billing/plans — public list of active plans, used by the
// upsell screen and the plan switcher. Sorted by sortOrder ascending
// so cheapest tier renders first.
router.get("/plans", async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        monthlyPriceKopeks: true,
        fnsLimit: true,
        sortOrder: true,
      },
    });
    res.json({ plans: plans.map(planBrief) });
  } catch (error) {
    console.error("billing/plans error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────── me

// GET /api/billing/me — header data: card + plan + active VIP rows.
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [user, vipRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isSpecialist: true,
          yookassaPaymentMethodId: true,
          yookassaPaymentMethodTitle: true,
          lastChargeFailedAt: true,
          subscriptionStartedAt: true,
          subscriptionNextChargeAt: true,
          subscriptionPlan: {
            select: {
              id: true,
              code: true,
              name: true,
              monthlyPriceKopeks: true,
              fnsLimit: true,
              sortOrder: true,
            },
          },
          pendingPlanScheduledAt: true,
          pendingPlan: {
            select: {
              id: true,
              code: true,
              name: true,
              monthlyPriceKopeks: true,
              fnsLimit: true,
              sortOrder: true,
            },
          },
        },
      }),
      prisma.specialistVipFns.findMany({
        where: { specialistId: userId },
        orderBy: { activatedAt: "desc" },
        select: {
          fnsId: true,
          activatedAt: true,
          fns: {
            select: {
              id: true,
              name: true,
              code: true,
              city: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const plan = user.subscriptionPlan ? planBrief(user.subscriptionPlan) : null;
    const activeVipFns = vipRows.map((row) => ({
      fnsId: row.fns.id,
      fnsName: row.fns.name,
      fnsCode: row.fns.code,
      cityId: row.fns.city.id,
      cityName: row.fns.city.name,
      activatedAt: row.activatedAt,
    }));

    res.json({
      isSpecialist: user.isSpecialist,
      hasPaymentMethod: !!user.yookassaPaymentMethodId,
      paymentMethodTitle: user.yookassaPaymentMethodTitle ?? null,
      lastChargeFailedAt: user.lastChargeFailedAt ?? null,
      plan,
      planStartedAt: user.subscriptionStartedAt ?? null,
      planNextChargeAt: user.subscriptionNextChargeAt ?? null,
      // Запланированная смена на следующее продление (downgrade или
      // равноценный план). null когда смены не запланировано.
      pendingPlan: user.pendingPlan ? planBrief(user.pendingPlan) : null,
      pendingPlanScheduledAt: user.pendingPlanScheduledAt ?? null,
      activeVipFns,
      slotsUsed: activeVipFns.length,
      slotsLimit: plan?.fnsLimit ?? 0,
    });
  } catch (error) {
    console.error("billing/me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────── search

// GET /api/billing/fns-search?q=&cityId=&limit= — searchable list of
// FNS available for a VIP slot. "Available" = vipMonthlyPriceKopeks
// IS NOT NULL (admin-managed flag, repurposed: only the existence of
// the value matters now, not the value itself). Excludes FNS the user
// already added to VIP.
router.get("/fns-search", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const q = ((req.query.q as string) || "").trim().toLowerCase();
    const cityId = (req.query.cityId as string) || "";
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 30));

    const myVip = await prisma.specialistVipFns.findMany({
      where: { specialistId: userId },
      select: { fnsId: true },
    });
    const excludeIds = myVip.map((v) => v.fnsId);

    const where: {
      vipMonthlyPriceKopeks: { not: null };
      cityId?: string;
      id?: { notIn: string[] };
      OR?: Array<Record<string, unknown>>;
    } = {
      vipMonthlyPriceKopeks: { not: null },
    };
    if (cityId) where.cityId = cityId;
    if (excludeIds.length > 0) where.id = { notIn: excludeIds };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { searchAliases: { contains: q, mode: "insensitive" } },
        { city: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const offices = await prisma.fnsOffice.findMany({
      where,
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        code: true,
        city: { select: { id: true, name: true } },
      },
    });

    const items = offices.map((o) => ({
      fnsId: o.id,
      fnsName: o.name,
      fnsCode: o.code,
      cityId: o.city.id,
      cityName: o.city.name,
    }));

    res.json({ items });
  } catch (error) {
    console.error("billing/fns-search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────── plan toggle

interface PlanRequestBody {
  planId?: string;
}

const RENEWAL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// POST /api/billing/plan — activate or switch plan.
//
// Три пути:
//   1. Первое подключение (нет карты): ЮKassa redirect → bind + полный
//      первый месяц. Без изменений с прежней реализации.
//   2. UPGRADE (newPrice > currentPrice, карта привязана): автосписание
//      полной суммы нового тарифа сейчас + сброс цикла (startedAt=now,
//      nextChargeAt=now+30d). Защищает от эксплойта «Lite→Premium на
//      день 1, downgrade на день 29, плати Lite за Premium-фичи».
//   3. DOWNGRADE/SAME (newPrice ≤ currentPrice): расписать на следующий
//      renewal через pendingPlanId. Текущий тариф работает до конца
//      оплаченного цикла (юзер не теряет фичи, за которые заплатил).
router.post("/plan", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { planId } = (req.body ?? {}) as PlanRequestBody;
    if (!planId || typeof planId !== "string") {
      res.status(400).json({ error: "planId is required" });
      return;
    }

    const [plan, user] = await Promise.all([
      prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: {
          id: true,
          code: true,
          name: true,
          monthlyPriceKopeks: true,
          fnsLimit: true,
          sortOrder: true,
          isActive: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isSpecialist: true,
          yookassaPaymentMethodId: true,
          subscriptionPlanId: true,
          subscriptionNextChargeAt: true,
          subscriptionPlan: {
            select: {
              id: true,
              code: true,
              name: true,
              monthlyPriceKopeks: true,
              fnsLimit: true,
              sortOrder: true,
            },
          },
        },
      }),
    ]);
    if (!plan || !plan.isActive) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "PRO доступен только специалистам" });
      return;
    }

    // Same plan, idempotent. Если есть pending — снимаем заодно.
    if (user.subscriptionPlanId === plan.id) {
      await prisma.user.update({
        where: { id: userId },
        data: { pendingPlanId: null, pendingPlanScheduledAt: null },
      });
      res.json({ ok: true, alreadyActive: true });
      return;
    }

    const monthPrice = plan.monthlyPriceKopeks;
    const returnBase =
      process.env.YK_RETURN_URL_BASE ?? "https://p2ptax.smartlaunchhub.com";

    // ── Path 1: first-time activation ──────────────────────────────
    if (!user.yookassaPaymentMethodId) {
      const payment = await createPayment({
        amountKopeks: monthPrice,
        description: `PRO «${plan.name}» — оплата за 30 дней + привязка карты`,
        userId,
        returnUrl: `${returnBase}/profile?tab=plan&plan=ok`,
        savePaymentMethod: true,
        extraMetadata: { planId: plan.id, kind: "bind_plan" },
      });
      await prisma.billingTx.create({
        data: {
          userId,
          amountKopeks: -monthPrice,
          kind: "bind_pending",
          externalRef: payment.paymentId,
          description: `Ожидание оплаты тарифа ${plan.name}`,
        },
      });
      res.json({
        ok: true,
        needsRedirect: true,
        confirmationUrl: payment.confirmationUrl,
        paymentId: payment.paymentId,
      });
      return;
    }

    const currentMonthPrice = user.subscriptionPlan?.monthlyPriceKopeks ?? 0;
    const isUpgrade = monthPrice > currentMonthPrice;

    // ── Path 2: UPGRADE (charge full new month now, reset cycle) ───
    if (isUpgrade) {
      const idempotenceKey = `plan-upgrade-${userId}-${plan.id}-${Date.now()}`;
      let charge: Awaited<ReturnType<typeof chargeWithSavedMethod>>;
      try {
        charge = await chargeWithSavedMethod({
          amountKopeks: monthPrice,
          description: `Апгрейд на тариф «${plan.name}» — оплата за 30 дней`,
          paymentMethodId: user.yookassaPaymentMethodId,
          idempotenceKey,
          metadata: {
            userId,
            planId: plan.id,
            kind: "plan_upgrade",
            previousPlanId: user.subscriptionPlanId ?? "",
          },
        });
      } catch (err) {
        console.error("plan upgrade charge error:", err);
        res.status(402).json({
          error:
            "Не удалось списать с привязанной карты. Проверьте карту в банке или отвяжите её и подключитесь заново.",
        });
        return;
      }
      if (!(charge.status === "succeeded" && charge.paid)) {
        res.status(402).json({
          error:
            "Платёж не прошёл. Возможно, на карте недостаточно средств — попробуйте позже или замените карту.",
        });
        return;
      }

      const now = new Date();
      const nextDue = new Date(now.getTime() + RENEWAL_DAYS * MS_PER_DAY);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionPlanId: plan.id,
            subscriptionStartedAt: now,
            subscriptionNextChargeAt: nextDue,
            lastChargeFailedAt: null,
            // Любой pending снимается — он мог стоять с прошлой scheduled
            // смены, теперь юзер явно решил перейти прямо сейчас.
            pendingPlanId: null,
            pendingPlanScheduledAt: null,
          },
        });
        await tx.billingTx.create({
          data: {
            userId,
            amountKopeks: -monthPrice,
            kind: "plan_upgrade",
            externalRef: charge.paymentId,
            description: `Апгрейд на «${plan.name}» — списание ${(monthPrice / 100).toFixed(0)} ₽, цикл стартовал заново`,
          },
        });
      });

      res.json({
        ok: true,
        charged: monthPrice,
        plan: planBrief(plan),
        nextChargeAt: nextDue,
        message: `Тариф «${plan.name}» подключён сразу. Списано ${(monthPrice / 100).toFixed(0)} ₽, следующее списание ${nextDue.toLocaleDateString("ru-RU")}.`,
      });
      return;
    }

    // ── Path 3: DOWNGRADE / equal price → schedule for next renewal ─
    // Юзер уже оплатил текущий цикл, поэтому его текущий тариф (с
    // полным набором VIP-слотов) работает до subscriptionNextChargeAt.
    // На renewal cron подменит план на pendingPlanId и обрежет VIP
    // (oldest first) до нового лимита.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          pendingPlanId: plan.id,
          pendingPlanScheduledAt: new Date(),
        },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: 0,
          kind: "plan_scheduled",
          description: `Запланирован переход на «${plan.name}» на следующее продление`,
        },
      });
    });

    res.json({
      ok: true,
      scheduled: true,
      pendingPlan: planBrief(plan),
      currentPlan: user.subscriptionPlan ? planBrief(user.subscriptionPlan) : null,
      applyAt: user.subscriptionNextChargeAt,
      message: user.subscriptionNextChargeAt
        ? `Текущий тариф работает до ${user.subscriptionNextChargeAt.toLocaleDateString("ru-RU")}, затем включится «${plan.name}». Деньги сейчас не списываются.`
        : `Тариф изменится на «${plan.name}» при следующем продлении.`,
    });
  } catch (error) {
    console.error("billing/plan POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/billing/plan/cancel-pending — снять запланированную смену
// тарифа. Идемпотентно: если pending'а нет, отвечаем ok.
router.post(
  "/plan/cancel-pending",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          pendingPlanId: true,
          pendingPlan: { select: { name: true } },
        },
      });
      if (!user || !user.pendingPlanId) {
        res.json({ ok: true, alreadyCleared: true });
        return;
      }
      const cancelledName = user.pendingPlan?.name ?? "(удалённый)";
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { pendingPlanId: null, pendingPlanScheduledAt: null },
        });
        await tx.billingTx.create({
          data: {
            userId,
            amountKopeks: 0,
            kind: "plan_pending_cancelled",
            description: `Отменена запланированная смена тарифа на «${cancelledName}»`,
          },
        });
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("billing/plan/cancel-pending error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /api/billing/plan — cancel plan + remove all VIP rows.
// Idempotent. Card stays bound (separate /payment-method endpoint
// for explicit unbind).
router.delete("/plan", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await prisma.$transaction(async (tx) => {
      await tx.specialistVipFns.deleteMany({ where: { specialistId: userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionPlanId: null,
          subscriptionStartedAt: null,
          subscriptionNextChargeAt: null,
          // Отмена тарифа гасит и pending — иначе он висел бы без
          // активного подключения, что бессмысленно.
          pendingPlanId: null,
          pendingPlanScheduledAt: null,
        },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: 0,
          kind: "plan_cancelled",
          description: "Тариф отменён пользователем",
        },
      });
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("billing/plan DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────── vip-fns

// POST /api/billing/vip-fns/:fnsId — add an FNS to the VIP list.
// Free within plan.fnsLimit. 409 if no plan or already at limit.
router.post("/vip-fns/:fnsId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fnsId = req.params.fnsId as string;

    const [fns, user, vipCount] = await Promise.all([
      prisma.fnsOffice.findUnique({
        where: { id: fnsId },
        select: { id: true, name: true, vipMonthlyPriceKopeks: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isSpecialist: true,
          subscriptionPlan: { select: { id: true, fnsLimit: true, name: true } },
        },
      }),
      prisma.specialistVipFns.count({ where: { specialistId: userId } }),
    ]);
    if (!fns || fns.vipMonthlyPriceKopeks == null) {
      res.status(400).json({ error: "VIP не доступен для этой ИФНС" });
      return;
    }
    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "VIP доступен только специалистам" });
      return;
    }
    if (!user.subscriptionPlan) {
      res.status(409).json({
        error: "Сначала подключите тариф PRO",
        needsPlan: true,
      });
      return;
    }
    // Already added? Idempotent ok.
    const existing = await prisma.specialistVipFns.findUnique({
      where: { specialistId_fnsId: { specialistId: userId, fnsId } },
      select: { id: true },
    });
    if (existing) {
      res.json({ ok: true, alreadyActive: true });
      return;
    }
    if (vipCount >= user.subscriptionPlan.fnsLimit) {
      res.status(409).json({
        error: `На тарифе ${user.subscriptionPlan.name} лимит ${user.subscriptionPlan.fnsLimit} ИФНС. Уберите одну или повысьте тариф.`,
        slotsLimit: user.subscriptionPlan.fnsLimit,
        slotsUsed: vipCount,
      });
      return;
    }

    await prisma.specialistVipFns.create({
      data: { specialistId: userId, fnsId },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("billing/vip-fns POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/billing/vip-fns/:fnsId — remove from VIP list. Idempotent.
router.delete("/vip-fns/:fnsId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fnsId = req.params.fnsId as string;
    await prisma.specialistVipFns.deleteMany({
      where: { specialistId: userId, fnsId },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("billing/vip-fns DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────── card

// DELETE /api/billing/payment-method — unbind the saved card.
// Wipes the plan + all VIP rows in one transaction (autopay can't
// run without a card so leaving the plan in place would just trip
// charge_failed at the next cron tick).
router.delete("/payment-method", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await prisma.$transaction(async (tx) => {
      await tx.specialistVipFns.deleteMany({ where: { specialistId: userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          yookassaPaymentMethodId: null,
          yookassaPaymentMethodTitle: null,
          lastChargeFailedAt: null,
          subscriptionPlanId: null,
          subscriptionStartedAt: null,
          subscriptionNextChargeAt: null,
        },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: 0,
          kind: "card_unbound",
          description: "Карта отвязана пользователем",
        },
      });
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("billing/payment-method DELETE error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────── webhook

// POST /api/billing/webhook — ЮKassa notification. Re-fetch payment
// by id from the API instead of trusting the body, then on
// metadata.kind=bind_plan: save the card token, set the plan.
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      event?: string;
      object?: { id?: string };
    };
    const paymentId = body?.object?.id;
    if (!paymentId) {
      res.status(400).json({ error: "Missing object.id" });
      return;
    }

    const payment = await fetchPayment(paymentId);
    if (payment.status !== "succeeded" || !payment.paid) {
      res.json({ ok: true, ignored: payment.status });
      return;
    }

    const userId = payment.metadata?.userId;
    const planId = payment.metadata?.planId;
    const kind = payment.metadata?.kind;
    if (!userId || kind !== "bind_plan" || !planId) {
      res.json({ ok: true, ignored: "metadata mismatch" });
      return;
    }

    const already = await prisma.billingTx.findFirst({
      where: { externalRef: paymentId, kind: "bind_plan" },
      select: { id: true },
    });
    if (already) {
      res.json({ ok: true, alreadyApplied: true });
      return;
    }

    const valueRub = parseFloat(payment.amount.value);
    const amountKopeks = Math.round(valueRub * 100);
    const pmId = payment.payment_method?.id;
    const pmSaved = payment.payment_method?.saved;
    const pmTitle = paymentMethodTitle(payment.payment_method);

    // Sanity-check the plan still exists/active.
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, isActive: true },
    });
    if (!plan || !plan.isActive) {
      res.json({ ok: true, ignored: "plan no longer active" });
      return;
    }

    const now = new Date();
    const nextDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.$transaction(async (tx) => {
      if (pmId && pmSaved) {
        await tx.user.update({
          where: { id: userId },
          data: {
            yookassaPaymentMethodId: pmId,
            yookassaPaymentMethodTitle: pmTitle,
            lastChargeFailedAt: null,
            subscriptionPlanId: planId,
            subscriptionStartedAt: now,
            subscriptionNextChargeAt: nextDue,
          },
        });
      } else {
        // No new card was bound (rare — e.g. user paid with an
        // existing tokenized method). Still set the plan.
        await tx.user.update({
          where: { id: userId },
          data: {
            subscriptionPlanId: planId,
            subscriptionStartedAt: now,
            subscriptionNextChargeAt: nextDue,
            lastChargeFailedAt: null,
          },
        });
      }
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: -amountKopeks,
          kind: "bind_plan",
          externalRef: paymentId,
          description: `Подключение PRO «${plan.name}» — оплата за 30 дней`,
        },
      });
      await tx.billingTx.deleteMany({
        where: { externalRef: paymentId, kind: "bind_pending" },
      });
    });

    res.json({ ok: true, applied: true });
  } catch (error) {
    console.error("billing/webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ─────────────────────────────────────────────────────── tx history

router.get("/transactions", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const txs = await prisma.billingTx.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountKopeks: true,
        kind: true,
        fnsId: true,
        externalRef: true,
        description: true,
        createdAt: true,
      },
    });
    res.json({ transactions: txs });
  } catch (error) {
    console.error("billing/transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
