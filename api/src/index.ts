import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import messagesRoutes from "./routes/messages";
import onboardingRoutes from "./routes/onboarding";
import referenceRoutes from "./routes/reference";

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
app.use("/api", referenceRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
