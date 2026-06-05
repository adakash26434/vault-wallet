import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const helmet = require("helmet") as typeof import("helmet").default;
const rateLimit = require("express-rate-limit") as typeof import("express-rate-limit");
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disabled because we're behind a proxy
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ───────────────────────────────────────────────────────────────────
// In production, restrict to Replit domains. In dev, allow all.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / curl
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").map((d) => d.trim());
      const allowed = domains.some((d) => d && origin.endsWith(d));
      callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
    },
    credentials: true,
  })
);

// ── Rate limiting on auth endpoints (brute-force protection) ───────────────
const authLimiter = rateLimit.default({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait 15 minutes before trying again." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/verify", authLimiter);
app.use("/api/auth/verify-setup", authLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Request logging ────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api", router);

export default app;
