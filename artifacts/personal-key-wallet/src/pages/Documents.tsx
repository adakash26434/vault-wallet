import React, { useState } from "react";
import {
  useListDocuments,
  useDeleteDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Plus, MoreVertical, Trash2, Edit, ExternalLink,
  CalendarClock, Eye, ShieldCheck, CreditCard, Heart, Car,
  Home, Landmark, Search, Filter, CalendarDays, Hash, Building2,
  AlertTriangle, CheckCircle2,
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
import DocumentFormDialog from "@/components/DocumentFormDialog";
import DocumentPreviewDialog from "@/components/DocumentPreviewDialog";
import { Document } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<string, {
  Icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  headerBg: string;
  emoji: string;
}> = {
  Identity:   { Icon: ShieldCheck, bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",   emoji: "🪪" },
  Financial:  { Icon: CreditCard,  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",headerBg: "bg-gradient-to-r from-emerald-500 to-emerald-600", emoji: "💳" },
  Medical:    { Icon: Heart,       bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",   headerBg: "bg-gradient-to-r from-rose-500 to-rose-600",   emoji: "🏥" },
  Vehicle:    { Icon: Car,         bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200", headerBg: "bg-gradient-to-r from-orange-400 to-orange-500", emoji: "🚗" },
  Property:   { Icon: Home,        bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200", headerBg: "bg-gradient-to-r from-violet-500 to-violet-600", emoji: "🏠" },
  Government: { Icon: Landmark,    bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  headerBg: "bg-gradient-to-r from-amber-500 to-amber-600", emoji: "🏛️" },
  Other:      { Icon: FileText,    bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",  headerBg: "bg-gradient-to-r from-slate-400 to-slate-500", emoji: "📄" },
};

const ALL_CATEGORIES = ["All", "Identity", "Financial", "Medical", "Vehicle", "Property", "Government", "Other"];

function ExpiryStatus({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired)
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="text-[11.5px] font-semibold">Expired</span>
      </div>
    );
  if (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30)
    return (
      <div className="flex items-center gap-1 text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="text-[11.5px] font-semibold">Expires in {doc.daysUntilExpiry}d</span>
      </div>
    );
  return (
    <div className="flex items-center gap-1 text-emerald-600">
      <CheckCircle2 className="h-3.5 w-3.5" />
      <span className="text-[11.5px] font-semibold">Valid</span>
    </div>
  );
}

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired)
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 text-[10.5px]">Expired</Badge>;
  if (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30)
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10.5px]">Expires {doc.daysUntilExpiry}d</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10.5px]">Valid</Badge>;
}

export default function Documents() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments(
    {},
    { query: { queryKey: getListDocumentsQueryKey() } }
  );
  const deleteMutation = useDeleteDocument();

  const filtered = React.useMemo(() => {
    if (!documents) return [];
    let result = documents;
    if (selectedCategory !== "All") result = result.filter((d) => d.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.documentNumber ?? "").toLowerCase().includes(q) ||
        (d.issuedBy ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, selectedCategory, search]);

  const categoryCounts = React.useMemo(() => {
    if (!documents) return {} as Record<string, number>;
    return documents.reduce<Record<string, number>>((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [documents]);

  const expiringSoon = documents?.filter((d) => !d.isExpired && d.daysUntilExpiry != null && d.daysUntilExpiry <= 30).length ?? 0;
  const expired = documents?.filter((d) => d.isExpired).length ?? 0;

  const handleDeleteConfirm = () => {
    if (deletingId == null) return;
    deleteMutation.mutate(
      { id: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
          toast({ title: "Document deleted" });
          setDeletingId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete document", variant: "destructive" });
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
          <h1 className="text-2xl font-bold tracking-tight">Secure Documents</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">
            Store and access your important Nepali documents — encrypted and safe.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {expired > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
              <AlertTriangle className="h-3 w-3" /> {expired} expired
            </Badge>
          )}
          {expiringSoon > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
              <CalendarClock className="h-3 w-3" /> {expiringSoon} expiring soon
            </Badge>
          )}
          <DocumentFormDialog>
            <Button style={{ background: "hsl(var(--primary))" }} className="h-10 gap-2">
              <Plus className="h-4 w-4" /> Add Document
            </Button>
          </DocumentFormDialog>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, number, or issuing authority…"
            className="pl-9 bg-white border-border h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
          {ALL_CATEGORIES.map((cat) => {
            const count = cat === "All" ? (documents?.length ?? 0) : (categoryCounts[cat] ?? 0);
            if (cat !== "All" && count === 0) return null;
            const isActive = selectedCategory === cat;
            const meta = cat !== "All" ? CATEGORY_META[cat] : null;
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
                {meta && <span className="text-[12px]">{meta.emoji}</span>}
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

      {/* Document grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 && documents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card">
            <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-[16px] font-bold">No documents yet</h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 max-w-xs">
              Add your citizenship card, passport, driving licence, PAN card, and other important documents.
            </p>
            <DocumentFormDialog>
              <Button variant="outline">Add your first document</Button>
            </DocumentFormDialog>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl bg-card">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-[15px] font-bold">No matches</h3>
            <p className="text-[13px] text-muted-foreground mt-1">Try a different search term or category.</p>
            <Button variant="ghost" className="mt-3 text-[13px]"
              onClick={() => { setSearch(""); setSelectedCategory("All"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doc) => {
              const meta = CATEGORY_META[doc.category] ?? CATEGORY_META.Other;
              const { Icon: CategoryIcon } = meta;
              const isUrgent = doc.isExpired || (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30);

              return (
                <div
                  key={doc.id}
                  className={cn(
                    "group bg-card rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5",
                    isUrgent ? "border-amber-200 hover:border-amber-300" : "border-border hover:border-primary/30",
                    "hover:shadow-md"
                  )}
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
                  onClick={() => setPreviewDocument(doc)}
                >
                  {/* Colored header strip */}
                  <div className={cn("h-2 w-full", isUrgent && doc.isExpired ? "bg-red-500" : isUrgent ? "bg-amber-400" : meta.headerBg)} />

                  <div className="p-4">
                    {/* Top row: icon + name + menu */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("h-11 w-11 rounded-xl flex shrink-0 items-center justify-center text-xl", meta.bg)}>
                          {meta.emoji}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[14px] text-foreground leading-snug">{doc.name}</h4>
                          <span className={cn("text-[11px] font-semibold", meta.text)}>{doc.category}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewDocument(doc); }}>
                            <Eye className="h-4 w-4 mr-2" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingDocument(doc); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {doc.fileUrl && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl!, "_blank"); }}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Open Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeletingId(doc.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Details rows */}
                    <div className="space-y-1.5">
                      {doc.documentNumber && (
                        <div className="flex items-center gap-2 text-[12px]">
                          <Hash className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="font-mono text-muted-foreground truncate">{doc.documentNumber}</span>
                        </div>
                      )}
                      {doc.issuedBy && (
                        <div className="flex items-center gap-2 text-[12px]">
                          <Building2 className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-muted-foreground truncate">{doc.issuedBy}</span>
                        </div>
                      )}
                      {doc.issueDate && (
                        <div className="flex items-center gap-2 text-[12px]">
                          <CalendarDays className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                          <span className="text-muted-foreground">Issued {formatDate(doc.issueDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer: expiry status + badge */}
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      {doc.expiryDate ? (
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className={cn("h-3.5 w-3.5", doc.isExpired ? "text-red-500" : doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30 ? "text-amber-500" : "text-muted-foreground/60")} />
                          <span className="text-[12px] text-muted-foreground">Expires {formatDate(doc.expiryDate)}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/50">No expiry</span>
                      )}
                      <div className="flex items-center gap-2">
                        <ExpiryBadge doc={doc} />
                        <Eye className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (documents?.length ?? 0) > 0 && (
        <p className="text-center text-[12px] text-muted-foreground pb-2">
          {filtered.length} of {documents?.length} document{documents?.length !== 1 ? "s" : ""}
          {selectedCategory !== "All" ? ` in "${selectedCategory}"` : ""}
        </p>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deletingId != null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the document from your vault. This action cannot be undone.
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

      <DocumentFormDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        document={editingDocument || undefined}
      />

      <DocumentPreviewDialog
        document={previewDocument}
        open={!!previewDocument}
        onOpenChange={(open) => !open && setPreviewDocument(null)}
        onEdit={() => {
          setEditingDocument(previewDocument);
          setPreviewDocument(null);
        }}
      />
    </div>
  );
}
