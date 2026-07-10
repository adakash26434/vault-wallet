import React from "react";
import {
  useGetDashboardAlerts, useGetDashboardOverview, useGetPasswordStats,
} from "@workspace/api-client-react";
import { Alert } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ShieldCheck, ShieldAlert, AlertCircle, KeyRound, FileText,
  AlertTriangle, Lightbulb, CheckCircle2, Info, ArrowRight,
  Lock, Smartphone, CreditCard, Globe, Eye,
} from "lucide-react";

function ScoreRing({ score }: { score: number }) {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 50 ? "Fair" : "Needs Attention";
  const Icon = score >= 80 ? ShieldCheck : score >= 50 ? AlertCircle : ShieldAlert;
  const textColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg width="148" height="148" className="-rotate-90">
          <circle cx="74" cy="74" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle
            cx="74" cy="74" r={r} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10.5px] text-muted-foreground font-semibold uppercase tracking-widest">/ 100</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-[14px] font-bold ${textColor}`}>
        <Icon className="h-[18px] w-[18px]" />
        {label}
      </div>
    </div>
  );
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12.5px] text-muted-foreground">{label}</span>
        <span className="text-[12.5px] font-bold text-foreground">{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const SECURITY_TIPS = [
  {
    Icon: Smartphone,
    title: "eSewa & Khalti Safety",
    color: "bg-green-100 text-green-700",
    tips: [
      "Download only from official Google Play or App Store — never from WhatsApp links.",
      "Never share your PIN or OTP with anyone, not even bank staff.",
      "Enable screen lock and fingerprint on your mobile wallet app.",
      "Check the URL bar before logging in — look for 'esewa.com.np' / 'khalti.com'.",
    ],
  },
  {
    Icon: CreditCard,
    title: "Online Banking in Nepal",
    color: "bg-blue-100 text-blue-700",
    tips: [
      "NRB-registered banks will NEVER ask for your full password over email or phone.",
      "Use ConnectIPS only on the official site: connectips.com — verify SSL padlock.",
      "Activate transaction SMS alerts for all your bank accounts.",
      "Do not use internet banking on shared or public computers.",
    ],
  },
  {
    Icon: Lock,
    title: "Password Best Practices",
    color: "bg-purple-100 text-purple-700",
    tips: [
      "Use a unique password for every service — especially eSewa, email, and banking.",
      "A strong password is 12+ characters with mixed case, numbers, and symbols.",
      "Use Key Wallet's built-in password generator for strong, random passwords.",
      "Change passwords immediately if you suspect your account was compromised.",
    ],
  },
  {
    Icon: Globe,
    title: "Phishing & Scam Awareness",
    color: "bg-red-100 text-red-700",
    tips: [
      "\"तपाईंले Rs.50,000 जित्नुभयो\" — 'You won Rs.50,000' SMS/calls are always scams.",
      "Verify website URLs carefully before entering any personal information.",
      "Nepal Telecom and Ncell will never ask for your account password via SMS.",
      "If in doubt, call the official helpline number listed on the bank's official website.",
    ],
  },
  {
    Icon: Eye,
    title: "Two-Factor Authentication",
    color: "bg-amber-100 text-amber-700",
    tips: [
      "Store your Google Authenticator recovery codes offline in a safe place.",
      "Never screenshot or share your 2FA QR code — it gives full account access.",
      "If you lose your 2FA device, contact us immediately at the support email.",
      "Use 2FA on your email account too — it is the master key to all other accounts.",
    ],
  },
];

function AlertItem({ alert }: { alert: Alert }) {
  const sev = alert.severity;
  const styles = {
    high:   { bg: "bg-red-50",   border: "border-red-200",   badge: "bg-red-100 text-red-700",    dot: "bg-red-500" },
    medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    low:    { bg: "bg-blue-50",  border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  }[sev] ?? { bg: "bg-muted/30", border: "border-border", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles.bg} ${styles.border}`}>
      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="text-[13.5px] font-bold text-foreground">{alert.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${styles.badge}`}>
            {sev.toUpperCase()}
          </span>
        </div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">{alert.message}</p>
      </div>
    </div>
  );
}

