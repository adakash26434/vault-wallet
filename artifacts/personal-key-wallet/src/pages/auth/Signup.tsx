import { useState } from "react";
import { useLocation } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2, ArrowRight, Sparkles } from "lucide-react";
import AuthFooter from "@/components/AuthFooter";

export default function Signup() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const signupMutation = useSignup({
    mutation: {
      onSuccess: (data) => {
        navigate(
          `/auth/setup-2fa?token=${encodeURIComponent(data.tempToken)}&qr=${encodeURIComponent(data.qrCodeDataUrl)}&key=${encodeURIComponent(data.manualKey)}`
        );
      },
      onError: (err: unknown) => {
        const msg =
          (err as { data?: { error?: string } })?.data?.error ??
          "Signup failed. Please try again.";
        setError(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    signupMutation.mutate({ data: { email, password, name: name || undefined } });
  };

  const inputClass = "h-10 bg-white border-border text-[13.5px] focus-visible:ring-[hsl(210,100%,40%)] focus-visible:border-[hsl(210,100%,40%)]";
  const inputStyle = { boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };

  return (
    <div className="min-h-screen flex" style={{ background: "#F3F5F7", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Left branding */}
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
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Create your<br />secure vault
          </h1>
          <p className="text-white/70 text-sm leading-relaxed">
            All accounts include mandatory Google Authenticator 2FA for maximum security.
          </p>
          <ul className="space-y-2">
            {["Encrypted password storage", "Document vault with preview", "Finance & budget tracker", "2FA on every login"].map(f => (
              <li key={f} className="flex items-center gap-2 text-white/80 text-[13px]">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/40 text-xs">Personal Key Wallet</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(210,100%,40%)" }}>
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Key Wallet</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create account</h2>
            <p className="text-muted-foreground mt-1 text-[14px]">Step 1 of 2 — Your details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-[13px]">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[13px] font-semibold text-foreground">Full name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="name" type="text" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 chars" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} style={inputStyle} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[13px] font-semibold text-foreground">Confirm</Label>
                <Input id="confirm" type="password" placeholder="Repeat" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-10 font-semibold text-[13.5px] mt-2"
              style={{ background: "hsl(210,100%,40%)" }}
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
                : <>Continue to 2FA setup <ArrowRight className="h-4 w-4 ml-2" /></>
              }
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => navigate("/auth/login")} className="font-semibold underline underline-offset-4" style={{ color: "hsl(210,100%,40%)" }}>
              Sign in
            </button>
          </p>

          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
