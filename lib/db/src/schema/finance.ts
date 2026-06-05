import { pgTable, serial, text, numeric, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financeTypeEnum = pgEnum("finance_type", ["income", "expense"]);

export const financeRecordsTable = pgTable("finance_records", {
  id: serial("id").primaryKey(),
  type: financeTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinanceRecordSchema = createInsertSchema(financeRecordsTable).omit({ id: true, createdAt: true });
export type InsertFinanceRecord = z.infer<typeof insertFinanceRecordSchema>;
export type FinanceRecord = typeof financeRecordsTable.$inferSelect;
