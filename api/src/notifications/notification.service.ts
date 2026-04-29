import { prisma } from "../lib/prisma";
import { getNotificationQueue } from "./notification.queue";

export interface SendNotificationData {
  userId: string;
  type: string; // new_message_from_specialist | new_message | new_request_in_city | promo_expiring
  title: string;
  body: string;
  entityId?: string;
}

/**
 * Create an in-app notification and enqueue fan-out (email + inApp delivery).
 * Graceful degradation: if Valkey/BullMQ is unavailable, logs to DB directly.
 */
export async function sendNotification(data: SendNotificationData) {
  // Persist in-app notification record
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      entityId: data.entityId,
    },
  });

  const queue = getNotificationQueue();

  if (queue) {
    try {
      await queue.add("fan-out", {
        notificationId: notification.id,
        userId: data.userId,
        eventType: data.type,
        title: data.title,
        body: data.body,
        entityId: data.entityId,
      });
    } catch (err) {
      console.warn("[notifications] Queue add failed, falling back to direct delivery:", (err as Error).message);
      // Graceful degradation: log inapp delivery directly
      await prisma.notificationDeliveryLog.create({
        data: {
          notificationId: notification.id,
          channel: "inapp",
          status: "sent",
          reason: "queue_unavailable_fallback",
        },
      });
    }
  } else {
    // Queue never initialised (Valkey not configured) — store inapp log directly
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: notification.id,
        channel: "inapp",
        status: "sent",
        reason: "queue_unavailable_fallback",
      },
    });
  }

  return notification;
}
