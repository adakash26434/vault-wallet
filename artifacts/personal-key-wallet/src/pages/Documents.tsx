import React, { useState } from "react";
import {
  useListDocuments,
  useDeleteDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FileText, Plus, MoreVertical, Trash2, Edit, ExternalLink,
  CalendarClock, Eye, ShieldCheck, CreditCard, Heart, Car, Home, Landmark,
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

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Identity: ShieldCheck,
  Financial: CreditCard,
  Medical: Heart,
  Vehicle: Car,
  Property: Home,
  Government: Landmark,
  Other: FileText,
};

// Updated for light professional theme — proper contrast on white cards
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Identity:   { bg: "bg-blue-100",   text: "text-blue-700" },
  Financial:  { bg: "bg-emerald-100", text: "text-emerald-700" },
  Medical:    { bg: "bg-rose-100",   text: "text-rose-700" },
  Vehicle:    { bg: "bg-orange-100", text: "text-orange-700" },
  Property:   { bg: "bg-violet-100", text: "text-violet-700" },
  Government: { bg: "bg-amber-100",  text: "text-amber-700" },
  Other:      { bg: "bg-slate-100",  text: "text-slate-600" },
};

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired)
    return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Expired</Badge>;
  if (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30)
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        Expires in {doc.daysUntilExpiry}d
      </Badge>
    );
  return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
      Valid
    </Badge>
  );
}

export default function Documents() {
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
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Documents</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">
            Store and preview your important Nepali documents.
          </p>
        </div>
        <DocumentFormDialog>
          <Button style={{ background: "hsl(var(--primary))" }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </DocumentFormDialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : documents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-white">
            <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-[16px] font-bold">No documents yet</h3>
            <p className="text-[13px] text-muted-foreground mt-1 mb-5 max-w-xs">
              Add your citizenship card, passport, driving licence, and other important documents.
            </p>
            <DocumentFormDialog>
              <Button variant="outline">Add your first document</Button>
            </DocumentFormDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents?.map((doc) => {
              const CategoryIcon = CATEGORY_ICONS[doc.category] ?? FileText;
              const style = CATEGORY_STYLES[doc.category] ?? CATEGORY_STYLES.Other;
              return (
                <Card
                  key={doc.id}
                  className="bg-white border-border hover:border-[hsl(var(--primary))/50] transition-all group cursor-pointer"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  onClick={() => setPreviewDocument(doc)}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className={`h-11 w-11 rounded-xl flex shrink-0 items-center justify-center ${style.bg}`}>
                          <CategoryIcon className={`h-5 w-5 ${style.text}`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[14px] text-foreground truncate">{doc.name}</h4>
                          <p className={`text-[12px] font-medium ${style.text}`}>{doc.category}</p>
                          {doc.documentNumber && (
                            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                              #{doc.documentNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="-mr-1.5 -mt-1.5 h-8 w-8">
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

                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <div className="flex items-center text-[12px] text-muted-foreground">
                        {doc.expiryDate ? (
                          <>
                            <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                            Expires {formatDate(doc.expiryDate)}
                          </>
                        ) : (
                          <span className="text-[12px]">No expiry date</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ExpiryBadge doc={doc} />
                        <span className="text-[11px] text-muted-foreground/60 group-hover:text-primary transition-colors flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
