import React, { useState, useRef } from "react";
import {
  useListPasswords,
  useDeletePassword,
  useGetPasswordStats,
  getListPasswordsQueryKey,
  getGetPasswordStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  KeyRound, Plus, Search, Copy, MoreVertical, Trash2, Edit,
  Check, User, ShieldAlert, ShieldCheck, AlertTriangle, Filter,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PasswordFormDialog from "@/components/PasswordFormDialog";
import { PasswordEntry } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All", "Email", "Social", "Banking", "Mobile Wallet",
  "Work", "Shopping", "Entertainment", "Government", "Personal", "Other",
];

const CAT_COLORS: Record<string, string> = {
  Email:          "bg-sky-100 text-sky-700",
  Social:         "bg-pink-100 text-pink-700",
  Banking:        "bg-emerald-100 text-emerald-700",
  "Mobile Wallet":"bg-green-100 text-green-700",
  Work:           "bg-violet-100 text-violet-700",
  Shopping:       "bg-orange-100 text-orange-700",
  Entertainment:  "bg-rose-100 text-rose-700",
  Government:     "bg-amber-100 text-amber-700",
  Personal:       "bg-blue-100 text-blue-700",
  Other:          "bg-slate-100 text-slate-600",
};

function StrengthBadge({ strength }: { strength?: string }) {
  if (strength === "strong")
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Strong</Badge>;
  if (strength === "medium")
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Medium</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Weak</Badge>;
}

