import React, { useState } from "react";
import { useGetFinanceSummary, getGetFinanceSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivitySquare, TrendingUp, TrendingDown } from "lucide-react";

const COLORS = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))", 
  "hsl(var(--chart-5))",
  "hsl(220 70% 50%)",
  "hsl(150 70% 50%)",
  "hsl(330 70% 50%)"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function FinanceAnalytics() {
  const date = new Date();
  const [month, setMonth] = useState(date.getMonth() + 1);
  const [year, setYear] = useState(date.getFullYear());

  const { data: summary, isLoading } = useGetFinanceSummary(
    { month, year },
    { query: { queryKey: getGetFinanceSummaryQueryKey({ month, year }) } }
  );

  const hasData = summary && summary.byCategory.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Analytics</h1>
          <p className="text-muted-foreground mt-1">Detailed breakdown of your financial health.</p>
        </div>
        <div className="flex gap-2">
          <Select value={month.toString()} onValueChange={(val) => setMonth(parseInt(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            {isLoading ? <Skeleton className="h-8 w-24 mt-2" /> : (
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="text-2xl font-bold">{formatCurrency(summary?.totalIncome)}</h3>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            {isLoading ? <Skeleton className="h-8 w-24 mt-2" /> : (
              <div className="flex items-center gap-2 mt-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h3 className="text-2xl font-bold">{formatCurrency(summary?.totalExpenses)}</h3>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Net Savings</p>
            {isLoading ? <Skeleton className="h-8 w-24 mt-2" /> : (
              <div className="flex items-center gap-2 mt-2">
                <ActivitySquare className="h-4 w-4 text-primary" />
                <h3 className="text-2xl font-bold">{formatCurrency(summary?.savings)}</h3>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
            {isLoading ? <Skeleton className="h-8 w-24 mt-2" /> : (
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-2xl font-bold">{summary?.savingsRate.toFixed(1)}%</h3>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Where your money went this month</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {summary.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <p>No expense data for this month</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Highest spending categories</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            {isLoading ? (
              <div className="h-full w-full flex items-end justify-between px-8 gap-4">
                {[40, 70, 30, 90, 50].map((h, i) => (
                  <Skeleton key={i} className={`w-full bg-primary/20 rounded-t-sm h-[${h}%]`} />
                ))}
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.byCategory.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {summary.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <p>No expense data for this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
