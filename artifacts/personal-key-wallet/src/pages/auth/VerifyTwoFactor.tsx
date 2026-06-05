import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useVerifyTotp } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";

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
      onSuccess: (data) => {
        login(data.token, data.user);
        navigate("/");
      },
      onError: (err: unknown) => {
        const msg =
          (err as { data?: { error?: string } })?.data?.error ??
          "Invalid code. Please check your authenticator app and try again.";
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
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-600/30">
                <Smartphone className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">Two-factor verification</CardTitle>
            <CardDescription className="text-slate-400">
              Open your Google Authenticator app and enter the 6-digit code for Personal Key Wallet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-800 bg-red-950/50">
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">Authenticator code</Label>
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
                  autoFocus
                  autoComplete="one-time-code"
                  className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-[0.4em] placeholder:text-slate-500 focus:border-blue-500"
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
                  <><ShieldCheck className="h-4 w-4 mr-2" /> Verify & sign in</>
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              <button
                onClick={() => navigate("/auth/login")}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Back to login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
