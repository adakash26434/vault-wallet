import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useVerifyTotpSetup } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2, Copy, Check, Smartphone, ArrowRight } from "lucide-react";

export default function SetupTwoFactor() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tempToken = params.get("token") ?? "";
  const qrCodeDataUrl = params.get("qr") ?? "";
  const manualKey = params.get("key") ?? "";

  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const verifyMutation = useVerifyTotpSetup({
    mutation: {
      onSuccess: (data) => { login(data.token, data.user); navigate("/"); },
      onError: (err: unknown) => {
        setError((err as { data?: { error?: string } })?.data?.error ?? "Invalid code. Please try again.");
        setCode("");
      },
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(manualKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F3F5F7", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="w-full max-w-[460px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210,100%,40%)" }}>
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Key Wallet</span>
        </div>

        <div className="bg-white rounded-xl border border-border p-7" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center bg-green-100 text-green-600">✓</div>
              <span className="text-[12px] font-medium text-muted-foreground">Account</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center text-white" style={{ background: "hsl(210,100%,40%)" }}>2</div>
              <span className="text-[12px] font-semibold" style={{ color: "hsl(210,100%,40%)" }}>Set up 2FA</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(210,100%,40%,0.1)" }}>
              <Smartphone className="h-5 w-5" style={{ color: "hsl(210,100%,40%)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Set up Google Authenticator</h2>
              <p className="text-[13px] text-muted-foreground">Scan the QR code, then enter your first code</p>
            </div>
          </div>

          {qrCodeDataUrl && (
            <div className="flex flex-col items-center mb-5">
              <div className="p-3 bg-white rounded-xl border-2 border-border inline-block">
                <img src={qrCodeDataUrl} alt="TOTP QR Code" className="w-40 h-40" />
              </div>
              <p className="text-[12px] text-muted-foreground mt-3 mb-2">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2 w-full max-w-[300px]">
                <code className="flex-1 text-[11px] font-mono bg-muted px-3 py-2 rounded-lg border border-border text-foreground break-all">
                  {manualKey}
                </code>
                <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); setError(null); verifyMutation.mutate({ data: { tempToken, code } }); }} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-[13px] font-semibold text-foreground">6-digit code from your authenticator app</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoComplete="one-time-code"
                className="h-12 text-center text-2xl font-mono tracking-[0.4em] bg-white border-border focus-visible:ring-[hsl(210,100%,40%)]"
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
                : <>Complete setup <ArrowRight className="h-4 w-4 ml-2" /></>
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
