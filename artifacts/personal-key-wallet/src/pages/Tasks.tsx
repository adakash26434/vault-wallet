import React, { useState, useMemo } from "react";
import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Zap, Droplets, Smartphone, Wifi, Banknote, Receipt,
  Shield, Car, Stethoscope, Plane, User, MoreHorizontal,
  CheckCircle2, Circle, Trash2, Pencil, AlertTriangle,
  CalendarDays, Clock, Filter, Bell, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category =
  | "electricity" | "water" | "mobile" | "internet" | "loan"
  | "tax" | "insurance" | "vehicle" | "appointment" | "travel" | "personal";

type Priority = "high" | "medium" | "low";

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "electricity", label: "NEA / Bijuli", icon: Zap,         color: "text-yellow-600", bg: "bg-yellow-100" },
  { value: "water",       label: "Khanepani",   icon: Droplets,     color: "text-blue-500",   bg: "bg-blue-100"   },
  { value: "mobile",      label: "Mobile Bill",  icon: Smartphone,   color: "text-violet-600", bg: "bg-violet-100" },
  { value: "internet",    label: "Internet",     icon: Wifi,         color: "text-sky-600",    bg: "bg-sky-100"    },
  { value: "loan",        label: "Loan / EMI",   icon: Banknote,     color: "text-red-600",    bg: "bg-red-100"    },
  { value: "tax",         label: "Tax / IRD",    icon: Receipt,      color: "text-orange-600", bg: "bg-orange-100" },
  { value: "insurance",   label: "Insurance",    icon: Shield,       color: "text-emerald-600",bg: "bg-emerald-100"},
  { value: "vehicle",     label: "Bluebook/Tax",  icon: Car,          color: "text-amber-700",  bg: "bg-amber-100"  },
  { value: "appointment", label: "Doctor/Appt",  icon: Stethoscope,  color: "text-rose-600",   bg: "bg-rose-100"   },
  { value: "travel",      label: "Travel/Visa",  icon: Plane,        color: "text-indigo-600", bg: "bg-indigo-100" },
  { value: "personal",    label: "Personal",     icon: User,         color: "text-slate-600",  bg: "bg-slate-100"  },
];

const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  high:   { label: "High",   color: "text-red-600 bg-red-50 border-red-200",      dot: "bg-red-500"    },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200", dot: "bg-amber-500"  },
  low:    { label: "Low",    color: "text-slate-600 bg-slate-50 border-slate-200", dot: "bg-slate-400"  },
};

