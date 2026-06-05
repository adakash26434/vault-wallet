import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useVerifyTotpSetup } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Loader2, ShieldCheck, Copy, Check } from "lucide-react";

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
      onSuccess: (data) => {
        login(data.token, data.user);
        navigate("/");
      },
      onError: (err: unknown) => {
        const msg =
          (err as { data?: { error?: string } })?.data?.error ??
          "Invalid code. Please try again.";
        setError(msg);
        setCode("");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    verifyMutation.mutate({ data: { tempToken, code } });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(manualKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-xl">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">Personal Key Wallet</span>
        </div>

        <Card className="border-slate-700 bg-slate-800/60 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <Badge className="bg-blue-600/30 text-blue-300 border-blue-600/50 text-xs">
                Step 2 of 2
              </Badge>
            </div>
            <CardTitle className="text-xl text-white">Set up Google Authenticator</CardTitle>
            <CardDescription className="text-slate-400">
              Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <img src={qrCodeDataUrl} alt="TOTP QR Code" className="w-44 h-44" />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  Can't scan? Use this key manually:
                </p>
                <div className="flex items-center gap-2 w-full">
                  <code className="flex-1 bg-slate-700/60 text-slate-200 text-xs font-mono px-3 py-2 rounded-lg break-all">
                    {manualKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-800 bg-red-950/50">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">6-digit code from authenticator</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  className="bg-slate-700/50 border-slate-600 text-white text-center text-xl tracking-widest placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={verifyMutation.isPending || code.length !== 6}
              >
                {verifyMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" /> Verify & finish setup</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
