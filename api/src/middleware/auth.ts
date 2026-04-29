import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtPayload } from "../lib/jwt";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;

  // Check isBanned + deletedAt on every authenticated request.
  // Banned users must be rejected regardless of which endpoint they call (#175).
  // Soft-deleted users must be force-signed-out (deletedAt sets isBanned=true,
  // but we explicitly check deletedAt so the error message is more honest).
  // Using lazy import to avoid circular dependency (same pattern as roleGuard).
  try {
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isBanned: true, deletedAt: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.deletedAt) {
      res.status(401).json({ error: "Account deleted" });
      return;
    }
    if (user.isBanned) {
      res.status(403).json({ error: "Account blocked" });
      return;
    }
  } catch {
    // DB unavailable — let request through; roleGuard will re-check if needed
  }

  next();
}

export function roleGuard(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Import prisma lazily to avoid circular deps
    const { prisma } = await import("../lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, isBanned: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: "Account blocked" });
      return;
    }

    const effectiveRoles: Role[] = user.role ? [user.role] : [];

    if (!roles.some((r) => effectiveRoles.includes(r))) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

/**
 * Iter11 — specialist features guard.
 *
 * After the CLIENT/SPECIALIST -> USER unification, specialist features are opt-in
 * via `User.isSpecialist` + `specialistProfileCompletedAt`. This middleware
 * replaces the old `roleGuard("SPECIALIST")` call sites — it checks the flag
 * instead of the retired enum value.
 *
 * Usage: `router.use(authMiddleware, requireSpecialistFeatures);`
 */
export async function requireSpecialistFeatures(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { prisma } = await import("../lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isSpecialist: true, specialistProfileCompletedAt: true, isBanned: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ error: "Account blocked" });
    return;
  }

  if (!user.isSpecialist) {
    res.status(403).json({ error: "Specialist features not enabled" });
    return;
  }

  next();
}

// ─── Permission helpers (pure — no Express dependency) ──────────────────

type UserPermissionShape = {
  role: Role | null;
  isSpecialist: boolean;
  specialistProfileCompletedAt: Date | null;
};

/**
 * Can the user start new threads with clients (write to a public request)?
 * Only completed-onboarding specialists. Checked via the `isSpecialist`
 * flag + `specialistProfileCompletedAt` timestamp.
 */
export function canWriteThreads(user: UserPermissionShape | null): boolean {
  if (!user) return false;
  return user.isSpecialist && user.specialistProfileCompletedAt !== null;
}

/**
 * Can the user create their own tax help requests? Iter11 widens this —
 * every USER can create requests, including specialists (they may need help
 * on their personal taxes, for example).
 */
export function canCreateRequests(user: UserPermissionShape | null): boolean {
  if (!user) return false;
  return user.role === "USER";
}

/**
 * Can the user browse the public feed of specialist leads? Iter11 keeps this
 * specialist-gated because the feed is where specialists find work.
 */
export function canSeePublicFeed(user: UserPermissionShape | null): boolean {
  if (!user) return false;
  return user.isSpecialist;
}

/** Admin-only actions. */
export function canManageAll(user: UserPermissionShape | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN";
}
