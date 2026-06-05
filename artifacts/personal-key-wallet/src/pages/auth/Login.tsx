import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2, ArrowRight, Lock } from "lucide-react";

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
          "Invalid email or password.";
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
    <div className="min-h-screen flex" style={{ background: "#F3F5F7", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[420px] flex-col justify-between p-10"
        style={{ background: "hsl(210,100%,40%)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Key Wallet</span>
        </div>

        <div className="space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Your secure<br />digital vault
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            Store passwords, documents, and financial records with military-grade security and mandatory 2FA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {["🔐 Passwords", "📄 Documents", "💰 Finance"].map((tag) => (
            <span key={tag} className="text-xs font-medium text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210,100%,40%)" }}>
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">Key Wallet</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1 text-[14px]">Sign in to your secure vault</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription className="text-[13px]">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 bg-white border-border text-[13.5px] focus-visible:ring-[hsl(210,100%,40%)] focus-visible:border-[hsl(210,100%,40%)]"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10 bg-white border-border text-[13.5px] focus-visible:ring-[hsl(210,100%,40%)] focus-visible:border-[hsl(210,100%,40%)]"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 font-semibold text-[13.5px] mt-2"
              style={{ background: "hsl(210,100%,40%)" }}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/auth/signup")}
              className="font-semibold underline underline-offset-4"
              style={{ color: "hsl(210,100%,40%)" }}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
