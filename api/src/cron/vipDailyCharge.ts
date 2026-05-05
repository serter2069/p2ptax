import { prisma } from "../lib/prisma";

/**
 * VIP daily charge — runs once a day from setInterval in index.ts.
 *
 * For every (user, fnsId) row in specialist_vip_fns we deduct
 * Math.ceil(fns.vipMonthlyPriceKopeks / 30) from the user's wallet
 * and write a 'daily_charge' BillingTx ledger row.
 *
 * Atomicity model: per-user transaction, all-or-nothing. If the
 * total daily burn exceeds the user's balance we deactivate ALL
 * their VIP-FNS rows (delete them) — deterministic "VIP off until
 * top-up" rather than a partial-active state where the cron has to
 * pick which subscriptions to keep.
 *
 * Idempotency: a per-day key (YYYY-MM-DD) is written into each
 * BillingTx description. Re-running the cron in the same calendar
 * day skips users who already have a charge with today's key — so
 * a manual "node dist/cron/run.js" invocation can't double-charge
 * if the regular interval also fires.
 */

const KOPEKS_PER_DAY_DIVISOR = 30;

function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function dailyChargeKopeks(monthlyKopeks: number): number {
  return Math.ceil(monthlyKopeks / KOPEKS_PER_DAY_DIVISOR);
}

export async function runVipDailyChargeCron(now: Date = new Date()): Promise<{
  charged: number;
  deactivated: number;
  skipped: number;
}> {
  const dayKey = todayKey(now);

  // Group active subscriptions by user. We do one $transaction per
  // user — keeps the per-user invariant simple and lets a single
  // user's failure not poison the whole batch.
  const allActive = await prisma.specialistVipFns.findMany({
    select: {
      specialistId: true,
      fnsId: true,
      fns: { select: { vipMonthlyPriceKopeks: true } },
    },
  });

  const byUser = new Map<
    string,
    Array<{ fnsId: string; dailyKopeks: number }>
  >();
  for (const row of allActive) {
    const monthly = row.fns.vipMonthlyPriceKopeks ?? 0;
    if (monthly <= 0) continue;
    const arr = byUser.get(row.specialistId) ?? [];
    arr.push({ fnsId: row.fnsId, dailyKopeks: dailyChargeKopeks(monthly) });
    byUser.set(row.specialistId, arr);
  }

  let charged = 0;
  let deactivated = 0;
  let skipped = 0;

  for (const [userId, rows] of byUser) {
    // Idempotency check: was this user already charged today?
    const todayPrefix = `vip-day:${dayKey}:`;
    const already = await prisma.billingTx.findFirst({
      where: {
        userId,
        kind: "daily_charge",
        description: { startsWith: todayPrefix },
      },
      select: { id: true },
    });
    if (already) {
      skipped++;
      continue;
    }

    const totalKopeks = rows.reduce((s, r) => s + r.dailyKopeks, 0);
    if (totalKopeks <= 0) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const u = await tx.user.findUnique({
          where: { id: userId },
          select: { vipBalanceKopeks: true },
        });
        if (!u) return;

        if (u.vipBalanceKopeks < totalKopeks) {
          // Can't cover the full burn — deactivate everything for
          // this user. Predictable rather than partial-active.
          await tx.specialistVipFns.deleteMany({
            where: { specialistId: userId },
          });
          await tx.billingTx.create({
            data: {
              userId,
              amountKopeks: 0,
              kind: "vip_deactivated",
              description: `${todayPrefix}insufficient_balance`,
            },
          });
          deactivated++;
          return;
        }

        await tx.user.update({
          where: { id: userId },
          data: { vipBalanceKopeks: { decrement: totalKopeks } },
        });
        // Per-FNS ledger rows so a user can see exactly what they
        // were charged for today.
        for (const r of rows) {
          await tx.billingTx.create({
            data: {
              userId,
              amountKopeks: -r.dailyKopeks,
              kind: "daily_charge",
              fnsId: r.fnsId,
              description: `${todayPrefix}${r.fnsId}`,
            },
          });
        }
        charged++;
      });
    } catch (err) {
      console.error(`[vip-daily] charge failed for user ${userId}:`, err);
    }
  }

  return { charged, deactivated, skipped };
}
