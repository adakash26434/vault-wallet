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

const router = Router();

router.get("/finance/records", async (req, res) => {
  const parsed = ListFinanceRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query params" });

  const { type, month, year } = parsed.data;

  const conditions = [];
  if (type) conditions.push(eq(financeRecordsTable.type, type as "income" | "expense"));
  if (month) conditions.push(sql`EXTRACT(MONTH FROM ${financeRecordsTable.date}) = ${Number(month)}`);
  if (year) conditions.push(sql`EXTRACT(YEAR FROM ${financeRecordsTable.date}) = ${Number(year)}`);

  const rows = await db
    .select()
    .from(financeRecordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(financeRecordsTable.date);

  return res.json(
    rows.map((r) => ({
      ...r,
      amount: Number(r.amount),
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/finance/records", async (req, res) => {
  const parsed = CreateFinanceRecordBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [row] = await db
    .insert(financeRecordsTable)
    .values({
      type: parsed.data.type as "income" | "expense",
      category: parsed.data.category,
      amount: String(parsed.data.amount),
      description: parsed.data.description,
      date: parsed.data.date,
    })
    .returning();

  return res.status(201).json({ ...row, amount: Number(row.amount), createdAt: row.createdAt.toISOString() });
});

router.patch("/finance/records/:id", async (req, res) => {
  const paramsParsed = UpdateFinanceRecordParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = UpdateFinanceRecordBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  if (bodyParsed.data.type) updates.type = bodyParsed.data.type;
  if (bodyParsed.data.category) updates.category = bodyParsed.data.category;
  if (bodyParsed.data.amount !== undefined) updates.amount = String(bodyParsed.data.amount);
  if (bodyParsed.data.description !== undefined) updates.description = bodyParsed.data.description;
  if (bodyParsed.data.date) updates.date = bodyParsed.data.date;

  const [row] = await db
    .update(financeRecordsTable)
    .set(updates)
    .where(eq(financeRecordsTable.id, paramsParsed.data.id))
    .returning();

  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json({ ...row, amount: Number(row.amount), createdAt: row.createdAt.toISOString() });
});

router.delete("/finance/records/:id", async (req, res) => {
  const parsed = DeleteFinanceRecordParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(financeRecordsTable).where(eq(financeRecordsTable.id, parsed.data.id));
  return res.status(204).send();
});

router.get("/finance/summary", async (req, res) => {
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
        sql`EXTRACT(MONTH FROM ${financeRecordsTable.date}) = ${targetMonth}`,
        sql`EXTRACT(YEAR FROM ${financeRecordsTable.date}) = ${targetYear}`
      )
    );

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
