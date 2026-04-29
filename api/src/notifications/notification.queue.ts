import { Queue } from "bullmq";
import { getRedisConnection } from "../lib/config";

const QUEUE_NAME = "notifications";

let _queue: Queue | null = null;

export function getNotificationQueue(): Queue | null {
  if (_queue) return _queue;
  try {
    _queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    return _queue;
  } catch (err) {
    console.warn("[notifications] Failed to create BullMQ queue:", (err as Error).message);
    return null;
  }
}

export { QUEUE_NAME };
