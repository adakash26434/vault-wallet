import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useVerifyTotp } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2, Smartphone, ArrowRight } from "lucide-react";

export default function VerifyTwoFactor() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tempToken = params.get("token") ?? "";

  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useVerifyTotp({
    mutation: {
      onSuccess: (data) => { login(data.token, data.user); navigate("/"); },
      onError: (err: unknown) => {
        setError((err as { data?: { error?: string } })?.data?.error ?? "Invalid code. Please try again.");
        setCode("");
      },
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F3F5F7", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210,100%,40%)" }}>
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Key Wallet</span>
        </div>

        <div className="bg-white rounded-xl border border-border p-7" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "hsl(210,100%,40%,0.1)" }}>
              <Smartphone className="h-7 w-7" style={{ color: "hsl(210,100%,40%)" }} />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Two-factor verification</h2>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
              Open Google Authenticator and enter the 6-digit code for Key Wallet.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setError(null); verifyMutation.mutate({ data: { tempToken, code } }); }} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-[13px] font-semibold text-foreground">Authenticator code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                autoComplete="one-time-code"
                className="h-14 text-center text-3xl font-mono tracking-[0.5em] bg-white border-border focus-visible:ring-[hsl(210,100%,40%)]"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 font-semibold text-[13.5px]"
              style={{ background: "hsl(210,100%,40%)" }}
              disabled={verifyMutation.isPending || code.length !== 6}
            >
              {verifyMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                : <>Verify & sign in <ArrowRight className="h-4 w-4 ml-2" /></>
              }
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-muted-foreground">
            <button onClick={() => navigate("/auth/login")} className="font-semibold underline underline-offset-4" style={{ color: "hsl(210,100%,40%)" }}>
              ← Back to login
            </button>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Protected by Google Authenticator TOTP
        </p>
      </div>
    </div>
  );
}
