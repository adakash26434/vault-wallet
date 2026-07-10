import { Router } from "express";
import { db, passwordsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListPasswordsQueryParams,
  CreatePasswordBody,
  GetPasswordParams,
  UpdatePasswordParams,
  UpdatePasswordBody,
  DeletePasswordParams,
} from "@workspace/api-zod";
import { encryptField, decryptField } from "../lib/crypto.js";

const router = Router();

function computeStrength(password: string): "weak" | "medium" | "strong" {
  if (password.length < 8) return "weak";

  // Check for common weak passwords
  const lower = password.toLowerCase();
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon'];
  if (commonPasswords.some(p => lower.includes(p))) return "weak";

  // Check for sequential characters (e.g., abc, 123, qwert)
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    return "weak";
  }

  // Check for repeated characters (e.g., aaa, 111)
  if (/(.)\1{2,}/.test(password)) return "weak";

  // Check for keyboard patterns
  if (/qwertyuiop|asdfghjkl|zxcvbnm/i.test(password)) return "weak";

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  // Length bonus
  const lengthBonus = password.length >= 14 ? 2 : password.length >= 10 ? 1 : 0;
  const finalScore = score + lengthBonus;

  if (finalScore >= 4 && password.length >= 10) return "strong";
  if (finalScore >= 3) return "medium";
  return "weak";
}

/** Decrypt sensitive fields from a DB row before returning to client. */
function decryptRow(r: typeof passwordsTable.$inferSelect) {
  return {
    ...r,
    password: decryptField(r.password) ?? "",
    username: decryptField(r.username),
    url: decryptField(r.url),
    notes: decryptField(r.notes),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// GET /passwords — list current user's passwords with filtering
router.get("/passwords", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = ListPasswordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { search, category, owner } = parsed.data as { search?: string; category?: string; owner?: string };

  // Build userId filter condition
  const userIdCondition = eq(passwordsTable.userId, userId);

  // Fetch rows for this user only — title is not encrypted so we can DB-filter on it
  // username/url are encrypted so we filter those in-app after decryption
  let rows = await db
    .select()
    .from(passwordsTable)
    .where(
      search && category
        ? and(userIdCondition)
        : search
        ? and(userIdCondition, ilike(passwordsTable.title, `%${search}%`))
        : category
        ? and(userIdCondition, eq(passwordsTable.category, category))
        : userIdCondition
    );

  const decrypted = rows.map(decryptRow);

  // In-app filter when both search + category, or when we need to search encrypted fields
  let filtered = decrypted;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.username?.toLowerCase().includes(q)) ||
        (r.url?.toLowerCase().includes(q))
    );
  }
  if (category) {
    filtered = filtered.filter((r) => r.category === category);
  }
  if (owner) {
    filtered = filtered.filter((r) => r.owner === owner);
  }

  return res.json(filtered);
});

// POST /passwords — create a new password for current user
router.post("/passwords", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreatePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { title, username, password, url, category, notes, owner } = parsed.data as any;
  const strength = computeStrength(password);

  const [row] = await db
    .insert(passwordsTable)
    .values({
      userId,
      title,
      username: encryptField(username) ?? "",
      password: encryptField(password) ?? "",
      url: encryptField(url) ?? undefined,
      category: category ?? "General",
      notes: encryptField(notes) ?? undefined,
      strength,
      owner: owner ?? "Me",
    })
    .returning();

  return res.status(201).json(decryptRow(row));
});

// GET /passwords/match — find passwords matching a domain for current user
router.get("/passwords/match", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const domain = req.query.domain as string;
  if (!domain) return res.status(400).json({ error: "domain required" });

  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();

  const baseMatch = cleanDomain.split(".")[0];
  const rows = await db
    .select()
    .from(passwordsTable)
    .where(and(
      eq(passwordsTable.userId, userId),
      ilike(passwordsTable.title, `%${baseMatch}%`)
    ));

  const decrypted = rows.map(decryptRow);

  // Filter decrypted results for actual domain match
  const matched = decrypted.filter((r) => {
    if (!r.url) return r.title.toLowerCase().includes(baseMatch);
    const rowDomain = r.url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase();
    return rowDomain.includes(cleanDomain) || cleanDomain.includes(rowDomain.split(".")[0]);
  });

  return res.json(matched);
});

// GET /passwords/stats — get password statistics for current user
router.get("/passwords/stats", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select()
    .from(passwordsTable)
    .where(eq(passwordsTable.userId, userId));

  const counts = { weak: 0, medium: 0, strong: 0 };
  rows.forEach((r) => { counts[r.strength]++; });

  const decrypted = rows.map(decryptRow);

  // Duplicate detection on decrypted passwords
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  decrypted.forEach((r) => {
    if (seen.has(r.password)) duplicates.add(r.password);
    else seen.add(r.password);
  });

  return res.json({
    total: rows.length,
    weak: counts.weak,
    medium: counts.medium,
    strong: counts.strong,
    reused: duplicates.size,
  });
});

// GET /passwords/:id — get a specific password (only if owned by current user)
router.get("/passwords/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = GetPasswordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select()
    .from(passwordsTable)
    .where(and(eq(passwordsTable.id, parsed.data.id), eq(passwordsTable.userId, userId)));
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json(decryptRow(row));
});

// PATCH /passwords/:id — update a password (only if owned by current user)
router.patch("/passwords/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const paramsParsed = UpdatePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdatePasswordBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const data = bodyParsed.data;

  const anyData = data as any;
  if (anyData.title !== undefined) updates.title = anyData.title;
  if (anyData.category !== undefined) updates.category = anyData.category;
  if (anyData.username !== undefined) updates.username = encryptField(anyData.username);
  if (anyData.url !== undefined) updates.url = encryptField(anyData.url);
  if (anyData.notes !== undefined) updates.notes = encryptField(anyData.notes);
  if (anyData.owner !== undefined) updates.owner = anyData.owner;
  if (anyData.password !== undefined) {
    updates.password = encryptField(anyData.password);
    updates.strength = computeStrength(anyData.password);
  }

  const [row] = await db
    .update(passwordsTable)
    .set(updates)
    .where(and(eq(passwordsTable.id, paramsParsed.data.id), eq(passwordsTable.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(decryptRow(row));
});

// DELETE /passwords/:id — delete a password (only if owned by current user)
router.delete("/passwords/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = DeletePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [deleted] = await db
    .delete(passwordsTable)
    .where(and(eq(passwordsTable.id, parsed.data.id), eq(passwordsTable.userId, userId)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
});

export default router;
