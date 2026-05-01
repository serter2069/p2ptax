import rateLimit, { Options } from "express-rate-limit";
import type { Request } from "express";

/**
 * Rate-limiting middleware for auth and general API endpoints.
 *
 * Uses the in-memory store from express-rate-limit (default). This is
 * adequate for single-instance dev/staging. For prod multi-instance, swap
 * in `rate-limit-redis` so counters are shared across pods.
 *
 * Limiters that gate per-account flows (OTP request/verify) hash on
 * `req.ip + req.body?.email` so abuse from one IP cycling many emails
 * does not exhaust a single legitimate user's budget — and vice versa.
 *
 * All limiters return:
 *   { error: "Слишком много попыток. Попробуйте через несколько минут." }
 * with status 429, plus `Retry-After` header (standardHeaders enabled).
 *
 * Smoke tests (metro-map / synthetic monitoring) bypass via
 * `x-smoke-test: metromap` header to avoid false 429s in dashboards.
 */

const RUSSIAN_429_MESSAGE = {
  error: "Слишком много попыток. Попробуйте через несколько минут.",
};

const skipSmoke = (req: Request) => req.headers["x-smoke-test"] === "metromap";

/**
 * Per-IP+email key generator for OTP-style endpoints. Falls back to IP
 * alone when no email is in the body (e.g. malformed request) so abusive
 * clients still get rate-limited rather than slipping through unkeyed.
 */
function ipEmailKey(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const rawEmail =
    req.body && typeof (req.body as { email?: unknown }).email === "string"
      ? ((req.body as { email: string }).email).trim().toLowerCase()
      : "";
  return rawEmail ? `${ip}|${rawEmail}` : ip;
}

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  message: RUSSIAN_429_MESSAGE,
  skip: skipSmoke,
};

/**
 * OTP code request — 3 per 15 min per (IP + email).
 *
 * Rationale: legitimate users almost never need >1 code per 15 min; the
 * resend-cooldown UI already enforces 60s on the client. This budget
 * tolerates one client retry plus an honest mistake but stops scripted
 * email-spam attacks.
 */
export const otpRequestLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 3,
  keyGenerator: ipEmailKey,
});

/**
 * OTP code verification — 5 attempts per 15 min per (IP + email).
 *
 * Codes are 6-digit (1M space). 5 attempts/15min keeps brute-force
 * probability negligible (5/1M = 0.0005 % chance) while still allowing
 * fat-fingered humans to retry.
 */
export const otpVerifyLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: ipEmailKey,
});

/**
 * Login-ish endpoints — 10 per hour per IP. Catch-all for any future
 * password / SSO / refresh-style entry points. Token refresh has its own
 * tighter limiter inside `routes/auth.ts` (5/min).
 */
export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

/**
 * Global API fallback — 200 per 15 min per IP. Mounted on `/api/`. Sized
 * generously so normal browsing (catalog + chat polling) does not trip it
 * but pathological scrapers do.
 */
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 200,
});
