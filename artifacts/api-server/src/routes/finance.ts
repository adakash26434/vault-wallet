import { Router } from "express";
import { db, financeRecordsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListFinanceRecordsQueryParams,
  CreateFinanceRecordBody,
  UpdateFinanceRecordParams,
  UpdateFinanceRecordBody,
  DeleteFinanceRecordParams,
  GetFinanceSummaryQueryParams,
} from "@workspace/api-zod";
import { encryptField, decryptField } from "../lib/crypto.js";

const router = Router();

function decryptRow(r: typeof financeRecordsTable.$inferSelect) {
  return {
    ...r,
    amount: Number(r.amount),
    description: decryptField(r.description),
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /finance/records — list current user's finance records with optional filters
router.get("/finance/records", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = ListFinanceRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

  const { type, month, year } = parsed.data;

  const conditions = [eq(financeRecordsTable.userId, userId)];
  if (type) conditions.push(eq(financeRecordsTable.type, type as "income" | "expense"));
  if (month) conditions.push(sql`EXTRACT(MONTH FROM ${financeRecordsTable.date}) = ${Number(month)}`);
  if (year) conditions.push(sql`EXTRACT(YEAR FROM ${financeRecordsTable.date}) = ${Number(year)}`);

  const rows = await db
    .select()
    .from(financeRecordsTable)
    .where(and(...conditions))
    .orderBy(financeRecordsTable.date);

  return res.json(rows.map(decryptRow));
});

// POST /finance/records — create a new finance record for current user
router.post("/finance/records", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = CreateFinanceRecordBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [row] = await db
    .insert(financeRecordsTable)
    .values({
      userId,
      type: parsed.data.type as "income" | "expense",
      category: parsed.data.category,
      amount: String(parsed.data.amount),
      description: encryptField(parsed.data.description),
      date: parsed.data.date,
    })
    .returning();

  return res.status(201).json(decryptRow(row));
});

// PATCH /finance/records/:id — update a finance record (only if owned by current user)
router.patch("/finance/records/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const paramsParsed = UpdateFinanceRecordParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateFinanceRecordBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  if (bodyParsed.data.type) updates.type = bodyParsed.data.type;
  if (bodyParsed.data.category) updates.category = bodyParsed.data.category;
  if (bodyParsed.data.amount !== undefined) updates.amount = String(bodyParsed.data.amount);
  if (bodyParsed.data.description !== undefined) updates.description = encryptField(bodyParsed.data.description);
  if (bodyParsed.data.date) updates.date = bodyParsed.data.date;

  const [row] = await db
    .update(financeRecordsTable)
    .set(updates)
    .where(and(eq(financeRecordsTable.id, paramsParsed.data.id), eq(financeRecordsTable.userId, userId)))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(decryptRow(row));
});

// DELETE /finance/records/:id — delete a finance record (only if owned by current user)
router.delete("/finance/records/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = DeleteFinanceRecordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [deleted] = await db
    .delete(financeRecordsTable)
    .where(and(eq(financeRecordsTable.id, parsed.data.id), eq(financeRecordsTable.userId, userId)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.status(204).send();
});

// GET /finance/summary — get finance summary for current user only
router.get("/finance/summary", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = GetFinanceSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

  const now = new Date();
  const targetMonth = parsed.data.month ?? now.getMonth() + 1;
  const targetYear = parsed.data.year ?? now.getFullYear();

  const rows = await db
    .select()
    .from(financeRecordsTable)
    .where(
      and(
        eq(financeRecordsTable.userId, userId),
        sql`EXTRACT(MONTH FROM ${financeRecordsTable.date}) = ${targetMonth}`,
        sql`EXTRACT(YEAR FROM ${financeRecordsTable.date}) = ${targetYear}`
      )
    );

  // amount column is NOT encrypted (numeric) — safe to do arithmetic directly
  const totalIncome = rows.filter((r) => r.type === "income").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = rows.filter((r) => r.type === "expense").reduce((sum, r) => sum + Number(r.amount), 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const expenseByCategory: Record<string, number> = {};
  rows.filter((r) => r.type === "expense").forEach((r) => {
    expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + Number(r.amount);
  });

  const byCategory = Object.entries(expenseByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
  }));

  return res.json({ month: targetMonth, year: targetYear, totalIncome, totalExpenses, savings, savingsRate, byCategory });
});

export default router;
