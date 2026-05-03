import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "./config";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  // 1h access token (was 15m). Why: shorter TTL meant the FE refreshed
  // ~4× more often, and every parallel refresh races the previous token's
  // rotation slot — the loser of the race got a 401 and the user got
  // logged out. 1h reduces refresh frequency to roughly the proactive
  // 12-min timer's cadence (still well below the 30-day refresh-token
  // lifetime), and the single-flight refresh manager handles the rest.
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "1h", algorithm: "HS256" });
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
