import dotenv from "dotenv";
dotenv.config();

import { validateConfig, config } from "./lib/config";
validateConfig();

import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import { startNotificationWorker } from "./notifications/notification.processor";
import { runRequestLifecycleCron } from "./cron/requestLifecycle";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:8081" }));
app.use(express.json({ limit: "1mb" }));

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
app.use("/api", contactsRoutes);

// 404 handler — no matching route
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

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
