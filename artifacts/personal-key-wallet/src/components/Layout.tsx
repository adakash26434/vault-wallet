import React from "react";
import { Link, useLocation } from "wouter";
import { 
  ShieldCheck, 
  KeyRound, 
  FileText, 
  Wallet, 
  LineChart, 
  ActivitySquare 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: ShieldCheck },
  { href: "/vault/passwords", label: "Passwords", icon: KeyRound },
  { href: "/vault/documents", label: "Documents", icon: FileText },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/finance/analytics", label: "Analytics", icon: LineChart },
  { href: "/insights", label: "Insights", icon: ActivitySquare },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-bold tracking-wide text-lg text-foreground">KeyWallet</span>
          </div>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover-elevate",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-muted p-4 rounded-md text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">System Secure</p>
            <p>All data is encrypted end-to-end.</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <motion.div 
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-auto p-6 md:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
