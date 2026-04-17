import { Queue } from "bullmq";

const QUEUE_NAME = "notifications";

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    // Parse redis://host:port or redis://:password@host:port
    const url = new URL(redisUrl);
    return {
      host: url.hostname || "127.0.0.1",
      port: parseInt(url.port || "6379"),
      password: url.password || undefined,
      keyPrefix: "p2ptax:bull:",
    };
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    keyPrefix: "p2ptax:bull:",
  };
}

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

export { QUEUE_NAME, getRedisConnection };
