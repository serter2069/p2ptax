import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  generateRefreshToken,
  generateOtpCode,
} from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";
import { presignAvatarUrl } from "../lib/minio";
import {
  otpRequestLimiter,
  otpVerifyLimiter,
} from "../middleware/rateLimit";

const router = Router();

// Token refresh has its own tighter window — kept inline because the limit
// (5/min/IP) is specific to token rotation and not reused elsewhere.
const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов обновления токена. Попробуйте через минуту." },
});

// POST /api/auth/request-otp
router.post("/request-otp", otpRequestLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    // Find or create user (no role yet — assigned during onboarding)
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: email.toLowerCase() },
      });
    }

    if (user.isBanned) {
      res.status(403).json({ error: "Account blocked" });
      return;
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete previous unused OTPs for this email
    await prisma.otpCode.deleteMany({
      where: { email: email.toLowerCase(), used: false },
    });

    await prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // In production: send email via nodemailer
    // Dev OTP: always 000000 (see auth.md)

    res.json({ success: true });
  } catch (error) {
    console.error("request-otp error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", otpVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find user (created in request-otp)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        role: true,
        isSpecialist: true,
        isAvailable: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        specialistProfileCompletedAt: true,
      },
    });

    if (!user) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshTokenValue = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    res.json({
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isSpecialist: user.isSpecialist,
        isAvailable: user.isAvailable,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: await presignAvatarUrl(user.avatarUrl),
        specialistProfileCompletedAt: user.specialistProfileCompletedAt
          ? user.specialistProfileCompletedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", refreshRateLimiter, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isSpecialist: true,
            isAvailable: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            specialistProfileCompletedAt: true,
            isBanned: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Token rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newAccessToken = signAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    });
    const newRefreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        isSpecialist: storedToken.user.isSpecialist,
        isAvailable: storedToken.user.isAvailable,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        avatarUrl: await presignAvatarUrl(storedToken.user.avatarUrl),
        specialistProfileCompletedAt: storedToken.user.specialistProfileCompletedAt
          ? storedToken.user.specialistProfileCompletedAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/heartbeat — update lastSeenAt for presence tracking
router.post("/heartbeat", authMiddleware, async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { lastSeenAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("heartbeat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.user!.userId },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isSpecialist: true,
        specialistProfileCompletedAt: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isAvailable: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: { ...user, avatarUrl: await presignAvatarUrl(user.avatarUrl) } });
  } catch (error) {
    console.error("me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/set-role — set role for new users (auth required, one-time only)
//
// Accepts role tokens:
//   - "CLIENT" / "USER" -> role=CLIENT, isSpecialist=false
//   - "SPECIALIST"      -> role=CLIENT, isSpecialist=true
router.post("/set-role", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { role } = req.body;

    const ALLOWED_TOKENS = new Set(["CLIENT", "SPECIALIST", "USER"]);
    const roleToken: string | undefined = role;
    if (!roleToken || !ALLOWED_TOKENS.has(roleToken)) {
      res.status(400).json({ error: "Role must be CLIENT or SPECIALIST" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Guard: role can only be set once
    if (user.role !== null) {
      res.status(400).json({ error: "Role already set" });
      return;
    }

    const wantsSpecialist = roleToken === "SPECIALIST";

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "USER",
        isSpecialist: wantsSpecialist,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isSpecialist: true,
        firstName: true,
        lastName: true,
      },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("set-role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
