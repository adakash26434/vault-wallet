import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDocument, useUpdateDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Document } from "@workspace/api-client-react/src/generated/api.schemas";
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

const CATEGORIES = ["Identity", "Financial", "Medical", "Vehicle", "Property", "Other"];

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
      fileUrl: document?.fileUrl || "",
      expiryDate: document?.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "",
      notes: document?.notes || "",
    },
  });
  
  React.useEffect(() => {
    if (document && isOpen) {
      form.reset({
        name: document.name,
        category: document.category || "Identity",
        fileUrl: document.fileUrl || "",
        expiryDate: document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "",
        notes: document.notes || "",
      });
    } else if (!document && isOpen) {
      form.reset({
        name: "",
        category: "Identity",
        fileUrl: "",
        expiryDate: "",
        notes: "",
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
            toast({ 
              title: "Failed to update document", 
              description: error.message || "An error occurred", 
              variant: "destructive" 
            });
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
            toast({ 
              title: "Failed to add document", 
              description: error.message || "An error occurred", 
              variant: "destructive" 
            });
          }
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{document ? "Edit Document" : "Add New Document"}</DialogTitle>
          <DialogDescription>
            {document ? "Update document details." : "Add a new document reference."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Passport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
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
                  <FormLabel>File URL (Optional)</FormLabel>
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="mr-2">
                Cancel
              </Button>
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
