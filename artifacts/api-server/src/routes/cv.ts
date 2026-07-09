import { Router } from "express";
import { db } from "@workspace/db";
import { cvProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CvInput = z.object({
  fullName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  summary: z.string().optional(),
  experience: z.string().default("[]"),
  education: z.string().default("[]"),
  skills: z.string().default("[]"),
  languages: z.string().default("[]"),
  templateColor: z.string().default("#0078D4"),
});

router.get("/cv", async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const [cv] = await db.select().from(cvProfilesTable).where(eq(cvProfilesTable.userId, userId));
  return res.json(cv ?? null);
});

router.put("/cv", async (req, res) => {
  const userId = (req as unknown as { userId: number }).userId;
  const parsed = CvInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }

  const [existing] = await db.select().from(cvProfilesTable).where(eq(cvProfilesTable.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(cvProfilesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(cvProfilesTable.userId, userId))
      .returning();
    return res.json(updated);
  } else {
    const [created] = await db
      .insert(cvProfilesTable)
      .values({ userId, ...parsed.data })
      .returning();
    return res.json(created);
  }
});

export default router;
