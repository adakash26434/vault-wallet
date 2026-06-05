import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
} from "@workspace/api-zod";

const router = Router();

function enrichDocument(row: typeof documentsTable.$inferSelect) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isExpired = false;
  let daysUntilExpiry: number | null = null;

  if (row.expiryDate) {
    const expiry = new Date(row.expiryDate);
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    daysUntilExpiry = diff;
    isExpired = diff < 0;
  }

  return {
    ...row,
    isExpired,
    daysUntilExpiry,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/documents", async (req, res) => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

  const { category } = parsed.data;

  const rows = await db
    .select()
    .from(documentsTable)
    .where(category ? eq(documentsTable.category, category) : undefined)
    .orderBy(documentsTable.createdAt);

  return res.json(rows.map(enrichDocument));
});

router.post("/documents", async (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [row] = await db
    .insert(documentsTable)
    .values({
      name: parsed.data.name,
      category: parsed.data.category ?? "Other",
      fileUrl: parsed.data.fileUrl,
      expiryDate: parsed.data.expiryDate,
      notes: parsed.data.notes,
    })
    .returning();

  return res.status(201).json(enrichDocument(row));
});

router.patch("/documents/:id", async (req, res) => {
  const paramsParsed = UpdateDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateDocumentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const [row] = await db
    .update(documentsTable)
    .set(bodyParsed.data)
    .where(eq(documentsTable.id, paramsParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(enrichDocument(row));
});

router.delete("/documents/:id", async (req, res) => {
  const parsed = DeleteDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(documentsTable).where(eq(documentsTable.id, parsed.data.id));
  return res.status(204).send();
});

export default router;
