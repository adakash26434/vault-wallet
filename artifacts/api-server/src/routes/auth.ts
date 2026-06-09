import { Router } from "express";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
const QRCode = require("qrcode") as typeof import("qrcode");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// otplib v13 — no authenticator sub-object; use top-level functions directly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _otplib = require("otplib") as any;
const otpGenerateSecret: () => string = _otplib.generateSecret;
const otpGenerateURI: (opts: Record<string, unknown>) => string = _otplib.generateURI;
const otpVerify: (opts: { token: string; secret: string }) => boolean = _otplib.verify;
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { encryptField, decryptField } from "../lib/crypto.js";

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

function signSession(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
}

export function verifyToken(token: string): { userId: number; type: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; type: string };
  } catch {
    return null;
  }
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

  const sessionToken = signSession({ userId: user.id, type: "session" });

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

  const sessionToken = signSession({ userId: user.id, type: "session" });

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

  return res.json({ id: user.id, email: user.email, name: user.name, totpEnabled: user.totpEnabled });
});

router.post("/auth/logout", (_req, res) => {
  return res.status(204).send();
});

export default router;
