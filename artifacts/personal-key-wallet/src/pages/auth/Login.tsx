import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        navigate(`/auth/verify?token=${encodeURIComponent(data.tempToken)}`);
      },
      onError: (err: unknown) => {
        const msg =
          (err as { data?: { error?: string } })?.data?.error ??
          "Login failed. Please try again.";
        setError(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ data: { email, password } });
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
            <CardTitle className="text-xl text-white">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your secure vault
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
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" /> Sign in</>
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/auth/signup")}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
              >
                Create one
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
