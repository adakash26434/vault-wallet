import { Router } from "express";
import { db, passwordsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListPasswordsQueryParams,
  CreatePasswordBody,
  GetPasswordParams,
  UpdatePasswordParams,
  UpdatePasswordBody,
  DeletePasswordParams,
} from "@workspace/api-zod";

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

router.get("/passwords", async (req, res) => {
  const parsed = ListPasswordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { search, category } = parsed.data;

  let query = db.select().from(passwordsTable).$dynamic();

  const conditions: ReturnType<typeof ilike>[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(passwordsTable.title, `%${search}%`),
        ilike(passwordsTable.username, `%${search}%`),
        ilike(passwordsTable.url, `%${search}%`)
      ) as ReturnType<typeof ilike>
    );
  }
  if (category) {
    conditions.push(eq(passwordsTable.category, category) as unknown as ReturnType<typeof ilike>);
  }

  const rows = await db
    .select()
    .from(passwordsTable)
    .where(
      search && category
        ? or(
            ilike(passwordsTable.title, `%${search}%`),
            ilike(passwordsTable.username, `%${search}%`)
          )
        : search
        ? or(
            ilike(passwordsTable.title, `%${search}%`),
            ilike(passwordsTable.username, `%${search}%`)
          )
        : category
        ? eq(passwordsTable.category, category)
        : undefined
    );

  return res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
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
    .values({ title, username, password, url, category: category ?? "General", notes, strength })
    .returning();

  return res.status(201).json({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.get("/passwords/match", async (req, res) => {
  const domain = req.query.domain as string;
  if (!domain) return res.status(400).json({ error: "domain required" });

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();

  const rows = await db.select().from(passwordsTable);
  const matched = rows.filter((r) => {
    if (!r.url) return r.title.toLowerCase().includes(cleanDomain.split(".")[0]);
    const rowDomain = r.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
    return rowDomain.includes(cleanDomain) || cleanDomain.includes(rowDomain.split(".")[0]);
  });

  return res.json(
    matched.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
});

router.get("/passwords/stats", async (req, res) => {
  const rows = await db.select().from(passwordsTable);
  const passwords = rows.map((r) => r.password);
  const counts = { weak: 0, medium: 0, strong: 0 };
  rows.forEach((r) => { counts[r.strength]++; });
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  passwords.forEach((p) => {
    if (seen.has(p)) duplicates.add(p);
    else seen.add(p);
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

  const [row] = await db.select().from(passwordsTable).where(eq(passwordsTable.id, parsed.data.id));
  if (!row) return res.status(404).json({ error: "Not found" });

  return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.patch("/passwords/:id", async (req, res) => {
  const paramsParsed = UpdatePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdatePasswordBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = { ...bodyParsed.data, updatedAt: new Date() };
  if (bodyParsed.data.password) {
    updates.strength = computeStrength(bodyParsed.data.password);
  }

  const [row] = await db
    .update(passwordsTable)
    .set(updates)
    .where(eq(passwordsTable.id, paramsParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.delete("/passwords/:id", async (req, res) => {
  const parsed = DeletePasswordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(passwordsTable).where(eq(passwordsTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
