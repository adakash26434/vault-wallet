import { Router } from "express";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
const QRCode = require("qrcode") as typeof import("qrcode");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _otplib = require("otplib") as any;
const otpGenerateSecret: () => string = _otplib.generateSecret;
const otpGenerateURI: (opts: Record<string, unknown>) => string = _otplib.generateURI;
const otpVerify: (opts: { token: string; secret: string }) => boolean = _otplib.verify;
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { encryptField, decryptField } from "../lib/crypto.js";
import { randomUUID } from "node:crypto";

const router = Router();

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-prod";
const TEMP_TOKEN_EXPIRY = "10m";
const SESSION_EXPIRY = "7d";
const APP_NAME = "PersonalKeyWallet";

const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).optional(),
});

const VerifySetupBody = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const VerifyBody = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
});

function signTemp(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TEMP_TOKEN_EXPIRY });
}

function signSession(userId: number, tokenId: string) {
  return jwt.sign({ userId, type: "session", jti: tokenId }, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
}

export function verifyToken(token: string): { userId: number; type: string; jti?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; type: string; jti?: string };
  } catch {
    return null;
  }
}

function parseDevice(userAgent?: string): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  let device = "Desktop";
  if (ua.includes("iphone")) device = "iPhone";
  else if (ua.includes("ipad")) device = "iPad";
  else if (ua.includes("android") && ua.includes("mobile")) device = "Android Phone";
  else if (ua.includes("android")) device = "Android Tablet";
  let browser = "Browser";
  if (ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opr") || ua.includes("opera")) browser = "Opera";
  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") && !ua.includes("iphone") && !ua.includes("ipad")) os = "macOS";
  else if (ua.includes("linux") && !ua.includes("android")) os = "Linux";
  return os ? `${browser} on ${device === "Desktop" ? os : device}` : `${browser} on ${device}`;
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }
  const { email, password, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing.length > 0) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const totpSecret = otpGenerateSecret();
  const encryptedTotpSecret = encryptField(totpSecret) ?? totpSecret;

  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase(), passwordHash, totpSecret: encryptedTotpSecret, name, totpEnabled: false })
    .returning();

  const totpUri = otpGenerateURI({ type: "totp", label: `${APP_NAME}:${email}`, secret: totpSecret, issuer: APP_NAME });
  const qrCodeDataUrl = await QRCode.toDataURL(totpUri);

  const tempToken = signTemp({ userId: user.id, type: "setup" });

  return res.status(201).json({
    tempToken,
    qrCodeDataUrl,
    manualKey: totpSecret,
    message: "Scan the QR code with Google Authenticator, then verify with your first code.",
  });
});

router.post("/auth/verify-setup", async (req, res) => {
  const parsed = VerifySetupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { tempToken, code } = parsed.data;

  const payload = verifyToken(tempToken);
  if (!payload || payload.type !== "setup") {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user || !user.totpSecret) {
    return res.status(400).json({ error: "User not found" });
  }

  const plainSecret = decryptField(user.totpSecret) ?? user.totpSecret;
  const isValid = otpVerify({ token: code, secret: plainSecret });
  if (!isValid) {
    return res.status(400).json({ error: "Invalid 2FA code. Please check your authenticator app." });
  }

  await db.update(usersTable).set({ totpEnabled: true }).where(eq(usersTable.id, user.id));

  const tokenId = randomUUID();
  const sessionToken = signSession(user.id, tokenId);

  await db.insert(sessionsTable).values({
    userId: user.id,
    tokenId,
    userAgent: req.headers["user-agent"],
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown",
  });

  return res.json({
    token: sessionToken,
    user: { id: user.id, email: user.email, name: user.name, totpEnabled: true },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.totpEnabled) {
    return res.status(403).json({ error: "2FA setup not complete. Please complete setup first." });
  }

  const tempToken = signTemp({ userId: user.id, type: "verify" });

  return res.json({
    tempToken,
    message: "Enter the code from your Google Authenticator app.",
  });
});

router.post("/auth/verify", async (req, res) => {
  const parsed = VerifyBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { tempToken, code } = parsed.data;

  const payload = verifyToken(tempToken);
  if (!payload || payload.type !== "verify") {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user || !user.totpSecret) {
    return res.status(400).json({ error: "User not found" });
  }

  const plainSecret2 = decryptField(user.totpSecret) ?? user.totpSecret;
  const isValid = otpVerify({ token: code, secret: plainSecret2 });
  if (!isValid) {
    return res.status(400).json({ error: "Invalid 2FA code. Please check your authenticator app." });
  }

  const tokenId = randomUUID();
  const sessionToken = signSession(user.id, tokenId);

  await db.insert(sessionsTable).values({
    userId: user.id,
    tokenId,
    userAgent: req.headers["user-agent"],
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown",
  });

  return res.json({
    token: sessionToken,
    user: { id: user.id, email: user.email, name: user.name, totpEnabled: true },
  });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) return res.status(401).json({ error: "User not found" });

  return res.json({
    id: user.id, email: user.email, name: user.name, totpEnabled: user.totpEnabled,
    phone: user.phone, dateOfBirth: user.dateOfBirth, bio: user.bio,
    address: user.address, avatarColor: user.avatarColor, avatarUrl: user.avatarUrl,
  });
});

const ProfileUpdateBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bio: z.string().optional(),
  address: z.string().optional(),
  avatarColor: z.string().optional(),
  avatarUrl: z.string().optional(),
});

router.patch("/auth/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = ProfileUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.dateOfBirth !== undefined) updateData.dateOfBirth = parsed.data.dateOfBirth;
  if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.avatarColor !== undefined) updateData.avatarColor = parsed.data.avatarColor;
  if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, payload.userId)).returning();
  if (!updated) return res.status(404).json({ error: "User not found" });

  return res.json({
    id: updated.id, email: updated.email, name: updated.name, totpEnabled: updated.totpEnabled,
    phone: updated.phone, dateOfBirth: updated.dateOfBirth, bio: updated.bio,
    address: updated.address, avatarColor: updated.avatarColor, avatarUrl: updated.avatarUrl,
  });
});

const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

router.post("/auth/change-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) return res.status(401).json({ error: "User not found" });

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));

  return res.json({ message: "Password changed successfully" });
});

// GET /auth/sessions — list active sessions for current user
router.get("/auth/sessions", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") return res.status(401).json({ error: "Unauthorized" });

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, payload.userId), eq(sessionsTable.isActive, true)));

  const currentJti = payload.jti;

  return res.json(
    sessions
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
      .map((s) => ({
        id: s.id,
        device: parseDevice(s.userAgent || undefined),
        ip: s.ip,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
        isCurrent: s.tokenId === currentJti,
      }))
  );
});

// DELETE /auth/sessions/:id — revoke a specific session
router.delete("/auth/sessions/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") return res.status(401).json({ error: "Unauthorized" });

  const sessionId = Number(req.params.id);
  if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session id" });

  await db
    .update(sessionsTable)
    .set({ isActive: false })
    .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, payload.userId)));

  return res.status(204).send();
});

// DELETE /auth/sessions — logout all OTHER sessions (keep current)
router.delete("/auth/sessions", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.type !== "session") return res.status(401).json({ error: "Unauthorized" });

  const sessions = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.userId, payload.userId), eq(sessionsTable.isActive, true)));

  const othersIds = sessions
    .filter((s) => s.tokenId !== payload.jti)
    .map((s) => s.id);

  for (const id of othersIds) {
    await db.update(sessionsTable).set({ isActive: false }).where(eq(sessionsTable.id, id));
  }

  return res.status(204).send();
});

router.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const payload = verifyToken(token);
    if (payload?.jti) {
      await db
        .update(sessionsTable)
        .set({ isActive: false })
        .where(eq(sessionsTable.tokenId, payload.jti));
    }
  }
  return res.status(204).send();
});

export default router;
