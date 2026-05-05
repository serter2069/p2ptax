import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

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

// GET /api/billing/balance — current balance + active VIP subscriptions
// + today's burn rate. Returned both in kopeks (for math) and a human
// rouble string the FE can render directly.
router.get("/balance", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const [user, vipFns] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { vipBalanceKopeks: true },
      }),
      prisma.specialistVipFns.findMany({
        where: { specialistId: userId },
        select: {
          id: true,
          fnsId: true,
          activatedAt: true,
          fns: {
            select: {
              id: true,
              name: true,
              code: true,
              cityId: true,
              vipMonthlyPriceKopeks: true,
              city: { select: { name: true } },
            },
          },
        },
        orderBy: { activatedAt: "desc" },
      }),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const dailyTotalKopeks = vipFns.reduce(
      (sum, v) => sum + dailyChargeKopeks(v.fns.vipMonthlyPriceKopeks ?? 0),
      0
    );

    res.json({
      balanceKopeks: user.vipBalanceKopeks,
      balanceRub: user.vipBalanceKopeks / KOPEKS_IN_RUB,
      dailyChargeKopeks: dailyTotalKopeks,
      dailyChargeRub: dailyTotalKopeks / KOPEKS_IN_RUB,
      // Days the wallet covers at the current burn rate. Infinity when
      // nothing is active — surfaced as null so the FE can render "—".
      daysCovered: dailyTotalKopeks > 0
        ? Math.floor(user.vipBalanceKopeks / dailyTotalKopeks)
        : null,
      activeVipFns: vipFns.map((v) => ({
        id: v.id,
        fnsId: v.fnsId,
        fnsName: v.fns.name,
        fnsCode: v.fns.code,
        cityName: v.fns.city.name,
        activatedAt: v.activatedAt,
        monthlyPriceKopeks: v.fns.vipMonthlyPriceKopeks ?? 0,
        monthlyPriceRub: (v.fns.vipMonthlyPriceKopeks ?? 0) / KOPEKS_IN_RUB,
        dailyChargeKopeks: dailyChargeKopeks(v.fns.vipMonthlyPriceKopeks ?? 0),
      })),
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
