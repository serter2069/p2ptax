import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "./config";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "15m", algorithm: "HS256" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function generateOtpCode(): string {
  if (config.nodeEnv === "development") {
    return "000000";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}