function getCat(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

function daysDiff(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function formatDue(dateStr: string, timeStr?: string | null) {
  const diff = daysDiff(dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateLabel =
    diff === 0 ? "Today" :
    diff === 1 ? "Tomorrow" :
    diff === -1 ? "Yesterday" :
    new Date(y, m - 1, d).toLocaleDateString("en-NP", { day: "numeric", month: "short" });
  return timeLabel(dateLabel, timeStr);
}

function timeLabel(date: string, time?: string | null) {
  if (time) return `${date} · ${time}`;
  return date;
}

type Filter = "all" | "upcoming" | "overdue" | "completed";

interface TaskFormState {
  title: string;
  description: string;
  category: Category;
  dueDate: string;
  dueTime: string;
  priority: Priority;
}

const defaultForm: TaskFormState = {
  title: "",
  description: "",
  category: "personal",
  dueDate: new Date().toISOString().slice(0, 10),
  dueTime: "",
  priority: "medium",
};

interface TaskEntry {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  dueDate: string;
  dueTime?: string | null;
  priority: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filter, setFilter] = useState<Filter>("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskEntry | null>(null);
  const [form, setForm] = useState<TaskFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    const list = tasks as TaskEntry[];
    switch (filter) {
      case "upcoming":
        return list.filter((t) => !t.isCompleted && t.dueDate >= today)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      case "overdue":
        return list.filter((t) => !t.isCompleted && t.dueDate < today)
          .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
      case "completed":
        return list.filter((t) => t.isCompleted)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      default:
        return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
  }, [tasks, filter, today]);

  const counts = useMemo(() => {
    if (!tasks) return { all: 0, upcoming: 0, overdue: 0, completed: 0 };
    const list = tasks as TaskEntry[];
    return {
      all: list.length,
      upcoming: list.filter((t) => !t.isCompleted && t.dueDate >= today).length,
      overdue:  list.filter((t) => !t.isCompleted && t.dueDate < today).length,
      completed: list.filter((t) => t.isCompleted).length,
    };
  }, [tasks, today]);

  function openCreate() {
    setEditingTask(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(t: TaskEntry) {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      category: t.category as Category,
      dueDate: t.dueDate,
      dueTime: t.dueTime ?? "",
      priority: t.priority as Priority,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.dueDate) return;
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        dueDate: form.dueDate,
        dueTime: form.dueTime || undefined,
        priority: form.priority,
      };
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, data: body });
        toast({ title: "Task updated" });
      } else {
        await createTask.mutateAsync({ data: body });
        toast({ title: "Reminder added!" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/tasks"] });
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to save task", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(t: TaskEntry) {
    try {
      await updateTask.mutateAsync({ id: t.id, data: { isCompleted: !t.isCompleted } });
      await queryClient.invalidateQueries({ queryKey: ["/tasks"] });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTask.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: ["/tasks"] });
      toast({ title: "Task deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const FILTERS: { key: Filter; label: string; count: number; color?: string }[] = [
    { key: "upcoming",  label: "Upcoming",  count: counts.upcoming,  color: counts.upcoming > 0 ? "text-blue-600" : undefined },
    { key: "overdue",   label: "Overdue",   count: counts.overdue,   color: counts.overdue > 0 ? "text-red-600" : undefined },
    { key: "all",       label: "All",       count: counts.all },
    { key: "completed", label: "Done",      count: counts.completed, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Reminders
          </h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">
            Bill, EMI, insurance, tax, appointment — sabai yaad garaucha
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0" style={{ background: "hsl(var(--primary))" }}>
          <Plus className="h-4 w-4" /> Add Reminder
        </Button>
      </div>

      {/* Overdue alert banner */}
      {counts.overdue > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-[13.5px] text-red-700 font-medium">
            {counts.overdue} reminder{counts.overdue > 1 ? "s" : ""} overdue — please check immediately
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-700 hover:bg-red-100 h-7 text-[12px]"
            onClick={() => setFilter("overdue")}
          >
            View
          </Button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
        {FILTERS.map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all whitespace-nowrap border",
              filter === key
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            {label}
            <span className={cn(
              "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
              filter === key ? "bg-white/20 text-white" : cn("bg-muted", color)
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CheckCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground text-[15px]">
            {filter === "completed" ? "No completed tasks yet" :
             filter === "overdue" ? "No overdue tasks 🎉" :
             "No reminders here"}
          </p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {filter === "upcoming" ? "Add a reminder for NEA bill, EMI, appointment and more" :
             filter === "overdue" ? "You're all caught up!" :
             "Click 'Add Reminder' to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const cat = getCat(task.category);
            const CatIcon = cat.icon;
            const pri = PRIORITY_META[task.priority as Priority] ?? PRIORITY_META.medium;
            const diff = daysDiff(task.dueDate);
            const isOverdue = !task.isCompleted && diff < 0;
            const isDueToday = !task.isCompleted && diff === 0;

            return (
              <div
                key={task.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3.5 bg-white rounded-lg border transition-all",
                  task.isCompleted
                    ? "opacity-60 border-border"
                    : isOverdue
                    ? "border-red-200 bg-red-50/30"
                    : isDueToday
                    ? "border-amber-300 bg-amber-50/30"
                    : "border-border hover:border-primary/20 hover:shadow-sm"
                )}
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                {/* Complete toggle */}
                <button
                  onClick={() => handleToggle(task)}
                  className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                >
                  {task.isCompleted
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary" />
                  }
                </button>

                {/* Category icon */}
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cat.bg)}>
                  <CatIcon className={cn("h-4 w-4", cat.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-[14px] font-semibold text-foreground leading-snug",
                      task.isCompleted && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(task)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(task)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                          {task.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(task.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {/* Category chip */}
                    <span className={cn("text-[11.5px] font-medium px-2 py-0.5 rounded-full", cat.bg, cat.color)}>
                      {cat.label}
                    </span>

                    {/* Due date */}
                    <span className={cn(
                      "flex items-center gap-1 text-[11.5px] font-medium",
                      isOverdue ? "text-red-600" :
                      isDueToday ? "text-amber-600" :
                      "text-muted-foreground"
                    )}>
                      {isOverdue
                        ? <AlertTriangle className="h-3 w-3" />
                        : isDueToday
                        ? <Clock className="h-3 w-3" />
                        : <CalendarDays className="h-3 w-3" />
                      }
                      {isOverdue ? `${Math.abs(diff)}d overdue · ` : ""}{formatDue(task.dueDate, task.dueTime)}
                    </span>

                    {/* Priority */}
                    <Badge variant="outline" className={cn("text-[11px] h-5 px-1.5 border", pri.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-1", pri.dot)} />
                      {pri.label}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className="text-[12.5px] text-muted-foreground mt-1 truncate">{task.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Reminder" : "New Reminder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Title *</label>
              <Input
                placeholder="e.g. NEA bill tir garnu, EMI payment…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Category</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      return (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-3.5 w-3.5", c.color)} />
                            {c.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Priority</label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["high", "medium", "low"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", PRIORITY_META[p].dot)} />
                          {PRIORITY_META[p].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Due Date *</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="h-9 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Time (optional)</label>
                <Input
                  type="time"
                  value={form.dueTime}
                  onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
                  className="h-9 text-[13px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[12.5px] font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
              <Textarea
                placeholder="Additional details…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="text-[13px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.dueDate}
              style={{ background: "hsl(var(--primary))" }}
            >
              {saving ? "Saving…" : editingTask ? "Save Changes" : "Add Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
