import React from "react";
import { useGetDashboardOverview, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, FileText, AlertTriangle, Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: overview, isLoading: isLoadingOverview } = useGetDashboardOverview();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts();

  if (isLoadingOverview || isLoadingAlerts) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your digital security and financial snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Passwords</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalPasswords ?? 0}</div>
            {overview?.weakPasswords ? (
              <p className="text-xs text-destructive mt-1">{overview.weakPasswords} weak passwords</p>
            ) : (
              <p className="text-xs text-emerald-500 mt-1">All secure</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Secure Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalDocuments ?? 0}</div>
            {overview?.expiringDocuments ? (
              <p className="text-xs text-amber-500 mt-1">{overview.expiringDocuments} expiring soon</p>
            ) : (
              <p className="text-xs text-emerald-500 mt-1">Up to date</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(overview?.monthlyBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.recentAlerts ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Alerts</CardTitle>
            <CardDescription>Items that need your immediate attention.</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-start gap-4 p-3 rounded-md bg-muted/50 border border-border/50">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'high' ? 'text-destructive' : 
                      alert.severity === 'medium' ? 'text-amber-500' : 'text-primary'
                    }`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                ))}
                <Link href="/insights">
                  <Button variant="outline" className="w-full mt-4">View All Alerts <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShieldCheck className="h-12 w-12 text-emerald-500 mb-4" />
                <p className="text-lg font-medium">Your vault is secure</p>
                <p className="text-sm text-muted-foreground">No active alerts found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
