import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const cvProfilesTable = pgTable("cv_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull().default(""),
  jobTitle: text("job_title").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  website: text("website"),
  linkedin: text("linkedin"),
  summary: text("summary"),
  experience: text("experience").notNull().default("[]"),
  education: text("education").notNull().default("[]"),
  skills: text("skills").notNull().default("[]"),
  languages: text("languages").notNull().default("[]"),
  templateColor: text("template_color").notNull().default("#0078D4"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CvProfile = typeof cvProfilesTable.$inferSelect;
export type InsertCvProfile = typeof cvProfilesTable.$inferInsert;
