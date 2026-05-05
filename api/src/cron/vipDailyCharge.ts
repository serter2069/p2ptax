import { prisma } from "../lib/prisma";
import { chargeWithSavedMethod } from "../lib/yookassa";
import { sendVipChargeFailedEmail } from "../lib/email";

/**
 * PRO daily autopay — runs once a day from setInterval in index.ts.
 *
 * Pricing model: per-user. Each user with subscriptionPlanId is
 * charged `plan.monthlyPriceKopeks / 30` once per calendar day,
 * regardless of how many SpecialistVipFns rows they have under it.
 *
 * Outcomes per user:
 *   - card succeeds → write a single 'daily_charge' BillingTx row.
 *   - card fails    → unset the plan, wipe ALL VIP rows, set
 *                     lastChargeFailedAt, send "обновите карту" email.
 *   - no saved card → defensive cleanup: same as fail.
 *
 * Idempotency: per-user, per-day key prefix `pro-day:YYYY-MM-DD:`.
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
  const todayPrefix = `pro-day:${dayKey}:`;

  const subscribers = await prisma.user.findMany({
    where: { subscriptionPlanId: { not: null } },
    select: {
      id: true,
      email: true,
      firstName: true,
      yookassaPaymentMethodId: true,
      subscriptionPlan: {
        select: { id: true, name: true, monthlyPriceKopeks: true },
      },
    },
  });

  let charged = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of subscribers) {
    const plan = user.subscriptionPlan;
    if (!plan) continue;

    // Idempotency check.
    const already = await prisma.billingTx.findFirst({
      where: {
        userId: user.id,
        kind: { in: ["daily_charge", "charge_failed"] },
        description: { startsWith: todayPrefix },
      },
      select: { id: true },
    });
    if (already) {
      skipped++;
      continue;
    }

    const dayPrice = dailyChargeKopeks(plan.monthlyPriceKopeks);
    if (dayPrice <= 0) continue;

    // Defensive: plan but no card. Wipe everything.
    if (!user.yookassaPaymentMethodId) {
      await prisma.$transaction(async (tx) => {
        await tx.specialistVipFns.deleteMany({ where: { specialistId: user.id } });
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlanId: null,
            subscriptionStartedAt: null,
            lastChargeFailedAt: new Date(),
          },
        });
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -dayPrice,
            kind: "charge_failed",
            description: `${todayPrefix}no_payment_method`,
          },
        });
      });
      failed++;
      continue;
    }

    const idempotenceKey = `pro-day-${dayKey}-${user.id}`;
    let chargeOk = false;
    let paymentId: string | null = null;
    try {
      const charge = await chargeWithSavedMethod({
        amountKopeks: dayPrice,
        description: `Тариф ${plan.name} — ${dayKey}`,
        paymentMethodId: user.yookassaPaymentMethodId,
        idempotenceKey,
        metadata: { userId: user.id, planId: plan.id, kind: "daily_charge", day: dayKey },
      });
      chargeOk = charge.status === "succeeded" && charge.paid;
      paymentId = charge.paymentId;
    } catch (err) {
      console.error(`[pro-daily] autopay error for ${user.id}:`, err);
      chargeOk = false;
    }

    if (chargeOk) {
      await prisma.$transaction(async (tx) => {
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -dayPrice,
            kind: "daily_charge",
            externalRef: paymentId ?? undefined,
            description: `${todayPrefix}${plan.name}`,
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { lastChargeFailedAt: null },
        });
      });
      charged++;
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.specialistVipFns.deleteMany({ where: { specialistId: user.id } });
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlanId: null,
            subscriptionStartedAt: null,
            lastChargeFailedAt: new Date(),
          },
        });
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -dayPrice,
            kind: "charge_failed",
            externalRef: paymentId ?? undefined,
            description: `${todayPrefix}autopay_rejected`,
          },
        });
      });
      failed++;
      if (user.email) {
        try {
          await sendVipChargeFailedEmail({
            toEmail: user.email,
            toName: user.firstName ?? "коллега",
            amountRub: Math.round(dayPrice / 100),
          });
        } catch (err) {
          console.error(`[pro-daily] email error for ${user.id}:`, err);
        }
      }
    }
  }

  return { charged, failed, skipped };
}
