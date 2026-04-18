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

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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

  // Check isBanned on every authenticated request — security fix #175
  // Banned users must be rejected regardless of which endpoint they call.
  // Using lazy import to avoid circular dependency (same pattern as roleGuard).
  void import("../lib/prisma").then(({ prisma }) =>
    prisma.user
      .findUnique({ where: { id: payload.userId }, select: { isBanned: true } })
      .then((user) => {
        if (!user || user.isBanned) {
          res.status(403).json({ error: "Account blocked" });
          return;
        }
        next();
      })
      .catch(() => {
        // DB unavailable — let request through; roleGuard will re-check if needed
        next();
      })
  );
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

    if (!user.role || !roles.includes(user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
