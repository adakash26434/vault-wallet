import React from "react";
import { useGetDashboardOverview, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  KeyRound, FileText, AlertTriangle, Wallet, ArrowRight,
  ShieldCheck, ShieldAlert, AlertCircle, Plus, TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SecurityRing({ score }: { score: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Score</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: overview, isLoading: loadingOv } = useGetDashboardOverview();
  const { data: alerts, isLoading: loadingAl } = useGetDashboardAlerts();

  const healthScore = React.useMemo(() => {
    if (!overview) return 100;
    let s = 100;
    if (overview.totalPasswords > 0) s -= Math.min(35, (overview.weakPasswords / overview.totalPasswords) * 100);
    if (overview.totalDocuments > 0) s -= Math.min(25, (overview.expiringDocuments / overview.totalDocuments) * 100);
    return Math.max(0, Math.round(s));
  }, [overview]);

  const HealthIcon = healthScore >= 80 ? ShieldCheck : healthScore >= 50 ? AlertCircle : ShieldAlert;
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 50 ? "Fair" : "Needs attention";
  const healthColor = healthScore >= 80 ? "text-emerald-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600";

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-0.5 text-[14px]">
            Here's your vault and security snapshot.
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/vault/passwords">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-[13px]">
              <Plus className="h-3.5 w-3.5" /> Password
            </Button>
          </Link>
          <Link href="/vault/documents">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-[13px]">
              <Plus className="h-3.5 w-3.5" /> Document
            </Button>
          </Link>
          <Link href="/finance">
            <Button size="sm" className="gap-1.5 h-8 text-[13px]" style={{ background: "hsl(var(--primary))" }}>
              <Plus className="h-3.5 w-3.5" /> Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats + Security Score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Security score card */}
        <Card className="lg:col-span-1 bg-white border-border"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardContent className="pt-5 flex flex-col items-center gap-3">
            {loadingOv ? (
              <Skeleton className="h-28 w-28 rounded-full" />
            ) : (
              <>
                <SecurityRing score={healthScore} />
                <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${healthColor}`}>
                  <HealthIcon className="h-4 w-4" />
                  {healthLabel}
                </div>
                <p className="text-[11.5px] text-muted-foreground text-center">
                  Vault health score
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3 stat cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Passwords */}
          <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Passwords</CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210,100%,40%,0.08)" }}>
                <KeyRound className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {loadingOv ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-3xl font-bold text-foreground">{overview?.totalPasswords ?? 0}</div>
                  {(overview?.weakPasswords ?? 0) > 0 ? (
                    <p className="text-[12px] text-red-600 mt-1 font-medium">{overview!.weakPasswords} weak — fix now</p>
                  ) : (
                    <p className="text-[12px] text-emerald-600 mt-1 font-medium">All passwords strong</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Documents</CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
                <FileText className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {loadingOv ? <Skeleton className="h-8 w-16" /> : (
                <>
                  <div className="text-3xl font-bold text-foreground">{overview?.totalDocuments ?? 0}</div>
                  {(overview?.expiringDocuments ?? 0) > 0 ? (
                    <p className="text-[12px] text-amber-600 mt-1 font-medium">{overview!.expiringDocuments} expiring soon</p>
                  ) : (
                    <p className="text-[12px] text-emerald-600 mt-1 font-medium">All documents valid</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Finance */}
          <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">Monthly Balance</CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,163,74,0.08)" }}>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {loadingOv ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className={`text-3xl font-bold ${(overview?.monthlyBalance ?? 0) >= 0 ? "text-foreground" : "text-red-600"}`}>
                    Rs.{Math.abs(overview?.monthlyBalance ?? 0).toLocaleString()}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {(overview?.monthlyBalance ?? 0) >= 0 ? "Net savings this month" : "Deficit this month"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="bg-white border-border h-full" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[15px] font-bold">Security Alerts</CardTitle>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">Items requiring attention</p>
              </div>
              {(alerts?.length ?? 0) > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">{alerts!.length}</Badge>
              )}
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {loadingAl ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className={`flex items-start gap-3 p-3.5 rounded-lg border ${
                      alert.severity === "high" ? "bg-red-50 border-red-200" :
                      alert.severity === "medium" ? "bg-amber-50 border-amber-200" :
                      "bg-blue-50 border-blue-200"
                    }`}>
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        alert.severity === "high" ? "text-red-600" :
                        alert.severity === "medium" ? "text-amber-600" : "text-blue-600"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">{alert.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                  {alerts.length > 4 && (
                    <Link href="/insights">
                      <Button variant="ghost" className="w-full h-9 text-[13px] mt-1">
                        View all {alerts.length} alerts <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-foreground">All clear!</p>
                  <p className="text-[13px] text-muted-foreground mt-1">No security alerts. Your vault is secure.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick nav */}
        <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-[15px] font-bold">Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4 space-y-1">
            {[
              { href: "/vault/passwords", label: "Password Vault", desc: `${overview?.totalPasswords ?? 0} entries`, Icon: KeyRound, color: "text-blue-600", bg: "bg-blue-100" },
              { href: "/vault/documents", label: "Documents", desc: `${overview?.totalDocuments ?? 0} documents`, Icon: FileText, color: "text-violet-600", bg: "bg-violet-100" },
              { href: "/finance", label: "Finance Tracker", desc: "Income & expenses", Icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
              { href: "/insights", label: "Security Insights", desc: `Score: ${healthScore}/100`, Icon: ShieldCheck, color: healthColor, bg: healthScore >= 80 ? "bg-emerald-100" : healthScore >= 50 ? "bg-amber-100" : "bg-red-100" },
            ].map(({ href, label, desc, Icon, color, bg }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{label}</p>
                    <p className="text-[11.5px] text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
