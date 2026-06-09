import { Link } from "wouter";

export default function AuthFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-border/60 text-center space-y-2">
      <div className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
        <span className="text-base leading-none">🇳🇵</span>
        <span className="font-semibold text-foreground/70">Made in Nepal</span>
        <span className="text-muted-foreground/50">·</span>
        <span>Developed by</span>
        <span className="font-semibold text-foreground/80">Aakash Adhikari</span>
      </div>
      <div className="flex items-center justify-center gap-3 text-[11.5px]">
        <Link
          href="/privacy"
          className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          Privacy Policy
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <Link
          href="/terms"
          className="text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          Terms of Service
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-muted-foreground/60">© {new Date().getFullYear()} Key Wallet</span>
      </div>
    </div>
  );
}
