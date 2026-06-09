import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateDocument, useUpdateDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
import { Document } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, FileText, ShieldCheck, CreditCard, Heart,
  Car, Home, Landmark, Hash, Building2, Link2, StickyNote, CalendarDays,
} from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  category: z.string().min(1, "Category is required"),
  documentNumber: z.string().optional(),
  issuedBy: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

interface DocumentFormDialogProps {
  children?: React.ReactNode;
  document?: Document;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CATEGORIES: Array<{
  name: string;
  Icon: React.ElementType;
  bg: string;
  text: string;
  activeBorder: string;
  placeholder: string;
}> = [
  { name: "Identity",   Icon: ShieldCheck, bg: "bg-blue-100",   text: "text-blue-700",   activeBorder: "border-blue-500",   placeholder: "e.g. Citizenship Card, Passport" },
  { name: "Financial",  Icon: CreditCard,  bg: "bg-emerald-100", text: "text-emerald-700", activeBorder: "border-emerald-500", placeholder: "e.g. Bank Card, Insurance Policy" },
  { name: "Medical",    Icon: Heart,       bg: "bg-rose-100",   text: "text-rose-700",   activeBorder: "border-rose-500",   placeholder: "e.g. Health Insurance, Medical Record" },
  { name: "Vehicle",    Icon: Car,         bg: "bg-orange-100", text: "text-orange-700", activeBorder: "border-orange-500", placeholder: "e.g. Bluebook, Driving Licence" },
  { name: "Property",   Icon: Home,        bg: "bg-violet-100", text: "text-violet-700", activeBorder: "border-violet-500", placeholder: "e.g. Land Registration, Lease" },
  { name: "Government", Icon: Landmark,    bg: "bg-amber-100",  text: "text-amber-700",  activeBorder: "border-amber-500",  placeholder: "e.g. PAN Card, Voter ID" },
  { name: "Other",      Icon: FileText,    bg: "bg-slate-100",  text: "text-slate-600",  activeBorder: "border-slate-400",  placeholder: "e.g. Certificate, Letter" },
];

export default function DocumentFormDialog({
  children, document, open, onOpenChange,
}: DocumentFormDialogProps) {
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
      issueDate: document?.issueDate ? new Date(document.issueDate).toISOString().split("T")[0] : "",
      expiryDate: document?.expiryDate ? new Date(document.expiryDate).toISOString().split("T")[0] : "",
      fileUrl: document?.fileUrl || "",
      notes: document?.notes || "",
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    form.reset({
      name: document?.name || "",
      category: document?.category || "Identity",
      documentNumber: document?.documentNumber || "",
      issuedBy: document?.issuedBy || "",
      issueDate: document?.issueDate ? new Date(document.issueDate).toISOString().split("T")[0] : "",
      expiryDate: document?.expiryDate ? new Date(document.expiryDate).toISOString().split("T")[0] : "",
      fileUrl: document?.fileUrl || "",
      notes: document?.notes || "",
    });
  }, [document, isOpen]);

  const selectedCategory = form.watch("category");
  const activeCat = CATEGORIES.find((c) => c.name === selectedCategory) ?? CATEGORIES[0];

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (document) {
      updateMutation.mutate(
        { id: document.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            toast({ title: "Document updated" });
            setIsOpen(false);
          },
          onError: (e: any) =>
            toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
            toast({ title: "Document saved" });
            setIsOpen(false);
            form.reset();
          },
          onError: (e: any) =>
            toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0 max-h-[92vh]">
        {/* Header band */}
        <div className={`px-6 pt-5 pb-4 ${activeCat.bg} border-b border-border/30`}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${activeCat.bg} border-2 ${activeCat.activeBorder} flex items-center justify-center`}>
                <activeCat.Icon className={`h-5 w-5 ${activeCat.text}`} />
              </div>
              <DialogTitle className="text-[17px] font-bold text-foreground">
                {document ? "Edit Document" : "Add Document"}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-80px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

              {/* Category picker */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold">Category</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORIES.slice(0, 4).map(({ name, Icon, bg, text, activeBorder }) => {
                        const active = field.value === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => field.onChange(name)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all ${
                              active
                                ? `${bg} ${activeBorder}`
                                : "bg-white border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                            }`}
                          >
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${active ? bg : "bg-muted/50"}`}>
                              <Icon className={`h-4 w-4 ${active ? text : "text-muted-foreground"}`} />
                            </div>
                            <span className={`text-[10.5px] font-semibold ${active ? text : "text-muted-foreground"}`}>
                              {name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.slice(4).map(({ name, Icon, bg, text, activeBorder }) => {
                        const active = field.value === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => field.onChange(name)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all ${
                              active
                                ? `${bg} ${activeBorder}`
                                : "bg-white border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                            }`}
                          >
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${active ? bg : "bg-muted/50"}`}>
                              <Icon className={`h-4 w-4 ${active ? text : "text-muted-foreground"}`} />
                            </div>
                            <span className={`text-[10.5px] font-semibold ${active ? text : "text-muted-foreground"}`}>
                              {name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold">Document Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={activeCat.placeholder}
                        className="h-10 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document number + Issued by */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        Document No.
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 12345678" className="h-10 font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issuedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Issued By
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. DAO Kathmandu" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Issue date + Expiry date */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        Issue Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="h-10 bg-muted/20" {...field} />
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
                      <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        Expiry Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="h-10 bg-muted/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File URL */}
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      File URL
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://drive.google.com/..." className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                      Notes
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any extra information about this document…"
                        className="resize-none h-20 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1 h-10 font-bold">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {document ? "Save Changes" : "Save Document"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
