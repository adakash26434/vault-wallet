import React, { useState } from "react";
import { useGetFinanceSummary, getGetFinanceSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, PiggyBank, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const PALETTE = [
  "#0078D4","#22c55e","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#ec4899","#f97316","#84cc16","#64748b",
];

function formatRs(n: number | undefined) {
  if (n === undefined || n === null) return "Rs.0";
  if (Math.abs(n) >= 100000) return `Rs.${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `Rs.${(n / 1000).toFixed(1)}k`;
  return `Rs.${n.toLocaleString()}`;
}

function StatCard({
  label, value, Icon, color, bg, sub,
}: {
  label: string; value: string; Icon: React.ElementType;
  color: string; bg: string; sub?: string;
}) {
  return (
    <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`h-4.5 w-4.5 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-[12px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function CustomLegend({ data, total }: { data: Array<{ category: string; amount: number }>; total: number }) {
  return (
    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
      {data.map((item, i) => {
        const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
        return (
          <div key={item.category} className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 text-[12.5px] text-foreground truncate">{item.category}</span>
            <span className="text-[12px] font-semibold text-foreground">{formatRs(item.amount)}</span>
            <span className="text-[11px] text-muted-foreground w-10 text-right">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-[13px]">
      <p className="font-semibold text-foreground">{payload[0].name || payload[0].payload?.category}</p>
      <p className="text-muted-foreground">{formatRs(payload[0].value)}</p>
    </div>
  );
};

export default function FinanceAnalytics() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: summary, isLoading } = useGetFinanceSummary(
    { month, year },
    { query: { queryKey: getGetFinanceSummaryQueryKey({ month, year }) } }
  );

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();

  const expenseData = summary?.byCategory ?? [];
  const totalExpenses = summary?.totalExpenses ?? 0;
  const savings = summary?.savings ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;

  const barData = expenseData.slice(0, 6).map((c, i) => ({
    category: c.category.length > 10 ? c.category.slice(0, 10) + "…" : c.category,
    fullCategory: c.category,
    amount: c.amount,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance Analytics</h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">Detailed breakdown of your financial health.</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 min-w-[130px] text-center">
            <p className="text-[13.5px] font-bold text-foreground">{MONTHS[month - 1]}</p>
            <p className="text-[11px] text-muted-foreground">{year}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth} disabled={isCurrentMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Income"
          value={isLoading ? "…" : formatRs(summary?.totalIncome)}
          Icon={TrendingUp}
          color="text-emerald-700"
          bg="bg-emerald-100"
          sub="Earned this month"
        />
        <StatCard
          label="Total Expenses"
          value={isLoading ? "…" : formatRs(totalExpenses)}
          Icon={TrendingDown}
          color="text-red-600"
          bg="bg-red-100"
          sub="Spent this month"
        />
        <StatCard
          label="Net Savings"
          value={isLoading ? "…" : formatRs(savings)}
          Icon={PiggyBank}
          color={savings >= 0 ? "text-blue-700" : "text-red-600"}
          bg={savings >= 0 ? "bg-blue-100" : "bg-red-100"}
          sub={savings >= 0 ? "Money saved" : "Deficit this month"}
        />
        <StatCard
          label="Savings Rate"
          value={isLoading ? "…" : `${savingsRate.toFixed(1)}%`}
          Icon={Percent}
          color={savingsRate >= 20 ? "text-emerald-700" : savingsRate >= 10 ? "text-amber-700" : "text-red-600"}
          bg={savingsRate >= 20 ? "bg-emerald-100" : savingsRate >= 10 ? "bg-amber-100" : "bg-red-100"}
          sub={savingsRate >= 20 ? "Excellent discipline" : savingsRate >= 10 ? "Good — aim for 20%" : "Try to save more"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pie chart */}
        <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-bold">Expense Breakdown</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">Where your money went this month</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <div className="flex justify-center py-8"><Skeleton className="h-40 w-40 rounded-full" /></div>
            ) : expenseData.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <PiggyBank className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-[13.5px] font-medium text-foreground">No expenses this month</p>
                <p className="text-[12px] text-muted-foreground mt-1">Start recording your expenses to see the breakdown.</p>
              </div>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {expenseData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 border-t border-border/50 pt-3">
                  <CustomLegend data={expenseData} total={totalExpenses} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-bold">Top Categories</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">Highest spending categories</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {isLoading ? (
              <div className="h-[280px] flex items-end gap-3 px-6">
                {[60, 90, 40, 75, 50, 35].map((h, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
                ))}
              </div>
            ) : barData.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center h-[280px] justify-center">
                <p className="text-[13.5px] text-muted-foreground">No data available</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => formatRs(v)}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income vs Expense comparison */}
      {!isLoading && summary && (summary.totalIncome > 0 || summary.totalExpenses > 0) && (
        <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-bold">Income vs Expenses</CardTitle>
            <p className="text-[12.5px] text-muted-foreground">Monthly comparison</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-4">
              {/* Income bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[13px] font-semibold text-foreground">Income</span>
                  </div>
                  <span className="text-[13px] font-bold text-emerald-700">{formatRs(summary.totalIncome)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: summary.totalIncome > 0 ? "100%" : "0%" }}
                  />
                </div>
              </div>

              {/* Expense bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[13px] font-semibold text-foreground">Expenses</span>
                  </div>
                  <span className="text-[13px] font-bold text-red-600">{formatRs(summary.totalExpenses)}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-700"
                    style={{
                      width: summary.totalIncome > 0
                        ? `${Math.min(100, (summary.totalExpenses / summary.totalIncome) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Net */}
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-muted-foreground">Net savings</span>
                <div className={`flex items-center gap-1.5 font-bold text-[15px] ${savings >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {savings >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {formatRs(Math.abs(savings))}
                  <span className="text-[12px] font-normal text-muted-foreground">({savingsRate.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
