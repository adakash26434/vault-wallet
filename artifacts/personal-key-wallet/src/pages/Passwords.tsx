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
  Users, Clock, AlertCircle,
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

const FAMILY_MEMBERS = [
  { label: "Me",       emoji: "🧑", active: "bg-blue-600 text-white border-blue-600",    inactive: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Wife",     emoji: "👩", active: "bg-pink-500 text-white border-pink-500",    inactive: "bg-pink-50 text-pink-700 border-pink-200" },
  { label: "Husband",  emoji: "👨", active: "bg-indigo-600 text-white border-indigo-600", inactive: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { label: "Dad",      emoji: "👴", active: "bg-amber-500 text-white border-amber-500",  inactive: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Mom",      emoji: "👵", active: "bg-orange-500 text-white border-orange-500", inactive: "bg-orange-50 text-orange-700 border-orange-200" },
  { label: "Son",      emoji: "👦", active: "bg-teal-600 text-white border-teal-600",    inactive: "bg-teal-50 text-teal-700 border-teal-200" },
  { label: "Daughter", emoji: "👧", active: "bg-rose-500 text-white border-rose-500",    inactive: "bg-rose-50 text-rose-700 border-rose-200" },
  { label: "Brother",  emoji: "🧒", active: "bg-violet-600 text-white border-violet-600", inactive: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Sister",   emoji: "👩‍🦱", active: "bg-fuchsia-500 text-white border-fuchsia-500", inactive: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
];

const OWNER_EMOJI: Record<string, string> = Object.fromEntries(FAMILY_MEMBERS.map(m => [m.label, m.emoji]));
const OWNER_INACTIVE: Record<string, string> = Object.fromEntries(FAMILY_MEMBERS.map(m => [m.label, m.inactive]));

const STALE_DAYS = 90;
const OLD_DAYS = 180;

function passwordAgeDays(updatedAt: string): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));
}

function AgeWarning({ days }: { days: number }) {
  if (days < STALE_DAYS) return null;
  const isOld = days >= OLD_DAYS;
  const months = Math.floor(days / 30);
  return (
    <span className={cn(
      "hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
      isOld
        ? "bg-red-50 text-red-600 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    )}>
      <Clock className="h-2.5 w-2.5" />
      {months}m old
    </span>
  );
}

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
  const [selectedOwner, setSelectedOwner] = useState("All");
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<number | null>(null);

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

  // Stale password counts
  const staleCounts = React.useMemo(() => {
    if (!passwords) return { stale: 0, old: 0 };
    let stale = 0, old = 0;
    passwords.forEach((p) => {
      const days = passwordAgeDays(p.updatedAt);
      if (days >= OLD_DAYS) old++;
      else if (days >= STALE_DAYS) stale++;
    });
    return { stale, old };
  }, [passwords]);

  const presentOwners = React.useMemo(() => {
    if (!passwords) return [];
    const seen = new Set<string>();
    passwords.forEach((p) => seen.add((p as any).owner || "Me"));
    return FAMILY_MEMBERS.filter((m) => seen.has(m.label));
  }, [passwords]);

  const filtered = React.useMemo(() => {
    if (!passwords) return [];
    return passwords.filter((p) => {
      const ownerMatch = selectedOwner === "All" || (p as any).owner === selectedOwner;
      const catMatch = selectedCategory === "All" || p.category === selectedCategory;
      return ownerMatch && catMatch;
    });
  }, [passwords, selectedCategory, selectedOwner]);

  const categoryCounts = React.useMemo(() => {
    if (!passwords) return {};
    const source = selectedOwner === "All" ? passwords : passwords.filter(p => (p as any).owner === selectedOwner);
    return source.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [passwords, selectedOwner]);

  const ownerCounts = React.useMemo(() => {
    if (!passwords) return {};
    return passwords.reduce<Record<string, number>>((acc, p) => {
      const o = (p as any).owner || "Me";
      acc[o] = (acc[o] ?? 0) + 1;
      return acc;
    }, {});
  }, [passwords]);

  const handleCopy = (password: string, id: number) => {
    if (clipboardTimerRef.current) clearTimeout(clipboardTimerRef.current);
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    toast({ title: "Password copied", description: "Auto-cleared from clipboard in 30s", duration: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
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

  const totalStale = staleCounts.stale + staleCounts.old;

  return (
    <div className="space-y-5">
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

      {/* Stale password alert */}
      {totalStale > 0 && (
        <div className={cn(
          "flex items-start gap-3 px-4 py-3 rounded-xl border",
          staleCounts.old > 0
            ? "bg-red-50 border-red-200"
            : "bg-amber-50 border-amber-200"
        )}>
          <AlertCircle className={cn("h-4 w-4 mt-0.5 shrink-0", staleCounts.old > 0 ? "text-red-500" : "text-amber-600")} />
          <div className="min-w-0">
            <p className={cn("text-[13px] font-semibold", staleCounts.old > 0 ? "text-red-700" : "text-amber-800")}>
              {staleCounts.old > 0
                ? `${staleCounts.old} password${staleCounts.old > 1 ? "s" : ""} not changed in 6+ months — update recommended`
                : `${staleCounts.stale} password${staleCounts.stale > 1 ? "s" : ""} not changed in 3+ months`}
            </p>
            <p className={cn("text-[11.5px] mt-0.5", staleCounts.old > 0 ? "text-red-600" : "text-amber-700")}>
              Regular password changes keep your accounts secure. Look for the <Clock className="inline h-3 w-3" /> age badge on cards below.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value={stats.total}  label="Total saved" color="bg-blue-100 text-blue-700"    Icon={KeyRound}    />
          <StatCard value={stats.strong} label="Strong"      color="bg-emerald-100 text-emerald-700" Icon={ShieldCheck}  />
          <StatCard value={stats.medium} label="Medium"      color="bg-amber-100 text-amber-700"  Icon={AlertTriangle} />
          <StatCard value={stats.weak}   label="Weak — fix!" color="bg-red-100 text-red-700"      Icon={ShieldAlert}   />
        </div>
      )}

      {/* Family member filter */}
      {presentOwners.length > 1 && (
        <div className="bg-white border border-border rounded-xl p-3.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Filter by person</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOwner("All")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all",
                selectedOwner === "All"
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              👥 Everyone
              <span className={cn("text-[10.5px] rounded-full px-1.5 leading-5 font-bold", selectedOwner === "All" ? "bg-white/20" : "bg-muted")}>
                {passwords?.length ?? 0}
              </span>
            </button>
            {presentOwners.map((m) => {
              const count = ownerCounts[m.label] ?? 0;
              const isActive = selectedOwner === m.label;
              return (
                <button
                  key={m.label}
                  onClick={() => setSelectedOwner(m.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all",
                    isActive ? m.active : `${m.inactive} hover:border-current`
                  )}
                >
                  {m.emoji} {m.label}
                  <span className={cn("text-[10.5px] rounded-full px-1.5 leading-5 font-bold", isActive ? "bg-white/25" : "bg-white/70")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + category filter */}
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          {CATEGORIES.map((cat) => {
            const count = cat === "All"
              ? (selectedOwner === "All" ? (passwords?.length ?? 0) : (ownerCounts[selectedOwner] ?? 0))
              : (categoryCounts[cat] ?? 0);
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
                  <span className={cn("text-[10.5px] rounded-full px-1.5 py-0.5 leading-none font-bold", isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
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
              {search || selectedCategory !== "All" || selectedOwner !== "All" ? "No matches found" : "Vault is empty"}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 max-w-xs">
              {search || selectedCategory !== "All" || selectedOwner !== "All"
                ? "Try a different search term or filter."
                : "Add your first password and secure it with AES-256 encryption."}
            </p>
            {!search && selectedCategory === "All" && selectedOwner === "All" && (
              <PasswordFormDialog>
                <Button variant="outline">Add your first password</Button>
              </PasswordFormDialog>
            )}
            {(selectedCategory !== "All" || selectedOwner !== "All") && (
              <Button variant="ghost" onClick={() => { setSelectedCategory("All"); setSelectedOwner("All"); }} className="text-[13px]">
                Show all passwords
              </Button>
            )}
          </div>
        ) : (
          filtered.map((pwd) => {
            const catStyle = CAT_COLORS[pwd.category] ?? "bg-slate-100 text-slate-600";
            const ownerVal = (pwd as any).owner || "Me";
            const ownerEmoji = OWNER_EMOJI[ownerVal] || "👤";
            const ownerStyle = OWNER_INACTIVE[ownerVal] || "bg-slate-100 text-slate-600 border-slate-200";
            const isMyOwn = ownerVal === "Me";
            const ageDays = passwordAgeDays(pwd.updatedAt);
            return (
              <Card
                key={pwd.id}
                className={cn(
                  "bg-white border-border hover:border-primary/30 transition-all",
                  ageDays >= OLD_DAYS && "border-l-2 border-l-red-400",
                  ageDays >= STALE_DAYS && ageDays < OLD_DAYS && "border-l-2 border-l-amber-400"
                )}
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
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
                        {!isMyOwn && (
                          <span className={cn("hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", ownerStyle)}>
                            {ownerEmoji} {ownerVal}
                          </span>
                        )}
                        <AgeWarning days={ageDays} />
                      </div>
                      <p className="text-[12.5px] text-muted-foreground truncate">{pwd.username}</p>
                      {pwd.url && (
                        <p className="text-[11px] text-muted-foreground/60 truncate">
                          {pwd.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:block">
                      <StrengthBadge strength={pwd.strength} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost" size="icon"
                        className={`h-8 w-8 ${copiedUsernameId === pwd.id ? "text-emerald-600 bg-emerald-100" : "text-muted-foreground"}`}
                        onClick={() => handleCopyUsername(pwd.username ?? "", pwd.id)}
                        title="Copy username"
                      >
                        {copiedUsernameId === pwd.id ? <Check className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
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

      {filtered.length > 0 && (passwords?.length ?? 0) > 0 && (
        <p className="text-center text-[12px] text-muted-foreground pb-2">
          Showing {filtered.length} of {passwords?.length} passwords
          {selectedOwner !== "All" ? ` for ${selectedOwner}` : ""}
          {selectedCategory !== "All" ? ` in "${selectedCategory}"` : ""}
        </p>
      )}

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
