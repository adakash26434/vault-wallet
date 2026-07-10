import { Router } from "express";
import { db, documentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
} from "@workspace/api-zod";
import { encryptField, decryptField } from "../lib/crypto.js";

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
    // Decrypt sensitive fields
    documentNumber: decryptField(row.documentNumber),
    notes: decryptField(row.notes),
    isExpired,
    daysUntilExpiry,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /documents — list current user's documents with optional category filter
router.get("/documents", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

  const { category } = parsed.data;

  const rows = await db
    .select()
    .from(documentsTable)
    .where(category
      ? and(eq(documentsTable.userId, userId), eq(documentsTable.category, category))
      : eq(documentsTable.userId, userId)
    )
    .orderBy(documentsTable.createdAt);

  return res.json(rows.map(enrichDocument));
});

// POST /documents — create a new document for current user
router.post("/documents", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [row] = await db
    .insert(documentsTable)
    .values({
      userId,
      name: parsed.data.name,
      category: parsed.data.category ?? "Other",
      documentNumber: encryptField(parsed.data.documentNumber),
      issuedBy: parsed.data.issuedBy,
      issueDate: parsed.data.issueDate,
      fileUrl: parsed.data.fileUrl,
      expiryDate: parsed.data.expiryDate,
      notes: encryptField(parsed.data.notes),
    })
    .returning();

  return res.status(201).json(enrichDocument(row));
});

// PATCH /documents/:id — update a document (only if owned by current user)
router.patch("/documents/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const paramsParsed = UpdateDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateDocumentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  const data = bodyParsed.data;

  if (data.name !== undefined) updates.name = data.name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.documentNumber !== undefined) updates.documentNumber = encryptField(data.documentNumber);
  if (data.issuedBy !== undefined) updates.issuedBy = data.issuedBy;
  if (data.issueDate !== undefined) updates.issueDate = data.issueDate;
  if (data.expiryDate !== undefined) updates.expiryDate = data.expiryDate;
  if (data.fileUrl !== undefined) updates.fileUrl = data.fileUrl;
  if (data.notes !== undefined) updates.notes = encryptField(data.notes);

  const [row] = await db
    .update(documentsTable)
    .set(updates)
    .where(and(eq(documentsTable.id, paramsParsed.data.id), eq(documentsTable.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(enrichDocument(row));
});

// DELETE /documents/:id — delete a document (only if owned by current user)
router.delete("/documents/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = DeleteDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [deleted] = await db
    .delete(documentsTable)
    .where(and(eq(documentsTable.id, parsed.data.id), eq(documentsTable.userId, userId)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
});

export default router;
