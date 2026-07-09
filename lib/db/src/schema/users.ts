import { pgTable, serial, text, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  name: text("name"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  bio: text("bio"),
  avatarColor: text("avatar_color"),
  avatarUrl: text("avatar_url"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
