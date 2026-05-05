import { prisma } from "../lib/prisma";
import { chargeWithSavedMethod } from "../lib/yookassa";
import { sendVipChargeFailedEmail } from "../lib/email";

/**
 * VIP daily autopay — runs once a day from setInterval in index.ts.
 *
 * For every specialist with at least one SpecialistVipFns row we
 * sum Math.ceil(monthly/30) across active rows and charge that
 * amount in ONE ЮKassa autopay using the saved payment_method_id.
 *
 * Outcomes per user:
 *   - card succeeds → write per-FNS billing_tx 'daily_charge' rows.
 *   - card fails    → wipe ALL SpecialistVipFns rows, set
 *                     lastChargeFailedAt, send "обновите карту"
 *                     email. Predictable rather than partial-active.
 *   - no saved card → defensive cleanup: wipe rows + set failed
 *                     timestamp. Shouldn't happen via the UI flow
 *                     but guards against orphan state.
 *
 * Idempotency: per-day key prefix `vip-day:YYYY-MM-DD:` on every
 * billing_tx row. A re-run on the same calendar day skips users
 * who already have a charge with today's key.
 */

const KOPEKS_PER_DAY_DIVISOR = 30;

function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function dailyChargeKopeks(monthlyKopeks: number): number {
  return Math.ceil(monthlyKopeks / KOPEKS_PER_DAY_DIVISOR);
}

export async function runVipDailyChargeCron(now: Date = new Date()): Promise<{
  charged: number;
  failed: number;
  skipped: number;
}> {
  const dayKey = todayKey(now);

  const allActive = await prisma.specialistVipFns.findMany({
    select: {
      specialistId: true,
      fnsId: true,
      fns: { select: { name: true, vipMonthlyPriceKopeks: true } },
    },
  });

  // Collapse into per-user buckets. We charge each user in one
  // autopay even if they have several active FNS rows — saves
  // ЮKassa fees and keeps a single source of truth per day.
  type Row = { fnsId: string; fnsName: string; dailyKopeks: number };
  const byUser = new Map<string, Row[]>();
  for (const row of allActive) {
    const monthly = row.fns.vipMonthlyPriceKopeks ?? 0;
    if (monthly <= 0) continue;
    const arr = byUser.get(row.specialistId) ?? [];
    arr.push({
      fnsId: row.fnsId,
      fnsName: row.fns.name,
      dailyKopeks: dailyChargeKopeks(monthly),
    });
    byUser.set(row.specialistId, arr);
  }

  let charged = 0;
  let failed = 0;
  let skipped = 0;
  const todayPrefix = `vip-day:${dayKey}:`;

  for (const [userId, rows] of byUser) {
    const already = await prisma.billingTx.findFirst({
      where: {
        userId,
        kind: { in: ["daily_charge", "charge_failed"] },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        yookassaPaymentMethodId: true,
      },
    });
    if (!user) continue;

    // Defensive: orphan VIP rows without a card. Wipe and continue.
    if (!user.yookassaPaymentMethodId) {
      await prisma.$transaction(async (tx) => {
        await tx.specialistVipFns.deleteMany({ where: { specialistId: userId } });
        await tx.user.update({
          where: { id: userId },
          data: { lastChargeFailedAt: new Date() },
        });
        await tx.billingTx.create({
          data: {
            userId,
            amountKopeks: -totalKopeks,
            kind: "charge_failed",
            description: `${todayPrefix}no_payment_method`,
          },
        });
      });
      failed++;
      continue;
    }

    const idempotenceKey = `vip-day-${dayKey}-${userId}`;
    let chargeOk = false;
    let paymentId: string | null = null;
    try {
      const charge = await chargeWithSavedMethod({
        amountKopeks: totalKopeks,
        description: `VIP-подписки P2PTax — ${dayKey}`,
        paymentMethodId: user.yookassaPaymentMethodId,
        idempotenceKey,
        metadata: { userId, kind: "daily_charge", day: dayKey },
      });
      chargeOk = charge.status === "succeeded" && charge.paid;
      paymentId = charge.paymentId;
    } catch (err) {
      console.error(`[vip-daily] autopay error for ${userId}:`, err);
      chargeOk = false;
    }

    if (chargeOk) {
      await prisma.$transaction(async (tx) => {
        for (const r of rows) {
          await tx.billingTx.create({
            data: {
              userId,
              amountKopeks: -r.dailyKopeks,
              kind: "daily_charge",
              fnsId: r.fnsId,
              externalRef: paymentId ?? undefined,
              description: `${todayPrefix}${r.fnsId}`,
            },
          });
        }
        await tx.user.update({
          where: { id: userId },
          data: { lastChargeFailedAt: null },
        });
      });
      charged++;
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.specialistVipFns.deleteMany({ where: { specialistId: userId } });
        await tx.user.update({
          where: { id: userId },
          data: { lastChargeFailedAt: new Date() },
        });
        await tx.billingTx.create({
          data: {
            userId,
            amountKopeks: -totalKopeks,
            kind: "charge_failed",
            externalRef: paymentId ?? undefined,
            description: `${todayPrefix}autopay_rejected`,
          },
        });
      });
      failed++;
      // Best-effort: tell the user. Don't block cron on email errors.
      if (user.email) {
        try {
          await sendVipChargeFailedEmail({
            toEmail: user.email,
            toName: user.firstName ?? "коллега",
            amountRub: Math.round(totalKopeks / 100),
          });
        } catch (err) {
          console.error(`[vip-daily] email error for ${userId}:`, err);
        }
      }
    }
  }

  return { charged, failed, skipped };
}
