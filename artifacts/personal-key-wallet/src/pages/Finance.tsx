import React, { useState } from "react";
import {
  useListFinanceRecords,
  useDeleteFinanceRecord,
  useGetFinanceSummary,
  getListFinanceRecordsQueryKey,
  getGetFinanceSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Wallet, Plus, ArrowUpRight, ArrowDownRight, MoreVertical,
  Trash2, Edit, ChevronLeft, ChevronRight, TrendingUp,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FinanceFormDialog from "@/components/FinanceFormDialog";
import { FinanceRecord } from "@workspace/api-client-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type TypeFilter = "all" | "income" | "expense";

function formatNPR(amount: number) {
  return "Rs. " + Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Finance() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records, isLoading } = useListFinanceRecords(
    { month: String(selectedMonth), year: selectedYear },
    { query: { queryKey: getListFinanceRecordsQueryKey({ month: String(selectedMonth), year: selectedYear }) } }
  );
  const { data: summary, isLoading: isLoadingSummary } = useGetFinanceSummary(
    { month: selectedMonth, year: selectedYear },
    { query: { queryKey: getGetFinanceSummaryQueryKey({ month: selectedMonth, year: selectedYear }) } }
  );

  const deleteMutation = useDeleteFinanceRecord();

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };
  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  // Client-side type filter
  const filteredRecords = React.useMemo(() => {
    if (!records) return [];
    if (typeFilter === "all") return records;
    return records.filter((r) => r.type === typeFilter);
  }, [records, typeFilter]);

  const incomeCount  = records?.filter((r) => r.type === "income").length ?? 0;
  const expenseCount = records?.filter((r) => r.type === "expense").length ?? 0;

  const handleDeleteConfirm = () => {
    if (deletingId == null) return;
    deleteMutation.mutate(
      { id: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
          toast({ title: "Record deleted" });
          setDeletingId(null);
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
          setDeletingId(null);
        },
      }
    );
  };

  const savingsRate = summary?.savingsRate ?? 0;
  const savingsColor = savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 0 ? "text-amber-600" : "text-red-600";

  const FILTERS: { key: TypeFilter; label: string; count: number }[] = [
    { key: "all",     label: "All",      count: records?.length ?? 0 },
    { key: "income",  label: "Income",   count: incomeCount },
    { key: "expense", label: "Expenses", count: expenseCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">Track income and expenses in Nepali Rupees (Rs.).</p>
        </div>
        <FinanceFormDialog>
          <Button style={{ background: "hsl(var(--primary))" }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </FinanceFormDialog>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-[15px] font-bold text-foreground min-w-[160px] text-center">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentMonth && (
          <Button
            variant="outline" size="sm" className="h-7 text-[12px] ml-1"
            onClick={() => { setSelectedMonth(now.getMonth() + 1); setSelectedYear(now.getFullYear()); }}
          >
            Today
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Total Income</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoadingSummary ? <Skeleton className="h-8 w-28" /> : (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                </div>
                <span className="text-2xl font-bold text-emerald-700">{formatNPR(summary?.totalIncome ?? 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoadingSummary ? <Skeleton className="h-8 w-28" /> : (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-red-700" />
                </div>
                <span className="text-2xl font-bold text-red-700">{formatNPR(summary?.totalExpenses ?? 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Net Savings</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {isLoadingSummary ? <Skeleton className="h-8 w-28" /> : (
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${savingsRate >= 0 ? "bg-blue-100" : "bg-red-100"}`}>
                  <TrendingUp className={`h-4 w-4 ${savingsRate >= 0 ? "text-blue-700" : "text-red-700"}`} />
                </div>
                <div>
                  <span className={`text-2xl font-bold ${savingsColor}`}>{formatNPR(summary?.savings ?? 0)}</span>
                  {savingsRate !== 0 && (
                    <span className={`text-[12px] font-medium ml-1.5 ${savingsColor}`}>
                      ({savingsRate.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction list header with type filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-[15px] font-bold text-foreground">
          Transactions — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </h3>

        {/* Type filter tabs */}
        {(records?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-sm">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all",
                  typeFilter === key
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {key === "income" && <ArrowUpRight className="h-3.5 w-3.5" />}
                {key === "expense" && <ArrowDownRight className="h-3.5 w-3.5" />}
                {label}
                <span className={cn(
                  "text-[10.5px] rounded-full px-1.5 py-0.5 leading-none font-bold",
                  typeFilter === key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Records */}
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] w-full rounded-xl mb-2" />
        ))
      ) : filteredRecords.length === 0 && (records?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-border rounded-xl bg-card">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-emerald-700" />
          </div>
          <h3 className="text-[16px] font-bold">No transactions</h3>
          <p className="text-[13px] text-muted-foreground mt-1 mb-5">
            No records for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
          </p>
          <FinanceFormDialog>
            <Button variant="outline">Add first record</Button>
          </FinanceFormDialog>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl bg-card">
          <p className="text-[14px] font-semibold text-muted-foreground">
            No {typeFilter} records this month
          </p>
          <Button variant="ghost" className="mt-2 text-[13px]" onClick={() => setTypeFilter("all")}>
            Show all transactions
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="divide-y divide-border/60">
            {filteredRecords.map((record) => (
              <div key={record.id} className="px-4 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    record.type === "income" ? "bg-emerald-100" : "bg-red-100"
                  }`}>
                    {record.type === "income"
                      ? <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                      : <ArrowDownRight className="h-4 w-4 text-red-700" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[13.5px] text-foreground">{record.category}</h4>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                        record.type === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {record.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <span>{formatDate(record.date)}</span>
                      {record.description && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[180px]">{record.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-bold text-[14px] ${record.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                    {record.type === "income" ? "+" : "−"}{formatNPR(record.amount)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletingId(record.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {filteredRecords.length > 0 && typeFilter !== "all" && (
        <p className="text-center text-[12px] text-muted-foreground pb-2">
          Showing {filteredRecords.length} {typeFilter} records of {records?.length} total
        </p>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deletingId != null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this financial record. This action cannot be undone.
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

      <FinanceFormDialog
        open={!!editingRecord}
        onOpenChange={(open) => !open && setEditingRecord(null)}
        record={editingRecord || undefined}
      />
    </div>
  );
}