function StatCard({
  value, label, color, Icon,
}: { value: number; label: string; color: string; Icon: React.ElementType }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function Passwords() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<number | null>(null);

  // Ref to cancel the 30s clipboard auto-clear timer when a new copy happens
  const clipboardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: passwords, isLoading } = useListPasswords(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListPasswordsQueryKey({ search: debouncedSearch || undefined }) } }
  );
  const { data: stats } = useGetPasswordStats();
  const deleteMutation = useDeletePassword();

  // Client-side category filter
  const filtered = React.useMemo(() => {
    if (!passwords) return [];
    if (selectedCategory === "All") return passwords;
    return passwords.filter((p) => p.category === selectedCategory);
  }, [passwords, selectedCategory]);

  // Category counts for badge display
  const categoryCounts = React.useMemo(() => {
    if (!passwords) return {};
    return passwords.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [passwords]);

  const handleCopy = (password: string, id: number) => {
    // Cancel any pending 30-second clear
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);

    navigator.clipboard.writeText(password);
    setCopiedId(id);
    toast({ title: "Password copied", description: "Auto-cleared from clipboard in 30s", duration: 2000 });

    // Reset visual state after 2s
    setTimeout(() => setCopiedId(null), 2000);

    // SECURITY: actually clear the clipboard after 30 seconds
    clipboardTimerRef.current = setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => {});
    }, 30000);
  };

  const handleCopyUsername = (username: string, id: number) => {
    navigator.clipboard.writeText(username);
    setCopiedUsernameId(id);
    toast({ title: "Username copied", duration: 1500 });
    setTimeout(() => setCopiedUsernameId(null), 2000);
  };

  const handleDeleteConfirm = () => {
    if (deletingId == null) return;
    deleteMutation.mutate(
      { id: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
          toast({ title: "Password deleted" });
          setDeletingId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
          setDeletingId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">All your credentials, encrypted with AES-256-GCM.</p>
        </div>
        <PasswordFormDialog>
          <Button style={{ background: "hsl(var(--primary))" }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Password
          </Button>
        </PasswordFormDialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value={stats.total}  label="Total saved" color="bg-blue-100 text-blue-700"    Icon={KeyRound}    />
          <StatCard value={stats.strong} label="Strong"      color="bg-emerald-100 text-emerald-700" Icon={ShieldCheck}  />
          <StatCard value={stats.medium} label="Medium"      color="bg-amber-100 text-amber-700"  Icon={AlertTriangle} />
          <StatCard value={stats.weak}   label="Weak — fix!" color="bg-red-100 text-red-700"      Icon={ShieldAlert}   />
        </div>
      )}

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or URL…"
            className="pl-9 bg-white border-border h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category filter tabs — horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          {CATEGORIES.map((cat) => {
            const count = cat === "All" ? (passwords?.length ?? 0) : (categoryCounts[cat] ?? 0);
            const isActive = selectedCategory === cat;
            if (cat !== "All" && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all border",
                  isActive
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                )}
              >
                {cat}
                {count > 0 && (
                  <span className={cn(
                    "text-[10.5px] rounded-full px-1.5 py-0.5 leading-none font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Password list */}
      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-white">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-blue-700" />
            </div>
            <h3 className="text-[16px] font-bold">
              {search || selectedCategory !== "All" ? "No matches found" : "Vault is empty"}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 max-w-xs">
              {search || selectedCategory !== "All"
                ? "Try a different search term or category filter."
                : "Add your first password and secure it with AES-256 encryption."}
            </p>
            {!search && selectedCategory === "All" && (
              <PasswordFormDialog>
                <Button variant="outline">Add your first password</Button>
              </PasswordFormDialog>
            )}
            {selectedCategory !== "All" && (
              <Button variant="ghost" onClick={() => setSelectedCategory("All")} className="text-[13px]">
                Show all categories
              </Button>
            )}
          </div>
        ) : (
          filtered.map((pwd) => {
            const catStyle = CAT_COLORS[pwd.category] ?? "bg-slate-100 text-slate-600";
            return (
              <Card
                key={pwd.id}
                className="bg-white border-border hover:border-primary/30 transition-all"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  {/* Left — favicon + details */}
                  <div className="flex items-center gap-3.5 overflow-hidden flex-1 min-w-0">
                    <div className="relative h-10 w-10 flex-shrink-0">
                      {pwd.url ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${pwd.url}&sz=32`}
                          alt={pwd.title}
                          className="h-10 w-10 rounded-lg object-cover bg-muted"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            const fb = img.nextElementSibling as HTMLElement;
                            if (fb) fb.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="h-10 w-10 rounded-lg bg-blue-100 flex-shrink-0 items-center justify-center text-blue-700 font-bold uppercase text-[15px]"
                        style={{ display: pwd.url ? "none" : "flex" }}
                      >
                        {pwd.title.charAt(0)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[14px] text-foreground truncate">{pwd.title}</h4>
                        <span className={`hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${catStyle}`}>
                          {pwd.category}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-muted-foreground truncate">{pwd.username}</p>
                      {pwd.url && (
                        <p className="text-[11px] text-muted-foreground/60 truncate">
                          {pwd.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right — badge + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:block">
                      <StrengthBadge strength={pwd.strength} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${copiedUsernameId === pwd.id ? "text-emerald-600 bg-emerald-100" : "text-muted-foreground"}`}
                        onClick={() => handleCopyUsername(pwd.username ?? "", pwd.id)}
                        title="Copy username"
                      >
                        {copiedUsernameId === pwd.id ? <Check className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${copiedId === pwd.id ? "text-emerald-600 bg-emerald-100" : "text-muted-foreground"}`}
                        onClick={() => handleCopy(pwd.password, pwd.id)}
                        title="Copy password (auto-clears in 30s)"
                      >
                        {copiedId === pwd.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingPassword(pwd)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingId(pwd.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Results count */}
      {filtered.length > 0 && (passwords?.length ?? 0) > 0 && (
        <p className="text-center text-[12px] text-muted-foreground pb-2">
          Showing {filtered.length} of {passwords?.length} passwords
          {selectedCategory !== "All" ? ` in "${selectedCategory}"` : ""}
        </p>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deletingId != null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this credential from your vault. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PasswordFormDialog
        open={!!editingPassword}
        onOpenChange={(open) => !open && setEditingPassword(null)}
        password={editingPassword || undefined}
      />
    </div>
  );
}
