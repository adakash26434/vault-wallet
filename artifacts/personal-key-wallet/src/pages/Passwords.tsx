import React, { useState } from "react";
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
  Check, User, ShieldAlert, ShieldCheck, AlertTriangle,
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
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<number | null>(null);

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

  const handleCopy = (password: string, id: number) => {
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    toast({ title: "Password copied", description: "Cleared from clipboard in 30s", duration: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyUsername = (username: string, id: number) => {
    navigator.clipboard.writeText(username);
    setCopiedUsernameId(id);
    toast({ title: "Username copied", duration: 2000 });
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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">All your credentials, encrypted end-to-end.</p>
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
          <StatCard value={stats.total} label="Total saved" color="bg-blue-100 text-blue-700" Icon={KeyRound} />
          <StatCard value={stats.strong} label="Strong" color="bg-emerald-100 text-emerald-700" Icon={ShieldCheck} />
          <StatCard value={stats.medium} label="Medium" color="bg-amber-100 text-amber-700" Icon={AlertTriangle} />
          <StatCard value={stats.weak} label="Weak — fix!" color="bg-red-100 text-red-700" Icon={ShieldAlert} />
        </div>
      )}

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, username, or URL…"
          className="pl-9 bg-white border-border h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))
        ) : passwords?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-white">
            <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-blue-700" />
            </div>
            <h3 className="text-[16px] font-bold">
              {search ? "No matches found" : "Vault is empty"}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 max-w-xs">
              {search
                ? "Try a different search term."
                : "Add your first password and secure it with AES-256 encryption."}
            </p>
            {!search && (
              <PasswordFormDialog>
                <Button variant="outline">Add your first password</Button>
              </PasswordFormDialog>
            )}
          </div>
        ) : (
          passwords?.map((pwd) => (
            <Card
              key={pwd.id}
              className="bg-white border-border hover:border-[hsl(210,100%,40%)/40%] transition-all"
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
                    <h4 className="font-bold text-[14px] text-foreground truncate">{pwd.title}</h4>
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
                      title="Copy password"
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
          ))
        )}
      </div>

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
