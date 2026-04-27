import { Worker, Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { QUEUE_NAME } from "./notification.queue";
import { config, getRedisConnection } from "../lib/config";
import nodemailer from "nodemailer";

export interface NotificationJobData {
  notificationId: string;
  userId: string;
  eventType: string;
  title: string;
  body: string;
  entityId?: string;
}

// Email channel
async function sendEmail(data: NotificationJobData): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { email: true },
  });

  if (!user?.email) {
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: "email",
        status: "skipped",
        reason: "no email on user",
      },
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: config.smtpFrom,
      to: user.email,
      subject: data.title,
      text: data.body,
    });

    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: "email",
        status: "sent",
      },
    });
  } catch (err) {
    const message = (err as Error).message;
    console.warn("[notifications] Email send failed:", message);
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: "email",
        status: "failed",
        reason: message,
      },
    });
  }
}

// In-app channel: notification is already written; just log delivery
async function sendInApp(data: NotificationJobData): Promise<void> {
  try {
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: data.notificationId,
        channel: "inapp",
        status: "sent",
      },
    });
  } catch (err) {
    console.warn("[notifications] InApp log failed:", (err as Error).message);
  }
}

// Fan-out processor
async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const { notificationId, userId, eventType, title, body, entityId } = job.data;

  // Load preferences (default: everything enabled)
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId_eventType: { userId, eventType } },
  });

  const emailEnabled = prefs?.email !== false;
  const inAppEnabled = prefs?.inApp !== false;

  await Promise.allSettled([
    emailEnabled
      ? sendEmail({ notificationId, userId, eventType, title, body, entityId })
      : prisma.notificationDeliveryLog.create({
          data: { notificationId, channel: "email", status: "skipped", reason: "user preference" },
        }),
    inAppEnabled
      ? sendInApp({ notificationId, userId, eventType, title, body, entityId })
      : prisma.notificationDeliveryLog.create({
          data: { notificationId, channel: "inapp", status: "skipped", reason: "user preference" },
        }),
  ]);
}

let _worker: Worker | null = null;

export function startNotificationWorker(): void {
  try {
    _worker = new Worker<NotificationJobData>(
      QUEUE_NAME,
      processNotificationJob,
      { connection: getRedisConnection() }
    );

    _worker.on("completed", (_job) => {
      // job completed silently
    });

    _worker.on("failed", (job, err) => {
      console.error(`[notifications] Job ${job?.id} failed:`, err.message);
    });

    _worker.on("error", (err) => {
      console.warn("[notifications] Worker error:", err.message);
    });

    // worker started
  } catch (err) {
    console.warn("[notifications] Failed to start worker (Valkey unavailable):", (err as Error).message);
  }
}

export async function stopNotificationWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
}
