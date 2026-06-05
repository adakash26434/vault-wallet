import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDocument, useUpdateDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Document } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  documentNumber: z.string().optional(),
  issuedBy: z.string().optional(),
  issueDate: z.string().optional(),
  fileUrl: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

interface DocumentFormDialogProps {
  children?: React.ReactNode;
  document?: Document;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CATEGORIES = ["Identity", "Financial", "Medical", "Vehicle", "Property", "Government", "Other"];

export default function DocumentFormDialog({ children, document, open, onOpenChange }: DocumentFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: document?.name || "",
      category: document?.category || "Identity",
      documentNumber: document?.documentNumber || "",
      issuedBy: document?.issuedBy || "",
      issueDate: document?.issueDate ? new Date(document.issueDate).toISOString().split('T')[0] : "",
      fileUrl: document?.fileUrl || "",
      expiryDate: document?.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "",
      notes: document?.notes || "",
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: document?.name || "",
        category: document?.category || "Identity",
        documentNumber: document?.documentNumber || "",
        issuedBy: document?.issuedBy || "",
        issueDate: document?.issueDate ? new Date(document.issueDate).toISOString().split('T')[0] : "",
        fileUrl: document?.fileUrl || "",
        expiryDate: document?.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "",
        notes: document?.notes || "",
      });
    }
  }, [document, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (document) {
      updateMutation.mutate(
        { id: document.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            toast({ title: "Document updated successfully" });
            setIsOpen(false);
          },
          onError: (error: any) => {
            toast({ title: "Failed to update document", description: error.message, variant: "destructive" });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            toast({ title: "Document added successfully" });
            setIsOpen(false);
            form.reset();
          },
          onError: (error: any) => {
            toast({ title: "Failed to add document", description: error.message, variant: "destructive" });
          }
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document ? "Edit Document" : "Add New Document"}</DialogTitle>
          <DialogDescription>
            {document ? "Update document details." : "Store your document details securely."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Passport, Citizenship" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123-456-789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuedBy"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Issued By</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. District Administration Office, Kathmandu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information…" className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {document ? "Save Changes" : "Add Document"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
