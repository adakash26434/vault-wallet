import { Router } from "express";
import { db, passwordsTable, documentsTable, financeRecordsTable } from "@workspace/db";
import { sql, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard/overview", async (req, res) => {
  const passwords = await db.select().from(passwordsTable);
  const documents = await db.select().from(documentsTable);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringDocuments = documents.filter((d) => {
    if (!d.expiryDate) return false;
    const expiry = new Date(d.expiryDate);
    return expiry >= today && expiry <= in30Days;
  }).length;

  const weakPasswords = passwords.filter((p) => p.strength === "weak").length;

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const financeRows = await db
    .select()
    .from(financeRecordsTable)
    .where(
      and(
        sql`EXTRACT(MONTH FROM ${financeRecordsTable.date}) = ${currentMonth}`,
        sql`EXTRACT(YEAR FROM ${financeRecordsTable.date}) = ${currentYear}`
      )
    );

  const totalIncome = financeRows.filter((r) => r.type === "income").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = financeRows.filter((r) => r.type === "expense").reduce((sum, r) => sum + Number(r.amount), 0);
  const monthlyBalance = totalIncome - totalExpenses;

  const recentAlerts = weakPasswords + expiringDocuments;

  return res.json({
    totalPasswords: passwords.length,
    totalDocuments: documents.length,
    expiringDocuments,
    monthlyBalance,
    weakPasswords,
    recentAlerts,
  });
});

router.get("/dashboard/alerts", async (req, res) => {
  const passwords = await db.select().from(passwordsTable);
  const documents = await db.select().from(documentsTable);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const alerts: {
    id: number;
    type: "weak_password" | "expiring_document" | "overspending" | "expired_document";
    severity: "low" | "medium" | "high";
    title: string;
    message: string;
    createdAt: string;
  }[] = [];

  let alertId = 1;

  passwords.filter((p) => p.strength === "weak").forEach((p) => {
    alerts.push({
      id: alertId++,
      type: "weak_password",
      severity: "high",
      title: "Weak Password Detected",
      message: `"${p.title}" has a weak password. Consider updating it to a stronger one.`,
      createdAt: new Date().toISOString(),
    });
  });

  documents.forEach((d) => {
    if (!d.expiryDate) return;
    const expiry = new Date(d.expiryDate);
    if (expiry < today) {
      alerts.push({
        id: alertId++,
        type: "expired_document",
        severity: "high",
        title: "Document Expired",
        message: `"${d.name}" expired on ${d.expiryDate}. Please renew it.`,
        createdAt: new Date().toISOString(),
      });
    } else if (expiry <= in30Days) {
      const days = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: alertId++,
        type: "expiring_document",
        severity: days <= 7 ? "high" : "medium",
        title: "Document Expiring Soon",
        message: `"${d.name}" expires in ${days} day${days === 1 ? "" : "s"}.`,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return res.json(alerts);
});

export default router;
