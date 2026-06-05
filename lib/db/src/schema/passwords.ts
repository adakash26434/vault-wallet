import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const passwordStrengthEnum = pgEnum("password_strength", ["weak", "medium", "strong"]);

export const passwordsTable = pgTable("passwords", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  url: text("url"),
  category: text("category").notNull().default("General"),
  notes: text("notes"),
  strength: passwordStrengthEnum("strength").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPasswordSchema = createInsertSchema(passwordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPassword = z.infer<typeof insertPasswordSchema>;
export type Password = typeof passwordsTable.$inferSelect;
