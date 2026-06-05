import React, { useState } from "react";
import { 
  useListPasswords, 
  useDeletePassword, 
  useGetPasswordStats,
  getListPasswordsQueryKey,
  getGetPasswordStatsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Plus, Search, Copy, MoreVertical, Trash2, Edit, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PasswordFormDialog from "@/components/PasswordFormDialog";
import { PasswordEntry } from "@workspace/api-client-react/src/generated/api.schemas";

function StrengthBadge({ strength }: { strength?: string }) {
  if (strength === 'strong') return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Strong</Badge>;
  if (strength === 'medium') return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Medium</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Weak</Badge>;
}

export default function Passwords() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
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
    toast({ title: "Password copied to clipboard", duration: 2000 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this password?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
            toast({ title: "Password deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Password Vault</h1>
          <p className="text-muted-foreground mt-1">Manage your secure credentials.</p>
        </div>
        <PasswordFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Password
          </Button>
        </PasswordFormDialog>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{stats.total}</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Total</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-emerald-500">{stats.strong}</span>
            <span className="text-xs text-emerald-500/70 mt-1 uppercase tracking-wider">Strong</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-amber-500">{stats.medium}</span>
            <span className="text-xs text-amber-500/70 mt-1 uppercase tracking-wider">Medium</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-destructive">{stats.weak}</span>
            <span className="text-xs text-destructive/70 mt-1 uppercase tracking-wider">Weak</span>
          </div>
        </div>
      )}

      <div className="flex relative items-center w-full max-w-md">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search passwords..." 
          className="pl-9 bg-card border-border"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : passwords?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card/50">
            <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No passwords found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {search ? "No passwords match your search." : "Your vault is empty. Add your first password to get started."}
            </p>
            {!search && (
              <PasswordFormDialog>
                <Button variant="outline">Add Password</Button>
              </PasswordFormDialog>
            )}
          </div>
        ) : (
          passwords?.map(pwd => (
            <Card key={pwd.id} className="bg-card border-border hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary font-bold uppercase">
                    {pwd.title.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{pwd.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{pwd.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:block">
                    <StrengthBadge strength={pwd.strength} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon"
                      onClick={() => handleCopy(pwd.password, pwd.id)}
                      className={copiedId === pwd.id ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" : ""}
                    >
                      {copiedId === pwd.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingPassword(pwd)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(pwd.id)}>
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

      <PasswordFormDialog 
        open={!!editingPassword} 
        onOpenChange={(open) => !open && setEditingPassword(null)}
        password={editingPassword || undefined} 
      />
    </div>
  );
}
