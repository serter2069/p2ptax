import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { createPayment, fetchPayment } from "../lib/yookassa";

const router = Router();

/**
 * Billing routes — VIP wallet + per-FNS subscription toggles.
 *
 * Architecture (see decisions in PR thread):
 *   - User has a kopek-denominated `vipBalanceKopeks` running balance.
 *   - Specialist toggles VIP per FnsOffice via SpecialistVipFns rows.
 *   - Each FnsOffice carries an optional `vipMonthlyPriceKopeks`.
 *     Daily burn = monthlyPrice / 30 (round up to integer kopeks so
 *     the cron never charges fractional and never under-charges).
 *   - Daily cron `vip-daily-charge.ts` deducts the day's total from
 *     balance and writes a BillingTx row per FNS. When balance can't
 *     cover all active rows, ALL VIP-FNS rows for that user are
 *     deleted (deterministic — no partial-active state).
 *   - Top-ups happen via /api/billing/topup → ЮKassa → webhook
 *     (separate route file).
 */

const KOPEKS_IN_RUB = 100;

function dailyChargeKopeks(monthlyKopeks: number): number {
  // Ceiling division — never under-charge by a fraction of a kopek.
  return Math.ceil(monthlyKopeks / 30);
}

// GET /api/billing/balance — current balance + the specialist's full
// FNS catalog (each row carries a `vipActive` flag + price), plus
// today's burn rate. The FE renders this as a single page — wallet
// header on top, list of FNS-toggle rows below. Returning everything
// in one shape avoids two round-trips on every render.
router.get("/balance", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [user, specialistFns, vipRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { vipBalanceKopeks: true, isSpecialist: true },
      }),
      // The specialist's working area — every FNS they cover, with
      // its current VIP price. Sorted by city then FNS so the list
      // reads top-down geographically.
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
        // null = VIP isn't available on this office (admin hasn't set
        // a price). FE renders the row read-only with "Тариф ещё не
        // настроен" instead of a toggle.
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
      balanceKopeks: user.vipBalanceKopeks,
      balanceRub: user.vipBalanceKopeks / KOPEKS_IN_RUB,
      dailyChargeKopeks: dailyTotalKopeks,
      dailyChargeRub: dailyTotalKopeks / KOPEKS_IN_RUB,
      // Days the wallet covers at the current burn rate. null when
      // nothing is active — FE renders "—".
      daysCovered: dailyTotalKopeks > 0
        ? Math.floor(user.vipBalanceKopeks / dailyTotalKopeks)
        : null,
      fnsCatalog,
    });
  } catch (error) {
    console.error("billing/balance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/billing/vip-fns/:fnsId — activate VIP on an FNS.
// Requires the FNS to have a non-null vipMonthlyPriceKopeks (admin
// has set a price) and the wallet to cover at least one day at the
// new burn rate (otherwise toggling on would just immediately gas
// itself out at the next cron tick).
router.post("/vip-fns/:fnsId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const fnsId = req.params.fnsId as string;

    const fns = await prisma.fnsOffice.findUnique({
      where: { id: fnsId },
      select: { id: true, vipMonthlyPriceKopeks: true },
    });
    if (!fns) {
      res.status(404).json({ error: "FNS not found" });
      return;
    }
    if (fns.vipMonthlyPriceKopeks == null) {
      res.status(400).json({ error: "VIP не настроен для этой ИФНС" });
      return;
    }

    // Reject if balance can't cover today's charge for the new row.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vipBalanceKopeks: true, isSpecialist: true },
    });
    if (!user || !user.isSpecialist) {
      res.status(403).json({ error: "VIP доступен только специалистам" });
      return;
    }
    const newDaily = dailyChargeKopeks(fns.vipMonthlyPriceKopeks);
    if (user.vipBalanceKopeks < newDaily) {
      res.status(402).json({
        error: "Недостаточно средств — пополните баланс",
        required: newDaily,
      });
      return;
    }

    await prisma.specialistVipFns.upsert({
      where: { specialistId_fnsId: { specialistId: userId, fnsId } },
      create: { specialistId: userId, fnsId },
      update: { activatedAt: new Date() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("billing/vip-fns POST error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/billing/vip-fns/:fnsId — deactivate VIP. Idempotent.
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

// POST /api/billing/topup — start a ЮKassa Payment for top-up.
// Body: { amountKopeks: number }. Returns { confirmationUrl } so the
// FE can redirect the user to ЮKassa's hosted checkout. The actual
// balance credit happens in /webhook once ЮKassa confirms 'succeeded'.
router.post("/topup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amountKopeks } = req.body as { amountKopeks?: number };

    // Sanity caps: min 100₽, max 100 000₽ per transaction. Keeps
    // accidental fat-finger mistakes contained on staging too.
    if (
      typeof amountKopeks !== "number" ||
      !Number.isFinite(amountKopeks) ||
      !Number.isInteger(amountKopeks) ||
      amountKopeks < 10000 ||
      amountKopeks > 10_000_000
    ) {
      res.status(400).json({ error: "amountKopeks must be 10 000…10 000 000" });
      return;
    }

    const returnBase =
      process.env.YK_RETURN_URL_BASE ?? "https://p2ptax.smartlaunchhub.com";
    const payment = await createPayment({
      amountKopeks,
      description: "Пополнение VIP-баланса P2PTax",
      userId,
      returnUrl: `${returnBase}/profile?tab=billing&topup=ok`,
    });

    // Pre-record a 'pending' ledger entry tagged with the ЮKassa id.
    // The webhook will look it up by externalRef and switch it to a
    // posted credit when 'succeeded' arrives.
    await prisma.billingTx.create({
      data: {
        userId,
        amountKopeks,
        kind: "topup_pending",
        externalRef: payment.paymentId,
        description: "Создан платёж ЮKassa",
      },
    });

    res.json({
      paymentId: payment.paymentId,
      confirmationUrl: payment.confirmationUrl,
    });
  } catch (error) {
    console.error("billing/topup error:", error);
    res.status(500).json({ error: "Не удалось создать платёж" });
  }
});

// POST /api/billing/webhook — ЮKassa notification endpoint.
// IMPORTANT: NOT auth-protected (ЮKassa calls it without bearer).
// Security model: we DON'T trust the body — we re-fetch the payment
// by id from ЮKassa and act on the canonical status. Webhook can
// also fire multiple times for the same event; we de-dupe on the
// pending ledger row (externalRef is unique-ish per payment id).
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Body shape: { event, object: { id, status, ... } }
    const body = req.body as {
      event?: string;
      object?: { id?: string };
    };
    const paymentId = body?.object?.id;
    if (!paymentId) {
      res.status(400).json({ error: "Missing object.id" });
      return;
    }

    // Re-fetch — never trust the webhook payload directly. If the
    // status really is succeeded the canonical fetch will say so.
    const payment = await fetchPayment(paymentId);
    if (payment.status !== "succeeded" || !payment.paid) {
      // Acknowledge non-success events so ЮKassa stops retrying, but
      // don't credit anything.
      res.json({ ok: true, ignored: payment.status });
      return;
    }

    const userId = payment.metadata?.userId;
    if (!userId) {
      res.status(200).json({ ok: true, error: "No userId in metadata" });
      return;
    }
    const valueRub = parseFloat(payment.amount.value);
    const amountKopeks = Math.round(valueRub * 100);
    if (!Number.isFinite(amountKopeks) || amountKopeks <= 0) {
      res.status(200).json({ ok: true, error: "Invalid amount" });
      return;
    }

    // De-dupe: if we already credited this paymentId, don't double.
    const already = await prisma.billingTx.findFirst({
      where: { externalRef: paymentId, kind: "topup" },
      select: { id: true },
    });
    if (already) {
      res.json({ ok: true, alreadyCredited: true });
      return;
    }

    // Credit balance + write the canonical 'topup' ledger row in one
    // transaction so a partial failure can't leave the wallet out of
    // sync with the ledger.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { vipBalanceKopeks: { increment: amountKopeks } },
      });
      await tx.billingTx.create({
        data: {
          userId,
          amountKopeks,
          kind: "topup",
          externalRef: paymentId,
          description: "Пополнение VIP-баланса (ЮKassa)",
        },
      });
      // Mark the pending row resolved (so the user's transaction list
      // doesn't show two rows for the same payment).
      await tx.billingTx.deleteMany({
        where: { externalRef: paymentId, kind: "topup_pending" },
      });
    });

    res.json({ ok: true, credited: amountKopeks });
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
