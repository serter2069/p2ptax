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
 * Billing routes — recurring autopay model (no pre-paid wallet).
 *
 *   - First VIP-FNS activation creates a redirect-flow ЮKassa payment
 *     for one day's price with `save_payment_method: true`. The webhook
 *     captures the returned payment_method.id on the user and creates
 *     the SpecialistVipFns row.
 *   - Subsequent activations on other FNS reuse the saved card —
 *     server-to-server charge for one day, instant activation, no
 *     redirect.
 *   - Daily cron `vipDailyCharge.ts` autopays the day's total per user
 *     using the saved payment_method_id. Failed charges deactivate ALL
 *     of that user's VIP-FNS rows + flip lastChargeFailedAt.
 *   - `DELETE /payment-method` clears the saved card and wipes all VIP
 *     rows in the same transaction (otherwise tomorrow's cron would
 *     have nothing to charge against).
 */

const KOPEKS_IN_RUB = 100;

function dailyChargeKopeks(monthlyKopeks: number): number {
  return Math.ceil(monthlyKopeks / 30);
}

// GET /api/billing/me — single shape for the entire billing tab.
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [user, specialistFns, vipRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isSpecialist: true,
          yookassaPaymentMethodId: true,
          yookassaPaymentMethodTitle: true,
          lastChargeFailedAt: true,
        },
      }),
      prisma.specialistFns.findMany({
        where: { specialistId: userId },
        select: {
          fnsId: true,
          fns: {
            select: {
              id: true,
              name: true,
              code: true,
              vipMonthlyPriceKopeks: true,
              city: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ fns: { city: { name: "asc" } } }, { fns: { name: "asc" } }],
      }),
      prisma.specialistVipFns.findMany({
        where: { specialistId: userId },
        select: { fnsId: true, activatedAt: true },
      }),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const vipMap = new Map(vipRows.map((v) => [v.fnsId, v.activatedAt]));
    const fnsCatalog = specialistFns.map((sf) => {
      const monthly = sf.fns.vipMonthlyPriceKopeks;
      return {
        fnsId: sf.fns.id,
        fnsName: sf.fns.name,
        fnsCode: sf.fns.code,
        cityId: sf.fns.city.id,
        cityName: sf.fns.city.name,
        monthlyPriceKopeks: monthly,
        monthlyPriceRub: monthly == null ? null : monthly / KOPEKS_IN_RUB,
        dailyChargeKopeks: monthly == null ? null : dailyChargeKopeks(monthly),
        vipActive: vipMap.has(sf.fns.id),
        activatedAt: vipMap.get(sf.fns.id) ?? null,
      };
    });

    const dailyTotalKopeks = fnsCatalog.reduce(
      (sum, f) => sum + (f.vipActive ? f.dailyChargeKopeks ?? 0 : 0),
      0
    );

    res.json({
      isSpecialist: user.isSpecialist,
      hasPaymentMethod: !!user.yookassaPaymentMethodId,
      paymentMethodTitle: user.yookassaPaymentMethodTitle ?? null,
      lastChargeFailedAt: user.lastChargeFailedAt ?? null,
      dailyChargeKopeks: dailyTotalKopeks,
      dailyChargeRub: dailyTotalKopeks / KOPEKS_IN_RUB,
      monthlyEstimateKopeks: dailyTotalKopeks * 30,
      monthlyEstimateRub: (dailyTotalKopeks * 30) / KOPEKS_IN_RUB,
      fnsCatalog,
    });
  } catch (error) {
    console.error("billing/me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/billing/vip-fns/:fnsId — activate VIP on an FNS.
 *
 * Two paths:
 *   (a) No card on file → create a ЮKassa redirect payment for one
 *       day's price + save_payment_method:true. metadata.fnsId tells
 *       the webhook which row to create after the user pays. Returns
 *       { confirmationUrl } so the FE can redirect.
 *   (b) Card already saved → server-to-server autopay for one day,
 *       creates the row immediately on success.
 */
router.post("/vip-fns/:fnsId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fnsId = req.params.fnsId as string;

    const [fns, user] = await Promise.all([
      prisma.fnsOffice.findUnique({
        where: { id: fnsId },
        select: { id: true, name: true, vipMonthlyPriceKopeks: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isSpecialist: true,
          yookassaPaymentMethodId: true,
        },
      }),
    ]);
    if (!fns) {
      res.status(404).json({ error: "FNS not found" });
      return;
    }
    if (fns.vipMonthlyPriceKopeks == null) {
      res.status(400).json({ error: "VIP не настроен для этой ИФНС" });
      return;
    }
    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "VIP доступен только специалистам" });
      return;
    }
    // Already on? Idempotent success.
    const existing = await prisma.specialistVipFns.findUnique({
      where: { specialistId_fnsId: { specialistId: userId, fnsId } },
      select: { id: true },
    });
    if (existing) {
      res.json({ ok: true, alreadyActive: true });
      return;
    }

    const dayPrice = dailyChargeKopeks(fns.vipMonthlyPriceKopeks);
    const returnBase =
      process.env.YK_RETURN_URL_BASE ?? "https://p2ptax.smartlaunchhub.com";

    if (!user.yookassaPaymentMethodId) {
      // Path (a) — first time: redirect to ЮKassa, bind card,
      // first day pre-paid as part of the same payment.
      const payment = await createPayment({
        amountKopeks: dayPrice,
        description: `VIP по «${fns.name}» (день 1) + привязка карты`,
        userId,
        returnUrl: `${returnBase}/profile?tab=billing&vip=ok`,
        savePaymentMethod: true,
        extraMetadata: { fnsId, kind: "bind_first_charge" },
      });
      // Pending ledger row, will be replaced on webhook success.
      await prisma.billingTx.create({
        data: {
          userId,
          amountKopeks: -dayPrice,
          kind: "bind_pending",
          fnsId,
          externalRef: payment.paymentId,
          description: `Ожидание оплаты привязки карты (${fns.name})`,
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

    // Path (b) — autopay one day with the saved method.
    const idempotenceKey = `vip-bind-${userId}-${fnsId}`;
    let charge;
    try {
      charge = await chargeWithSavedMethod({
        amountKopeks: dayPrice,
        description: `VIP по «${fns.name}» (день 1)`,
        paymentMethodId: user.yookassaPaymentMethodId,
        idempotenceKey,
        metadata: { userId, fnsId, kind: "bind_first_charge" },
      });
    } catch (err) {
      console.error("billing/vip-fns autopay error:", err);
      res.status(402).json({
        error: "Не удалось списать с карты. Попробуйте привязать карту заново.",
      });
      return;
    }

    if (charge.status !== "succeeded" || !charge.paid) {
      res.status(402).json({
        error: "ЮKassa отклонила платёж — обновите карту.",
        status: charge.status,
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.specialistVipFns.upsert({
        where: { specialistId_fnsId: { specialistId: userId, fnsId } },
        create: { specialistId: userId, fnsId },
        update: { activatedAt: new Date() },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: -dayPrice,
          kind: "bind_first_charge",
          fnsId,
          externalRef: charge.paymentId,
          description: `VIP по «${fns.name}» — день 1`,
        },
      });
      // Successful autopay clears any prior failure flag.
      await tx.user.update({
        where: { id: userId },
        data: { lastChargeFailedAt: null },
      });
    });

    res.json({ ok: true, charged: dayPrice });
  } catch (error) {
    console.error("billing/vip-fns POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/billing/vip-fns/:fnsId — deactivate VIP on a single FNS.
// Idempotent. The card stays bound for other active FNS rows.
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

// DELETE /api/billing/payment-method — unbind the saved card.
// Wipes all VIP-FNS rows in the same transaction (autopay can't run
// without a card, so leaving rows would just trip charge_failed at
// the next cron tick).
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

/**
 * POST /api/billing/webhook — ЮKassa notification endpoint.
 *
 * NOT auth-protected (ЮKassa calls without bearer). Trust model:
 * re-fetch the payment by id and act on the canonical record. We
 * de-dupe on (externalRef, kind=bind_first_charge) so retried
 * webhooks can't double-create rows.
 *
 * Two events we actually care about:
 *   - payment.succeeded with metadata.kind=bind_first_charge → save
 *     payment_method on user, create SpecialistVipFns row.
 *   - everything else → 200 OK so ЮKassa stops retrying.
 */
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
    const fnsId = payment.metadata?.fnsId;
    const kind = payment.metadata?.kind;
    if (!userId || kind !== "bind_first_charge" || !fnsId) {
      res.json({ ok: true, ignored: "metadata mismatch" });
      return;
    }

    // De-dupe.
    const already = await prisma.billingTx.findFirst({
      where: { externalRef: paymentId, kind: "bind_first_charge" },
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

    await prisma.$transaction(async (tx) => {
      // Save the bound card (if ЮKassa returned one — every
      // successful save_payment_method:true payment does).
      if (pmId && pmSaved) {
        await tx.user.update({
          where: { id: userId },
          data: {
            yookassaPaymentMethodId: pmId,
            yookassaPaymentMethodTitle: pmTitle,
            lastChargeFailedAt: null,
          },
        });
      }
      // Activate VIP for the FNS that triggered the redirect.
      await tx.specialistVipFns.upsert({
        where: { specialistId_fnsId: { specialistId: userId, fnsId } },
        create: { specialistId: userId, fnsId },
        update: { activatedAt: new Date() },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks: -amountKopeks,
          kind: "bind_first_charge",
          fnsId,
          externalRef: paymentId,
          description: "Привязка карты + VIP, день 1",
        },
      });
      // Clear the pending row this webhook resolves.
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

// GET /api/billing/transactions — last 50 ledger entries for the user.
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
