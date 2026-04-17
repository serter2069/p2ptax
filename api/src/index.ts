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
import { startNotificationWorker } from "./notifications/notification.processor";

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  // Start BullMQ worker (graceful degradation if Valkey unavailable)
  startNotificationWorker();
});
