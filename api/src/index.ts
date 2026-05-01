import dotenv from "dotenv";
dotenv.config();

// Sentry must be initialised BEFORE any other module imports it implicitly
// (express, prisma, etc.) so its async-hooks-based instrumentation can wrap
// outgoing requests and DB queries. Graceful no-op if SENTRY_DSN is missing
// — local dev without a key keeps working.
import * as Sentry from "@sentry/node";
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
  });
  // Surface unhandled async failures into Sentry. Node's default behaviour
  // (warning, then exit on `unhandledRejection` in newer versions) still
  // applies — this just makes sure the event reaches Sentry first.
  process.on("uncaughtException", (err) => {
    Sentry.captureException(err);
  });
  process.on("unhandledRejection", (reason) => {
    Sentry.captureException(reason);
  });
} else {
  console.warn("[sentry] SENTRY_DSN not set — error reporting disabled");
}

import { validateConfig, config } from "./lib/config";
validateConfig();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { minioClient, MINIO_BUCKET } from "./lib/minio";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import messagesRoutes from "./routes/messages";
import onboardingRoutes from "./routes/onboarding";
import specialistsRoutes from "./routes/specialists";
import requestsRoutes from "./routes/requests";
import referenceRoutes from "./routes/reference";
import dashboardRoutes from "./routes/dashboard";
import userRoutes from "./routes/user";
import specialistRoutes from "./routes/specialist";
import threadsRoutes from "./routes/threads";
import adminRoutes from "./routes/admin";
import notificationsRoutes from "./routes/notifications";
import contactsRoutes from "./routes/contacts";
import statsRoutes from "./routes/stats";
import savedSpecialistsRoutes from "./routes/saved-specialists";
import accountRoutes from "./routes/account";
import { startNotificationWorker } from "./notifications/notification.processor";
import { runRequestLifecycleCron } from "./cron/requestLifecycle";
import { apiLimiter } from "./middleware/rateLimit";

const app = express();

app.use(helmet({
  // Allow cross-origin image/file loading (avatars, chat attachments).
  // Without this, helmet's default CORP: same-origin blocks <img> from other origins.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : [/^http:\/\/localhost:(8081|8082)$/] }));
app.use(express.json({ limit: "1mb" }));

// Global API fallback rate limit. Applied to the whole `/api/` surface
// AFTER body parsing so per-route limiters mounted further down (which
// hash on `req.body.email`) get a populated body. Per-endpoint limiters
// inside `routes/auth.ts` run first within each route and provide
// stricter budgets where needed.
app.use("/api/", apiLimiter);

// Proxy MinIO objects at /<bucket>/<key> so that avatarUrls stored as
// http://localhost:3812/p2ptax/... load correctly in dev.
app.get(`/${MINIO_BUCKET}/*`, async (req, res) => {
  const key = req.path.slice(`/${MINIO_BUCKET}/`.length);
  if (!key) { res.status(404).json({ error: "Not found" }); return; }
  try {
    const stream = await minioClient.getObject(MINIO_BUCKET, key);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400");
    stream.pipe(res);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/specialists", specialistsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api", referenceRoutes);
// Register /api/stats BEFORE contactsRoutes — contactsRoutes is mounted at
// /api with a global authMiddleware, which incorrectly auth-protects any
// later /api/* handlers passing through it.
app.use("/api/stats", statsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/specialist", specialistRoutes);
app.use("/api/threads", threadsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/saved-specialists", savedSpecialistsRoutes);
app.use("/api/account", accountRoutes);
app.use("/api", contactsRoutes);

// 404 handler — no matching route
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Sentry error handler MUST come before any other error middleware so it
// captures the original Error instance with its stack. No-op when DSN is
// not configured. v10 API: `setupExpressErrorHandler` registers itself.
if (SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler (Express signature requires 4 params)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled-error]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  // Start BullMQ worker (graceful degradation if Valkey unavailable)
  startNotificationWorker();
  // Request lifecycle cron: runs every hour (bug #174 fix: email before deactivate)
  runRequestLifecycleCron().catch((err) => console.error("[lifecycle] Initial cron run failed:", err));
  setInterval(() => {
    runRequestLifecycleCron().catch((err) => console.error("[lifecycle] Cron run failed:", err));
  }, config.lifecycleCronIntervalMs);
});
