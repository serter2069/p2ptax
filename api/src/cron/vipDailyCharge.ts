import { prisma } from "../lib/prisma";
import { chargeWithSavedMethod } from "../lib/yookassa";
import { sendVipChargeFailedEmail } from "../lib/email";

/**
 * PRO monthly autopay — runs once a day from setInterval in index.ts.
 *
 * Pricing model: per-user. Each user with subscriptionPlanId has a
 * `subscriptionNextChargeAt` set on first payment (= startedAt + 30
 * days). Cron picks up everyone whose nextChargeAt <= now, charges
 * the **full** monthlyPriceKopeks once, and rolls nextChargeAt forward
 * by 30 days.
 *
 * Outcomes per user:
 *   - card succeeds → write a single 'monthly_charge' BillingTx row,
 *                     advance nextChargeAt by 30 days.
 *   - card fails    → unset the plan, wipe ALL VIP rows, set
 *                     lastChargeFailedAt, send "обновите карту" email.
 *   - no saved card → defensive cleanup: same as fail.
 *
 * Idempotency: per-user, per-due-day key prefix `pro-mon:YYYY-MM-DD:`.
 * Same user can't be charged twice for the same due date even if cron
 * runs twice.
 */

const RENEWAL_DAYS = 30;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function runVipDailyChargeCron(now: Date = new Date()): Promise<{
  charged: number;
  failed: number;
  skipped: number;
}> {
  const subscribers = await prisma.user.findMany({
    where: {
      subscriptionPlanId: { not: null },
      subscriptionNextChargeAt: { lte: now },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      yookassaPaymentMethodId: true,
      subscriptionNextChargeAt: true,
      subscriptionPlan: {
        select: { id: true, name: true, monthlyPriceKopeks: true, fnsLimit: true },
      },
      pendingPlan: {
        select: { id: true, name: true, monthlyPriceKopeks: true, fnsLimit: true },
      },
      pendingPlanKeepFnsIds: true,
    },
  });

  // Cleanup stale bind_pending записей. Юзер начал ЮKassa-флоу, но
  // не довёл его до конца (закрыл вкладку, отвалилась карта и т.п.).
  // Webhook на success удаляет bind_pending сам — здесь чистим именно
  // «недомеры». 24 часа — сильно больше типичного 30-сек hold'а
  // ЮKassa, но достаточно если webhook задержался на минуты-часы.
  const staleCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const cleanedPending = await prisma.billingTx.deleteMany({
    where: { kind: "bind_pending", createdAt: { lt: staleCutoff } },
  });
  if (cleanedPending.count > 0) {
    console.log(`[vip-daily] cleaned ${cleanedPending.count} stale bind_pending`);
  }

  let charged = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of subscribers) {
    if (!user.subscriptionPlan || !user.subscriptionNextChargeAt) continue;

    // Применяем запланированную смену тарифа ПЕРЕД списанием. Юзер
    // оплатил полный цикл предыдущего тарифа — он работал до сегодня.
    // На сегодняшнем продлении переключаемся на pending: подменяем
    // план, обрезаем VIP-слоты до нового лимита (oldest first), и
    // дальнейшее списание идёт уже по новой цене.
    let plan = user.subscriptionPlan;
    if (user.pendingPlan && user.pendingPlan.id !== plan.id) {
      const newPlan = user.pendingPlan;
      const keepIds = new Set(user.pendingPlanKeepFnsIds ?? []);
      await prisma.$transaction(async (tx) => {
        // Шаг 1: удалить всё что НЕ в keep-list (если keep-list пуст,
        // это значит у юзера было ≤ нового лимита на момент schedule —
        // ничего не дропаем).
        if (keepIds.size > 0) {
          await tx.specialistVipFns.deleteMany({
            where: {
              specialistId: user.id,
              fnsId: { notIn: Array.from(keepIds) },
            },
          });
        }
        // Шаг 2: фолбек на oldest-first если после шага 1 всё ещё
        // overflow (юзер добавил новые VIP после scheduling).
        const remaining = await tx.specialistVipFns.count({
          where: { specialistId: user.id },
        });
        const overflow = remaining - newPlan.fnsLimit;
        if (overflow > 0) {
          const toRemove = await tx.specialistVipFns.findMany({
            where: { specialistId: user.id },
            orderBy: { activatedAt: "asc" },
            take: overflow,
            select: { id: true },
          });
          await tx.specialistVipFns.deleteMany({
            where: { id: { in: toRemove.map((r) => r.id) } },
          });
        }
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlanId: newPlan.id,
            pendingPlanId: null,
            pendingPlanScheduledAt: null,
            pendingPlanKeepFnsIds: [],
          },
        });
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: 0,
            kind: "plan_applied",
            description: `Применён запланированный переход на тариф «${newPlan.name}»`,
          },
        });
      });
      plan = newPlan; // дальше списываем по новой цене
    }

    const dueDay = ymd(user.subscriptionNextChargeAt);
    const duePrefix = `pro-mon:${dueDay}:`;

    // Idempotency: уже списали (или провалили) сегодня для этой due-даты?
    const already = await prisma.billingTx.findFirst({
      where: {
        userId: user.id,
        kind: { in: ["monthly_charge", "charge_failed"] },
        description: { startsWith: duePrefix },
      },
      select: { id: true },
    });
    if (already) {
      skipped++;
      continue;
    }

    const monthPrice = plan.monthlyPriceKopeks;
    if (monthPrice <= 0) continue;

    // Подписка есть, а карты нет. Чистим.
    if (!user.yookassaPaymentMethodId) {
      await prisma.$transaction(async (tx) => {
        await tx.specialistVipFns.deleteMany({ where: { specialistId: user.id } });
        await tx.user.update({
          where: { id: user.id },
          data: {
            subscriptionPlanId: null,
            subscriptionStartedAt: null,
            subscriptionNextChargeAt: null,
            lastChargeFailedAt: new Date(),
          },
        });
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -monthPrice,
            kind: "charge_failed",
            description: `${duePrefix}no_payment_method`,
          },
        });
      });
      failed++;
      continue;
    }

    const idempotenceKey = `pro-mon-${dueDay}-${user.id}`;
    let chargeOk = false;
    let paymentId: string | null = null;
    try {
      const charge = await chargeWithSavedMethod({
        amountKopeks: monthPrice,
        description: `Тариф ${plan.name} — продление на 30 дней`,
        paymentMethodId: user.yookassaPaymentMethodId,
        idempotenceKey,
        metadata: { userId: user.id, planId: plan.id, kind: "monthly_charge", dueDay },
      });
      chargeOk = charge.status === "succeeded" && charge.paid;
      paymentId = charge.paymentId;
    } catch (err) {
      console.error(`[pro-monthly] autopay error for ${user.id}:`, err);
      chargeOk = false;
    }

    if (chargeOk) {
      // Сдвигаем nextChargeAt вперёд на 30 дней от прежней due-даты,
      // чтобы платежи были ровно по графику и не сползали при
      // задержках cron.
      const nextDue = new Date(user.subscriptionNextChargeAt.getTime() + RENEWAL_DAYS * 24 * 60 * 60 * 1000);
      await prisma.$transaction(async (tx) => {
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -monthPrice,
            kind: "monthly_charge",
            externalRef: paymentId ?? undefined,
            description: `${duePrefix}${plan.name}`,
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: {
            lastChargeFailedAt: null,
            subscriptionNextChargeAt: nextDue,
          },
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
            subscriptionNextChargeAt: null,
            lastChargeFailedAt: new Date(),
          },
        });
        await tx.billingTx.create({
          data: {
            userId: user.id,
            amountKopeks: -monthPrice,
            kind: "charge_failed",
            externalRef: paymentId ?? undefined,
            description: `${duePrefix}autopay_rejected`,
          },
        });
      });
      failed++;
      if (user.email) {
        try {
          await sendVipChargeFailedEmail({
            toEmail: user.email,
            toName: user.firstName ?? "коллега",
            amountRub: Math.round(monthPrice / 100),
          });
        } catch (err) {
          console.error(`[pro-monthly] email error for ${user.id}:`, err);
        }
      }
    }
  }

  return { charged, failed, skipped };
}
