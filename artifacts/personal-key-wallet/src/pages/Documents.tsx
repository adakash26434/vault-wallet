import React, { useState } from "react";
import { 
  useListDocuments, 
  useDeleteDocument,
  getListDocumentsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Plus, MoreVertical, Trash2, Edit, ExternalLink, CalendarClock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DocumentFormDialog from "@/components/DocumentFormDialog";
import { Document } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  
  if (doc.isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }
  
  if (doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry <= 30) {
    return <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20 border-amber-500/30">Expiring in {doc.daysUntilExpiry}d</Badge>;
  }
  
  return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Valid</Badge>;
}

export default function Documents() {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments({}, { query: { queryKey: getListDocumentsQueryKey() } });
  
  const deleteMutation = useDeleteDocument();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this document reference?")) {
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
          <p className="text-muted-foreground mt-1">Manage important files and expiry dates.</p>
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
            <h3 className="text-lg font-medium">No documents found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Your vault is empty. Add references to your important documents.
            </p>
            <DocumentFormDialog>
              <Button variant="outline">Add Document</Button>
            </DocumentFormDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents?.map(doc => (
              <Card key={doc.id} className="bg-card border-border hover:border-primary/50 transition-colors group">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-md bg-secondary flex flex-shrink-0 items-center justify-center text-secondary-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{doc.category}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingDocument(doc)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        {doc.fileUrl && (
                          <DropdownMenuItem onClick={() => window.open(doc.fileUrl!, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" /> Open Link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/50">
                    <div className="flex items-center text-sm text-muted-foreground">
                      {doc.expiryDate ? (
                        <>
                          <CalendarClock className="h-4 w-4 mr-1.5" />
                          {formatDate(doc.expiryDate)}
                        </>
                      ) : (
                        <span className="text-xs">No expiry</span>
                      )}
                    </div>
                    <ExpiryBadge doc={doc} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DocumentFormDialog 
        open={!!editingDocument} 
        onOpenChange={(open) => !open && setEditingDocument(null)}
        document={editingDocument || undefined} 
      />
    </div>
  );
}
