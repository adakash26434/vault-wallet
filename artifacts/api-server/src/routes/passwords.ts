import { Router } from "express";
import { db, passwordsTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
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
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3 && password.length >= 12) return "strong";
  if (score >= 2) return "medium";
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

router.get("/passwords", async (req, res) => {
  const parsed = ListPasswordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { search, category } = parsed.data;

  // Fetch rows — title is not encrypted so we can still DB-filter on it.
  // username/url are encrypted so we filter those in-app after decryption.
  let rows = await db
    .select()
    .from(passwordsTable)
    .where(
      search && category
        ? undefined // fetch all, filter below
        : search
        ? ilike(passwordsTable.title, `%${search}%`)
        : category
        ? eq(passwordsTable.category, category)
        : undefined
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

  return res.json(filtered);
});

router.post("/passwords", async (req, res) => {
  const parsed = CreatePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { title, username, password, url, category, notes } = parsed.data;
  const strength = computeStrength(password);

  const [row] = await db
    .insert(passwordsTable)
    .values({
      title,
      username: encryptField(username) ?? "",
      password: encryptField(password) ?? "",
      url: encryptField(url) ?? undefined,
      category: category ?? "General",
      notes: encryptField(notes) ?? undefined,
      strength,
    })
    .returning();

  return res.status(201).json(decryptRow(row));
});

router.get("/passwords/match", async (req, res) => {
  const domain = req.query.domain as string;
  if (!domain) return res.status(400).json({ error: "domain required" });

  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();

  const rows = await db.select().from(passwordsTable);
  const decrypted = rows.map(decryptRow);

  const matched = decrypted.filter((r) => {
    if (!r.url) return r.title.toLowerCase().includes(cleanDomain.split(".")[0]);
    const rowDomain = r.url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase();
    return rowDomain.includes(cleanDomain) || cleanDomain.includes(rowDomain.split(".")[0]);
  });

  return res.json(matched);
});

router.get("/passwords/stats", async (req, res) => {
  const rows = await db.select().from(passwordsTable);
  const decrypted = rows.map(decryptRow);

  const counts = { weak: 0, medium: 0, strong: 0 };
  rows.forEach((r) => { counts[r.strength]++; });

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

router.get("/passwords/:id", async (req, res) => {
  const parsed = GetPasswordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [row] = await db
    .select()
    .from(passwordsTable)
    .where(eq(passwordsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json(decryptRow(row));
});

router.patch("/passwords/:id", async (req, res) => {
  const paramsParsed = UpdatePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdatePasswordBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const data = bodyParsed.data;

  if (data.title !== undefined) updates.title = data.title;
  if (data.category !== undefined) updates.category = data.category;
  if (data.username !== undefined) updates.username = encryptField(data.username);
  if (data.url !== undefined) updates.url = encryptField(data.url);
  if (data.notes !== undefined) updates.notes = encryptField(data.notes);
  if (data.password !== undefined) {
    updates.password = encryptField(data.password);
    updates.strength = computeStrength(data.password);
  }

  const [row] = await db
    .update(passwordsTable)
    .set(updates)
    .where(eq(passwordsTable.id, paramsParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(decryptRow(row));
});

router.delete("/passwords/:id", async (req, res) => {
  const parsed = DeletePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(passwordsTable).where(eq(passwordsTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
