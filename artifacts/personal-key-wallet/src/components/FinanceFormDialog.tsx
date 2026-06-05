import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateFinanceRecord, useUpdateFinanceRecord, getListFinanceRecordsQueryKey, getGetFinanceSummaryQueryKey } from "@workspace/api-client-react";
import { FinanceRecord, FinanceInputType } from "@workspace/api-client-react/src/generated/api.schemas";
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
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

interface FinanceFormDialogProps {
  children?: React.ReactNode;
  record?: FinanceRecord;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const INCOME_CATEGORIES = ["Salary", "Investments", "Gifts", "Other"];
const EXPENSE_CATEGORIES = ["Housing", "Food", "Transportation", "Utilities", "Insurance", "Healthcare", "Personal", "Debt", "Other"];

export default function FinanceFormDialog({ children, record, open, onOpenChange }: FinanceFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const createMutation = useCreateFinanceRecord();
  const updateMutation = useUpdateFinanceRecord();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: record?.type || "expense",
      category: record?.category || "Housing",
      amount: record?.amount || 0,
      date: record?.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: record?.description || "",
    },
  });

  const selectedType = form.watch("type");
  const categories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  React.useEffect(() => {
    if (record && isOpen) {
      form.reset({
        type: record.type,
        category: record.category,
        amount: record.amount,
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: record.description || "",
      });
    } else if (!record && isOpen) {
      form.reset({
        type: "expense",
        category: "Housing",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: "",
      });
    }
  }, [record, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      type: values.type as FinanceInputType
    };

    if (record) {
      updateMutation.mutate(
        { id: record.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
            toast({ title: "Record updated successfully" });
            setIsOpen(false);
          },
          onError: (error: any) => {
            toast({ 
              title: "Failed to update record", 
              description: error.message || "An error occurred", 
              variant: "destructive" 
            });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
            toast({ title: "Record added successfully" });
            setIsOpen(false);
            form.reset();
          },
          onError: (error: any) => {
            toast({ 
              title: "Failed to add record", 
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
          <DialogTitle>{record ? "Edit Record" : "Add Finance Record"}</DialogTitle>
          <DialogDescription>
            {record ? "Update transaction details." : "Log a new transaction."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={(val) => {
                      field.onChange(val);
                      // Reset category if changing type to ensure valid category
                      form.setValue("category", val === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(c => (
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What was this for?" className="resize-none" {...field} />
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
                {record ? "Save Changes" : "Add Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
