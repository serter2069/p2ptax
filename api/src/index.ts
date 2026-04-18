import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
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
import { startNotificationWorker } from "./notifications/notification.processor";
import { runRequestLifecycleCron } from "./cron/requestLifecycle";

const app = express();
const PORT = process.env.PORT || 3812;

app.use(cors());
app.use(express.json());

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/specialist", specialistRoutes);
app.use("/api/threads", threadsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api", contactsRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  // Start BullMQ worker (graceful degradation if Valkey unavailable)
  startNotificationWorker();
  // Request lifecycle cron: runs every hour (bug #174 fix: email before deactivate)
  const CRON_INTERVAL_MS = parseInt(process.env.LIFECYCLE_CRON_INTERVAL_MS || "3600000", 10);
  runRequestLifecycleCron().catch((err) => console.error("[lifecycle] Initial cron run failed:", err));
  setInterval(() => {
    runRequestLifecycleCron().catch((err) => console.error("[lifecycle] Cron run failed:", err));
  }, CRON_INTERVAL_MS);
});