export default function Insights() {
  const { data: alerts, isLoading: loadingAlerts } = useGetDashboardAlerts();
  const { data: overview, isLoading: loadingOv } = useGetDashboardOverview();
  const { data: pwStats } = useGetPasswordStats();

  const healthScore = React.useMemo(() => {
    if (!overview) return 100;
    let s = 100;
    if (overview.totalPasswords > 0) s -= Math.min(35, (overview.weakPasswords / overview.totalPasswords) * 100);
    if (overview.totalDocuments > 0) s -= Math.min(25, (overview.expiringDocuments / overview.totalDocuments) * 100);
    return Math.max(0, Math.round(s));
  }, [overview]);

  const strongPwd = pwStats?.strong ?? 0;
  const totalPwd  = pwStats?.total ?? 0;
  const weakPwd   = pwStats?.weak ?? 0;
  const medPwd    = pwStats?.medium ?? 0;

  const validDocs    = (overview?.totalDocuments ?? 0) - (overview?.expiringDocuments ?? 0);
  const expiringDocs = overview?.expiringDocuments ?? 0;
  const totalDocs    = overview?.totalDocuments ?? 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Insights</h1>
        <p className="text-muted-foreground mt-0.5 text-[14px]">Your vault health, active alerts, and digital safety guide.</p>
      </div>

      {/* Score + Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Security Score */}
        <Card className="bg-white border-border lg:col-span-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-[15px] font-bold">Vault Health Score</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-6 flex flex-col items-center gap-5">
            {loadingOv ? (
              <Skeleton className="h-36 w-36 rounded-full" />
            ) : (
              <ScoreRing score={healthScore} />
            )}

            {/* Score breakdown */}
            {!loadingOv && (
              <div className="w-full space-y-3">
                <MetricBar
                  label="Strong passwords"
                  value={strongPwd}
                  max={totalPwd}
                  color={strongPwd === totalPwd && totalPwd > 0 ? "bg-emerald-500" : "bg-amber-400"}
                />
                <MetricBar
                  label="Valid documents"
                  value={validDocs}
                  max={totalDocs || 1}
                  color={expiringDocs === 0 ? "bg-emerald-500" : "bg-amber-400"}
                />
                {weakPwd > 0 && (
                  <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {weakPwd} weak password{weakPwd > 1 ? "s" : ""} — update now
                  </div>
                )}
                {medPwd > 0 && (
                  <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    {medPwd} medium password{medPwd > 1 ? "s" : ""} — consider strengthening
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="bg-white border-border lg:col-span-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[15px] font-bold">Active Alerts</CardTitle>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">Items requiring your attention</p>
            </div>
            {(alerts?.length ?? 0) > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">{alerts!.length}</Badge>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loadingAlerts ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-2.5">
                {alerts.map(a => <AlertItem key={a.id} alert={a} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-[15px] font-bold text-foreground">All clear! 🎉</p>
                <p className="text-[13px] text-muted-foreground mt-1 max-w-xs">
                  No security alerts. Your vault is healthy and secure.
                </p>
              </div>
            )}

            {/* How to improve */}
            {!loadingOv && (
              <div className="mt-5 border-t border-border/50 pt-4">
                <p className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  How to improve your score
                </p>
                <div className="space-y-2">
                  {[
                    { done: weakPwd === 0, text: "All passwords are strong" },
                    { done: expiringDocs === 0, text: "All documents are valid and up-to-date" },
                    { done: totalPwd >= 5, text: "Vault has 5+ saved passwords" },
                    { done: totalDocs >= 3, text: "At least 3 documents stored" },
                  ].map(({ done, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-[13px]">
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      <span className={done ? "text-foreground" : "text-muted-foreground"}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nepal Security Tips */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-foreground">Nepal Digital Security Guide</h2>
            <p className="text-[12.5px] text-muted-foreground">Tailored for Nepali users — eSewa, Khalti, online banking & more</p>
          </div>
          <Link href="/extension" className="ml-auto">
            <div className="flex items-center gap-1 text-[12.5px] text-primary hover:underline underline-offset-2">
              Full guide <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECURITY_TIPS.slice(0, 3).map(({ Icon, title, color, tips }) => (
            <Card key={title} className="bg-card border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
                </div>
                <ul className="space-y-2">
                  {tips.slice(0, 2).map(tip => (
                    <li key={tip} className="flex items-start gap-2 text-[12.5px] text-muted-foreground leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
