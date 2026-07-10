import { pgTable, serial, text, timestamp, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const passwordStrengthEnum = pgEnum("password_strength", ["weak", "medium", "strong"]);

export const passwordsTable = pgTable("passwords", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  url: text("url"),
  category: text("category").notNull().default("General"),
  notes: text("notes"),
  strength: passwordStrengthEnum("strength").notNull().default("medium"),
  owner: text("owner").notNull().default("Me"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("passwords_user_id_idx").on(table.userId),
}));

export const insertPasswordSchema = createInsertSchema(passwordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPassword = z.infer<typeof insertPasswordSchema>;
export type Password = typeof passwordsTable.$inferSelect;
