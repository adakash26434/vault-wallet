import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../routes/auth.js";
import { db, sessionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      sessionTokenId?: string;
    }
  }
}

/**
 * Express middleware that enforces a valid session JWT.
 * Also verifies the session is still active in the DB (supports force-logout).
 * Attaches req.userId and req.sessionTokenId for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    return;
  }

  // If token has a jti, verify the session is still active in DB
  if (payload.jti) {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.tokenId, payload.jti), eq(sessionsTable.isActive, true)));

    if (!session) {
      res.status(401).json({ error: "Session has been revoked. Please log in again." });
      return;
    }

    // Update lastSeenAt (fire and forget — don't await to keep latency low)
    db.update(sessionsTable)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessionsTable.tokenId, payload.jti))
      .catch(() => {});
  }

  req.userId = payload.userId;
  req.sessionTokenId = payload.jti;
  next();
}
