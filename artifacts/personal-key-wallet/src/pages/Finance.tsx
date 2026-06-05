import React, { useState } from "react";
import { 
  useListFinanceRecords, 
  useDeleteFinanceRecord,
  useGetFinanceSummary,
  getListFinanceRecordsQueryKey,
  getGetFinanceSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, MoreVertical, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import FinanceFormDialog from "@/components/FinanceFormDialog";
import { FinanceRecord } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Finance() {
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: records, isLoading } = useListFinanceRecords({}, { query: { queryKey: getListFinanceRecordsQueryKey() } });
  const { data: summary, isLoading: isLoadingSummary } = useGetFinanceSummary(
    { month: currentMonth, year: currentYear },
    { query: { queryKey: getGetFinanceSummaryQueryKey({ month: currentMonth, year: currentYear }) } }
  );
  
  const deleteMutation = useDeleteFinanceRecord();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFinanceRecordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetFinanceSummaryQueryKey() });
            toast({ title: "Record deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Tracker</h1>
          <p className="text-muted-foreground mt-1">Manage your income and expenses.</p>
        </div>
        <FinanceFormDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </FinanceFormDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2 text-emerald-500">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatCurrency(summary?.totalIncome || 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2 text-destructive">
                <ArrowDownRight className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses || 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatCurrency(summary?.savings || 0)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recent Transactions</h3>
        
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : records?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-card/50">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Your financial ledger is empty. Add a transaction to get started.
            </p>
            <FinanceFormDialog>
              <Button variant="outline">Add Record</Button>
            </FinanceFormDialog>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border">
              {records?.map(record => (
                <div key={record.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${record.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                      {record.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{record.category}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(record.date)}</span>
                        {record.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px] sm:max-w-xs">{record.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${record.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(record.id)}>
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
      </div>

      <FinanceFormDialog 
        open={!!editingRecord} 
        onOpenChange={(open) => !open && setEditingRecord(null)}
        record={editingRecord || undefined} 
      />
    </div>
  );
}
