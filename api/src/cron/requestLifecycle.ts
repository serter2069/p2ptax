import { prisma } from "../lib/prisma";
import { sendNotification } from "../notifications/notification.service";

/**
 * Request lifecycle cron job.
 *
 * Runs periodically (called from index.ts via setInterval).
 *
 * Bug #174 fix: reminder emails are sent BEFORE deactivating/closing the request.
 * Previous (broken) order: deactivate → email (email referenced already-closed requests).
 * Correct order: email → deactivate.
 *
 * Two phases:
 * 1. ACTIVE requests older than WARN_DAYS → mark CLOSING_SOON and notify owner.
 * 2. CLOSING_SOON requests older than CLOSE_DAYS → notify owner first, then close.
 */

const WARN_AFTER_DAYS = parseInt(process.env.REQUEST_WARN_AFTER_DAYS || "25", 10);
const CLOSE_AFTER_DAYS = parseInt(process.env.REQUEST_CLOSE_AFTER_DAYS || "30", 10);

export async function runRequestLifecycleCron(): Promise<void> {
  const now = new Date();

  const warnThreshold = new Date(now.getTime() - WARN_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const closeThreshold = new Date(now.getTime() - CLOSE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // ── Phase 1: ACTIVE → CLOSING_SOON ──────────────────────────────────────────
  const soonToExpire = await prisma.request.findMany({
    where: {
      status: "ACTIVE",
      lastActivityAt: { lte: warnThreshold },
    },
    select: { id: true, title: true, userId: true },
  });

  for (const req of soonToExpire) {
    // 1a. Send reminder notification FIRST
    try {
      await sendNotification({
        userId: req.userId,
        type: "promo_expiring",
        title: "Ваша заявка скоро закроется",
        body: `Заявка «${req.title}» будет автоматически закрыта через ${CLOSE_AFTER_DAYS - WARN_AFTER_DAYS} дней. Продлите её, если хотите оставить активной.`,
        entityId: req.id,
      });
    } catch (err) {
      console.warn(`[lifecycle] Failed to notify user ${req.userId} for request ${req.id}:`, (err as Error).message);
    }

    // 1b. Mark as CLOSING_SOON only after notification is queued
    try {
      await prisma.request.update({
        where: { id: req.id },
        data: { status: "CLOSING_SOON" },
      });
    } catch (err) {
      console.warn(`[lifecycle] Failed to update request ${req.id} to CLOSING_SOON:`, (err as Error).message);
    }
  }

  // ── Phase 2: CLOSING_SOON → CLOSED ──────────────────────────────────────────
  const expiredRequests = await prisma.request.findMany({
    where: {
      status: "CLOSING_SOON",
      lastActivityAt: { lte: closeThreshold },
    },
    select: { id: true, title: true, userId: true },
  });

  for (const req of expiredRequests) {
    // 2a. Send final closure notification FIRST (bug #174 fix: email before deactivate)
    try {
      await sendNotification({
        userId: req.userId,
        type: "promo_expiring",
        title: "Заявка закрыта",
        body: `Заявка «${req.title}» была автоматически закрыта по истечении срока. Вы можете создать новую заявку.`,
        entityId: req.id,
      });
    } catch (err) {
      console.warn(`[lifecycle] Failed to send closure notification for request ${req.id}:`, (err as Error).message);
    }

    // 2b. Deactivate AFTER notification is queued
    try {
      await prisma.request.update({
        where: { id: req.id },
        data: { status: "CLOSED" },
      });
    } catch (err) {
      console.warn(`[lifecycle] Failed to close request ${req.id}:`, (err as Error).message);
    }
  }

  if (soonToExpire.length > 0 || expiredRequests.length > 0) {
    console.log(
      `[lifecycle] Cron run: warned=${soonToExpire.length} closed=${expiredRequests.length}`
    );
  }
}
