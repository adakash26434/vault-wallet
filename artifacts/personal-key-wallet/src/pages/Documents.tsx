import React, { useState } from "react";
import { 
  useListDocuments, 
  useDeleteDocument,
  getListDocumentsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FileText, Plus, MoreVertical, Trash2, Edit, ExternalLink,
  CalendarClock, Eye,
  ShieldCheck, CreditCard, Heart, Car, Home, Landmark,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const CATEGORY_COLORS: Record<string, string> = {
  Identity: "bg-blue-500/15 text-blue-400",
  Financial: "bg-emerald-500/15 text-emerald-400",
  Medical: "bg-rose-500/15 text-rose-400",
  Vehicle: "bg-orange-500/15 text-orange-400",
  Property: "bg-violet-500/15 text-violet-400",
  Government: "bg-amber-500/15 text-amber-400",
  Other: "bg-slate-500/15 text-slate-400",
};

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired) return <Badge variant="destructive">Expired</Badge>;
  if (doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry <= 30)
    return <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20 border-amber-500/30">Expiring in {doc.daysUntilExpiry}d</Badge>;
  return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Valid</Badge>;
}

export default function Documents() {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments({}, { query: { queryKey: getListDocumentsQueryKey() } });
  const deleteMutation = useDeleteDocument();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            toast({ title: "Document deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Secure Documents</h1>
          <p className="text-muted-foreground mt-1">Store and preview your important documents.</p>
        </div>
        <DocumentFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </DocumentFormDialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : documents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card/50">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No documents yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add your citizenship, passport, licence, and other documents here.
            </p>
            <DocumentFormDialog>
              <Button variant="outline">Add Document</Button>
            </DocumentFormDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents?.map(doc => {
              const CategoryIcon = CATEGORY_ICONS[doc.category] ?? FileText;
              const iconColor = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.Other;
              return (
                <Card
                  key={doc.id}
                  className="bg-card border-border hover:border-primary/50 transition-all group cursor-pointer"
                  onClick={() => setPreviewDocument(doc)}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-11 w-11 rounded-xl flex shrink-0 items-center justify-center ${iconColor}`}>
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{doc.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{doc.category}</p>
                          {doc.documentNumber && (
                            <p className="text-xs text-muted-foreground/70 font-mono truncate mt-0.5">
                              #{doc.documentNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl!, '_blank'); }}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Open Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center text-sm text-muted-foreground">
                        {doc.expiryDate ? (
                          <>
                            <CalendarClock className="h-4 w-4 mr-1.5" />
                            Expires {formatDate(doc.expiryDate)}
                          </>
                        ) : (
                          <span className="text-xs">No expiry</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ExpiryBadge doc={doc} />
                        <span className="text-xs text-muted-foreground/50 group-hover:text-primary transition-colors flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Tap to view
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
