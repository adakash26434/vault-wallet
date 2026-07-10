import { Router } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const TaskInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum([
    "electricity", "water", "mobile", "internet", "loan",
    "tax", "insurance", "vehicle", "appointment", "travel", "personal",
  ]).default("personal"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

const TaskUpdate = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.enum([
    "electricity", "water", "mobile", "internet", "loan",
    "tax", "insurance", "vehicle", "appointment", "travel", "personal",
  ]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  isCompleted: z.boolean().optional(),
});

// GET /tasks — list tasks for current user
router.get("/tasks", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, userId));

  return res.json(
    rows
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? null,
        category: t.category,
        dueDate: t.dueDate,
        dueTime: t.dueTime ?? null,
        priority: t.priority,
        isCompleted: t.isCompleted,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))
  );
});

// POST /tasks — create a task
router.post("/tasks", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = TaskInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }

  const [task] = await db
    .insert(tasksTable)
    .values({
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      dueDate: parsed.data.dueDate,
      dueTime: parsed.data.dueTime,
      priority: parsed.data.priority,
    })
    .returning();

  return res.status(201).json({
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    category: task.category,
    dueDate: task.dueDate,
    dueTime: task.dueTime ?? null,
    priority: task.priority,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  });
});

// PATCH /tasks/:id — update a task
router.patch("/tasks/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const taskId = Number(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task id" });

  const parsed = TaskUpdate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
  }

  const updates: Partial<typeof tasksTable.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.dueDate !== undefined) updates.dueDate = parsed.data.dueDate;
  if (parsed.data.dueTime !== undefined) updates.dueTime = parsed.data.dueTime;
  if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;
  if (parsed.data.isCompleted !== undefined) updates.isCompleted = parsed.data.isCompleted;

  const [updated] = await db
    .update(tasksTable)
    .set(updates)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Task not found" });

  return res.json({
    id: updated.id,
    title: updated.title,
    description: updated.description ?? null,
    category: updated.category,
    dueDate: updated.dueDate,
    dueTime: updated.dueTime ?? null,
    priority: updated.priority,
    isCompleted: updated.isCompleted,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /tasks/:id — delete a task
router.delete("/tasks/:id", async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const taskId = Number(req.params.id);
  if (isNaN(taskId)) return res.status(400).json({ error: "Invalid task id" });

  await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

  return res.status(204).send();
});

export default router;
