import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, KeyRound, FileText, Wallet, BarChart3,
  Lightbulb, ShieldCheck, LogOut, ChevronRight, User,
  Bell, Search, Menu, BookOpen, Download, X, FileSpreadsheet, BellRing,
  Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CommandPalette from "@/components/CommandPalette";

interface LayoutProps { children: React.ReactNode; }

const navSections = [
  {
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
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
    label: "Career",
    items: [
      { href: "/cv", label: "CV Builder", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Reminders",
    items: [
      { href: "/tasks", label: "Tasks & Reminders", icon: BellRing },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/extension", label: "Extension & App", icon: BookOpen },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/vault/passwords": "Password Vault",
  "/vault/documents": "Documents",
  "/finance": "Finance",
  "/finance/analytics": "Analytics",
  "/insights": "Insights",
  "/extension": "Extension & App",
  "/profile": "My Profile",
  "/cv": "CV Builder",
  "/tasks": "Reminders",
};

function NavList({ location, onClick }: { location: string; onClick?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {navSections.map((section) => (
        <div key={section.label}>
          <p
            className="text-[10.5px] font-semibold tracking-widest uppercase px-3 mb-1.5"
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
                  onClick={onClick}
                  className={cn(
                    "nav-active-bar flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-all duration-100",
                    isActive
                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[hsl(var(--primary))]")} />
                  {item.label}
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const pwaPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const pageTitle = PAGE_TITLES[location] ?? "Personal Key Wallet";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
      pwaPromptRef.current = prompt;
      const dismissed = sessionStorage.getItem("kw-pwa-dismissed");
      if (!dismissed) setShowPwaBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => { setPwaInstalled(true); setShowPwaBanner(false); });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installPWA() {
    const p = pwaPromptRef.current;
    if (!p) return;
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") { setPwaInstalled(true); setShowPwaBanner(false); }
    pwaPromptRef.current = null;
  }

  function dismissPwaBanner() {
    setShowPwaBanner(false);
    sessionStorage.setItem("kw-pwa-dismissed", "1");
  }

  function toggleDarkMode() {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("kw-theme", next ? "dark" : "light");
      return next;
    });
  }

  // Load saved dark mode preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("kw-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const SidebarBottom = () => (
    <>
      {/* Made in Nepal strip */}
      <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-center gap-1 text-[10.5px] text-muted-foreground/70 mb-0.5">
          <span>🇳🇵</span>
          <span className="font-semibold">Made in Nepal</span>
          <span className="text-muted-foreground/40 mx-0.5">·</span>
          <span>Aakash Adhikari</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px]">
          <Link href="/privacy" className="text-muted-foreground/60 hover:text-primary transition-colors">Privacy</Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/terms" className="text-muted-foreground/60 hover:text-primary transition-colors">Terms</Link>
        </div>
      </div>

      {/* User panel */}
      <div className="p-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted transition-colors text-left">
              <Avatar className="h-7 w-7 shrink-0">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? "avatar"} className="object-cover" />}
                <AvatarFallback
                  className="text-[11px] font-semibold"
                  style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                >
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
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 mr-2" /> {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer">
                <User className="h-3.5 w-3.5 mr-2" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/cv" className="flex items-center cursor-pointer">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> CV Builder
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-background text-foreground font-sans">

      {/* ── PWA Install Banner ── */}
      {showPwaBanner && !pwaInstalled && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 text-white text-sm shrink-0 relative z-50"
          style={{ background: "linear-gradient(90deg,#0078D4 0%,#005A9E 100%)" }}
        >
          <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Download className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold">Install Key Wallet App</span>
            <span className="text-white/75 text-xs ml-2 hidden sm:inline">
              Home screen ma add garnu — offline pani kaam garcha
            </span>
          </div>
          <button
            onClick={installPWA}
            className="shrink-0 px-3 py-1 rounded-md bg-white text-[#0078D4] text-xs font-bold hover:bg-white/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={dismissPwaBanner}
            className="shrink-0 ml-1 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-white/80" />
          </button>
        </div>
      )}

    <div className="flex flex-1 overflow-hidden">
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* ── Desktop Sidebar ── */}
      <aside
        className="w-[220px] flex-shrink-0 flex-col hidden md:flex"
        style={{
          background: "hsl(var(--sidebar))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
          boxShadow: "2px 0 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-5 gap-2.5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-foreground">Key Wallet</span>
        </div>

        <NavList location={location} />
        <SidebarBottom />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header
          className="h-[52px] flex items-center px-4 md:px-6 gap-3 shrink-0"
          style={{
            background: "hsl(var(--card))",
            borderBottom: "1px solid hsl(var(--border))",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] p-0 flex flex-col">
                {/* Mobile sidebar logo */}
                <div className="h-[52px] flex items-center px-5 gap-2.5 shrink-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                  <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-[15px] tracking-tight text-foreground">Key Wallet</span>
                </div>
                <NavList location={location} onClick={() => setMobileOpen(false)} />
                <SidebarBottom />
              </SheetContent>
            </Sheet>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-muted-foreground font-medium hidden sm:block">Key Wallet</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:block" />
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </div>

          <div className="flex-1" />

          {/* ⌘K search button */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-[12.5px] text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <kbd className="ml-2 text-[10.5px] bg-background border border-border rounded px-1.5 py-0.5 font-mono leading-none">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-8 w-8 text-muted-foreground"
            onClick={() => setCmdOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Bell */}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
            <Bell className="h-4 w-4" />
          </Button>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

          {/* Avatar */}
          <div className="hidden sm:flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? "avatar"} className="object-cover" />}
              <AvatarFallback
                className="text-[11px] font-semibold"
                style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px] font-medium text-foreground hidden lg:block">
              {user?.name ?? user?.email?.split("@")[0]}
            </span>
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
            className="p-4 md:p-6 lg:p-8 max-w-[1280px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
    </div>
  );
}
