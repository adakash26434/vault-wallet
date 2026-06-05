import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../routes/auth.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Express middleware that enforces a valid session JWT.
 * Attaches req.userId for downstream handlers.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
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

  req.userId = payload.userId;
  next();
}
