/**
 * Centralized environment variable validation.
 * Call validateConfig() early in the app bootstrap (in index.ts).
 * After validation all exported config values are guaranteed present.
 */

const NODE_ENV = (process.env.NODE_ENV as "development" | "production" | "test") || "development";
const IS_PROD = NODE_ENV === "production";

/* ------------------------------------------------------------------ */
/*  Required in all environments                                       */
/* ------------------------------------------------------------------ */

const DATABASE_URL = process.env.DATABASE_URL;

/* ------------------------------------------------------------------ */
/*  JWT                                                               */
/* ------------------------------------------------------------------ */

let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (IS_PROD) {
    console.error("FATAL: JWT_SECRET environment variable is required in production.");
    process.exit(1);
  }
  console.warn("WARNING: JWT_SECRET not set. Using insecure dev fallback. Set JWT_SECRET in production.");
  JWT_SECRET = "dev-secret";
}

/* ------------------------------------------------------------------ */
/*  MinIO (required in production)                                     */
/* ------------------------------------------------------------------ */

let MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
let MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
let MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;

if (IS_PROD) {
  const missing: string[] = [];
  if (!MINIO_ENDPOINT) missing.push("MINIO_ENDPOINT");
  if (!MINIO_ACCESS_KEY) missing.push("MINIO_ACCESS_KEY");
  if (!MINIO_SECRET_KEY) missing.push("MINIO_SECRET_KEY");

  if (missing.length > 0) {
    console.error(`FATAL: Missing required MinIO env vars in production: ${missing.join(", ")}`);
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Redis (required for notifications)                                 */
/* ------------------------------------------------------------------ */

const REDIS_URL = process.env.REDIS_URL;

/* ------------------------------------------------------------------ */
/*  SMTP (optional – only needed if email notifications are used)      */
/* ------------------------------------------------------------------ */

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@p2ptax.ru";

/* ------------------------------------------------------------------ */
/*  Miscellaneous                                                      */
/* ------------------------------------------------------------------ */

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3812;
const LIFECYCLE_CRON_INTERVAL_MS = process.env.LIFECYCLE_CRON_INTERVAL_MS
  ? parseInt(process.env.LIFECYCLE_CRON_INTERVAL_MS, 10)
  : 3_600_000;

/* ------------------------------------------------------------------ */
/*  Runtime validation helper (call once on startup)                   */
/* ------------------------------------------------------------------ */

/**
 * Performs additional runtime checks beyond the per-variable guards above.
 * Throws if a critical variable is missing.
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (IS_PROD && !REDIS_URL) {
    errors.push("REDIS_URL is required in production (for notification queue)");
  }

  if (errors.length > 0) {
    console.error("FATAL: Environment validation failed:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/*  Redis connection object (parsed from REDIS_URL)                    */
/* ------------------------------------------------------------------ */

export function getRedisConnection(): {
  host: string;
  port: number;
  password?: string;
  keyPrefix: string;
} {
  if (REDIS_URL) {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname || "127.0.0.1",
      port: url.port ? parseInt(url.port, 10) : 6379,
      password: url.password || undefined,
      keyPrefix: "p2ptax:bull:",
    };
  }
  return {
    host: "127.0.0.1",
    port: 6379,
    keyPrefix: "p2ptax:bull:",
  };
}

/* ------------------------------------------------------------------ */
/*  Exports – single source of truth                                   */
/* ------------------------------------------------------------------ */

export const config = {
  nodeEnv: NODE_ENV,
  isProd: IS_PROD,
  databaseUrl: DATABASE_URL,
  jwtSecret: JWT_SECRET,
  minioEndpoint: MINIO_ENDPOINT,
  minioAccessKey: MINIO_ACCESS_KEY,
  minioSecretKey: MINIO_SECRET_KEY,
  redisUrl: REDIS_URL,
  smtpHost: SMTP_HOST,
  smtpPort: SMTP_PORT,
  smtpSecure: SMTP_SECURE,
  smtpUser: SMTP_USER,
  smtpPass: SMTP_PASS,
  smtpFrom: SMTP_FROM,
  port: PORT,
  lifecycleCronIntervalMs: LIFECYCLE_CRON_INTERVAL_MS,
} as const;

export default config;
