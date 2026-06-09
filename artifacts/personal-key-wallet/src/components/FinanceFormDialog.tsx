import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateFinanceRecord, useUpdateFinanceRecord,
  getListFinanceRecordsQueryKey, getGetFinanceSummaryQueryKey,
} from "@workspace/api-client-react";
import { FinanceRecord, FinanceInputType } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowUpRight, ArrowDownRight, Loader2,
  Briefcase, Building2, Laptop, Home, Send, TrendingUp, Gift,
  Utensils, ShoppingBasket, Car, Smartphone, Zap, Heart,
  GraduationCap, ShoppingCart, Music, PiggyBank, MoreHorizontal,
} from "lucide-react";

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

const INCOME_CATEGORIES = [
  { name: "Salary",      Icon: Briefcase },
  { name: "Business",    Icon: Building2 },
  { name: "Freelance",   Icon: Laptop },
  { name: "Rental",      Icon: Home },
  { name: "Remittance",  Icon: Send },
  { name: "Investments", Icon: TrendingUp },
  { name: "Gifts",       Icon: Gift },
  { name: "Other",       Icon: MoreHorizontal },
];

const EXPENSE_CATEGORIES = [
  { name: "Food & Dining",   Icon: Utensils },
  { name: "Groceries",       Icon: ShoppingBasket },
  { name: "Transport",       Icon: Car },
  { name: "Mobile/Internet", Icon: Smartphone },
  { name: "Rent",            Icon: Home },
  { name: "Utilities",       Icon: Zap },
  { name: "Healthcare",      Icon: Heart },
  { name: "Education",       Icon: GraduationCap },
  { name: "Shopping",        Icon: ShoppingCart },
  { name: "Entertainment",   Icon: Music },
  { name: "Savings",         Icon: PiggyBank },
  { name: "Other",           Icon: MoreHorizontal },
];

export default function FinanceFormDialog({
  children, record, open, onOpenChange,
}: FinanceFormDialogProps) {
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
      category: record?.category || "Food & Dining",
      amount: record?.amount || undefined,
      date: record?.date
        ? new Date(record.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      description: record?.description || "",
    },
  });

  const selectedType = form.watch("type");
  const categories = selectedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  React.useEffect(() => {
    if (!isOpen) return;
    if (record) {
      form.reset({
        type: record.type,
        category: record.category,
        amount: record.amount,
        date: record.date
          ? new Date(record.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: record.description || "",
      });
    } else {
      form.reset({
        type: "expense",
        category: "Food & Dining",
        amount: undefined,
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [record, isOpen]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = { ...values, type: values.type as FinanceInputType };

    if (record) {
      updateMutation.mutate(
        { id: record.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
            toast({ title: "Record updated" });
            setIsOpen(false);
          },
          onError: (e: any) =>
            toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
            toast({ title: "Record added" });
            setIsOpen(false);
            form.reset();
          },
          onError: (e: any) =>
            toast({ title: "Failed to add", description: e.message, variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isIncome = selectedType === "income";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
        {/* Coloured header */}
        <div
          className="px-6 pt-5 pb-4"
          style={{
            background: isIncome
              ? "linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)"
              : "linear-gradient(135deg,#fee2e2 0%,#fecaca 100%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold text-foreground">
              {record ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
          </DialogHeader>

          {/* Income / Expense toggle */}
          <div className="flex gap-2 mt-4">
            {(["income", "expense"] as const).map((t) => {
              const active = selectedType === t;
              const isInc = t === "income";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    form.setValue("type", t);
                    const cats = isInc ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                    const currentCat = form.getValues("category");
                    const stillValid = cats.some((c) => c.name === currentCat);
                    if (!stillValid) form.setValue("category", cats[0].name);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold border-2 transition-all ${
                    active
                      ? isInc
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-red-500 text-white border-red-500 shadow-sm"
                      : "bg-white/60 text-muted-foreground border-white/80 hover:bg-white/80"
                  }`}
                >
                  {isInc
                    ? <ArrowUpRight className="h-4 w-4" />
                    : <ArrowDownRight className="h-4 w-4" />}
                  {isInc ? "Income" : "Expense"}
                </button>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-muted-foreground select-none">
                        Rs.
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10 h-11 text-[18px] font-bold pr-3 bg-muted/30 border-border"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category grid */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold">Category</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map(({ name, Icon }) => {
                      const active = field.value === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => field.onChange(name)}
                          className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border-2 transition-all ${
                            active
                              ? isIncome
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                : "bg-red-50 border-red-400 text-red-700"
                              : "bg-white border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/20"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] font-semibold leading-tight text-center">
                            {name.split("/")[0].split(" & ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date & Description */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-10 bg-muted/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold">
                      Note <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lunch at Bhat-Bhateni" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-10 font-bold"
                style={{
                  background: isIncome ? "#059669" : "#ef4444",
                  color: "white",
                }}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {record ? "Save Changes" : isIncome ? "Add Income" : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
