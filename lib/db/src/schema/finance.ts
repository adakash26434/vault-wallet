import { pgTable, serial, text, numeric, date, timestamp, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const financeTypeEnum = pgEnum("finance_type", ["income", "expense"]);

export const financeRecordsTable = pgTable("finance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: financeTypeEnum("type").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("finance_records_user_id_idx").on(table.userId),
}));

export const insertFinanceRecordSchema = createInsertSchema(financeRecordsTable).omit({ id: true, createdAt: true });
export type InsertFinanceRecord = z.infer<typeof insertFinanceRecordSchema>;
export type FinanceRecord = typeof financeRecordsTable.$inferSelect;
