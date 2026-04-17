import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  generateRefreshToken,
  generateOtpCode,
} from "../lib/jwt";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// POST /api/auth/request-otp
router.post("/request-otp", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });

    // In production: send email via nodemailer
    // In dev: code is always 000000
    console.log(`[DEV] OTP for ${email}: ${code}`);

    res.json({
      message: "OTP sent",
      dev_code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("request-otp error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req: Request, res: Response) => {
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

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: email.toLowerCase() },
      });
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
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
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
    });
  } catch (error) {
    console.error("refresh error:", error);
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
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
