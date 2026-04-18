import jwt from "jsonwebtoken";
import crypto from "crypto";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "dev-secret-change-in-production";
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function generateOtpCode(): string {
  if (process.env.NODE_ENV === "development") {
    return "000000";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}
