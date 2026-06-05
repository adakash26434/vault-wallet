import React from "react";
import { useGetDashboardAlerts, useGetDashboardOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldCheck, ShieldAlert, AlertCircle, Info, KeyRound, FileText, Wallet } from "lucide-react";
import { Alert } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

function AlertIcon({ type, severity }: { type: string, severity: string }) {
  const colorClass = 
    severity === 'high' ? 'text-destructive' : 
    severity === 'medium' ? 'text-amber-500' : 'text-primary';

  switch (type) {
    case 'weak_password':
      return <KeyRound className={`h-5 w-5 ${colorClass}`} />;
    case 'expiring_document':
    case 'expired_document':
      return <FileText className={`h-5 w-5 ${colorClass}`} />;
    case 'overspending':
      return <Wallet className={`h-5 w-5 ${colorClass}`} />;
    default:
      return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
  }
}

export default function Insights() {
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts();
  const { data: overview, isLoading: isLoadingOverview } = useGetDashboardOverview();

  const calculateHealthScore = () => {
    if (!overview) return 100;
    
    let score = 100;
    
    // Deduct for weak passwords
    if (overview.totalPasswords > 0) {
      const weakRatio = overview.weakPasswords / overview.totalPasswords;
      score -= Math.min(30, weakRatio * 100);
    }
    
    // Deduct for expiring/expired documents
    if (overview.totalDocuments > 0) {
      const expiringRatio = overview.expiringDocuments / overview.totalDocuments;
      score -= Math.min(20, expiringRatio * 100);
    }
    
    return Math.max(0, Math.round(score));
  };

  const healthScore = calculateHealthScore();
  
  let HealthIcon = ShieldCheck;
  let healthColor = "text-emerald-500";
  let healthMessage = "Your digital vault is highly secure.";
  
  if (healthScore < 50) {
    HealthIcon = ShieldAlert;
    healthColor = "text-destructive";
    healthMessage = "Critical security issues require your attention.";
  } else if (healthScore < 80) {
    HealthIcon = AlertCircle;
    healthColor = "text-amber-500";
    healthMessage = "There are a few areas you could improve.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Insights</h1>
        <p className="text-muted-foreground mt-1">Review alerts and your overall health score.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Vault Health Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              {isLoadingOverview ? (
                <Skeleton className="h-32 w-32 rounded-full my-4" />
              ) : (
                <div className={`relative flex items-center justify-center h-40 w-40 rounded-full border-8 my-4 ${healthScore >= 80 ? 'border-emerald-500/20' : healthScore >= 50 ? 'border-amber-500/20' : 'border-destructive/20'}`}>
                  <div className={`text-5xl font-bold ${healthColor}`}>
                    {healthScore}
                  </div>
                  <div className="absolute bottom-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">Score</div>
                </div>
              )}
              
              {!isLoadingOverview && (
                <>
                  <div className={`flex items-center gap-2 font-medium ${healthColor} mt-2`}>
                    <HealthIcon className="h-5 w-5" />
                    <span>
                      {healthScore >= 80 ? "Excellent" : healthScore >= 50 ? "Fair" : "Poor"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 px-4">
                    {healthMessage}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How to improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <span>Update weak passwords to use strong, unique phrases.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <span>Renew or remove documents that are nearing expiry.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <span>Review high spending categories to stay within budget.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full bg-card border-border">
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Items that need your immediate attention across your vault.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : alerts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg bg-muted/30">
                  <ShieldCheck className="h-16 w-16 text-emerald-500/50 mb-4" />
                  <h3 className="text-lg font-medium text-emerald-500">All Clear</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    You have no active security or financial alerts. Your vault is perfectly maintained.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts?.map((alert: Alert) => (
                    <div 
                      key={alert.id} 
                      className={`flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border ${
                        alert.severity === 'high' ? 'bg-destructive/5 border-destructive/20' : 
                        alert.severity === 'medium' ? 'bg-amber-500/5 border-amber-500/20' : 
                        'bg-card border-border'
                      }`}
                    >
                      <div className={`p-2 rounded-full flex-shrink-0 w-fit ${
                        alert.severity === 'high' ? 'bg-destructive/10' : 
                        alert.severity === 'medium' ? 'bg-amber-500/10' : 
                        'bg-primary/10'
                      }`}>
                        <AlertIcon type={alert.type} severity={alert.severity} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{alert.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                            alert.severity === 'high' ? 'bg-destructive/20 text-destructive' : 
                            alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' : 
                            'bg-primary/20 text-primary'
                          }`}>
                            {alert.severity} priority
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-2 opacity-70">
                          Detected {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
