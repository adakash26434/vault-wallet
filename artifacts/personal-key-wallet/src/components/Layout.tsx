import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Wallet,
  BarChart3,
  Lightbulb,
  PuzzleIcon,
  LogOut,
  ChevronRight,
  ShieldCheck,
  User,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

const navSections = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Vault",
    items: [
      { href: "/vault/passwords", label: "Passwords", icon: KeyRound },
      { href: "/vault/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance", label: "Records", icon: Wallet },
      { href: "/finance/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/extension", label: "Extension", icon: PuzzleIcon },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/vault/passwords": "Passwords",
  "/vault/documents": "Documents",
  "/finance": "Finance",
  "/finance/analytics": "Analytics",
  "/insights": "Insights",
  "/extension": "Extension",
};

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const pageTitle = PAGE_TITLES[location] ?? "Personal Key Wallet";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] flex-shrink-0 flex flex-col hidden md:flex"
        style={{
          background: "white",
          borderRight: "1px solid hsl(var(--border))",
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo area */}
        <div className="h-[52px] flex items-center px-5 gap-2.5"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div className="h-7 w-7 rounded-md flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-foreground">
            Key Wallet
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10.5px] font-semibold tracking-widest uppercase px-3 mb-1.5"
                style={{ color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em" }}
              >
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "nav-active-bar flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-all duration-100",
                        isActive
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[hsl(var(--primary))]")} />
                      {item.label}
                      {isActive && (
                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User panel */}
        <div className="p-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted transition-colors text-left">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[11px] font-semibold" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-foreground truncate leading-tight">
                    {user?.name ?? user?.email}
                  </p>
                  {user?.name && (
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">{user.email}</p>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-2" /> {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top title bar */}
        <header className="h-[52px] flex items-center px-6 gap-4 shrink-0"
          style={{
            background: "white",
            borderBottom: "1px solid hsl(var(--border))",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-muted-foreground font-medium">Key Wallet</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-semibold" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-foreground hidden sm:block">
                {user?.name ?? user?.email?.split("@")[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="p-6 md:p-8 max-w-[1280px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
