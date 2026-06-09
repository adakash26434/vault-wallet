import { useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useListPasswords, useListDocuments } from "@workspace/api-client-react";
import {
  KeyRound, FileText, Copy, Check, LayoutDashboard,
  Wallet, BarChart3, Lightbulb, ShieldCheck, ArrowRight,
  ShieldCheck as SecurityIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { label: "Dashboard",          href: "/",                  Icon: LayoutDashboard,  desc: "Overview & security score" },
  { label: "Password Vault",     href: "/vault/passwords",   Icon: KeyRound,         desc: "Your saved credentials" },
  { label: "Documents",          href: "/vault/documents",   Icon: FileText,         desc: "Citizenship, passport, licences" },
  { label: "Finance Records",    href: "/finance",           Icon: Wallet,           desc: "Income & expense tracker" },
  { label: "Finance Analytics",  href: "/finance/analytics", Icon: BarChart3,        desc: "Charts & spending breakdown" },
  { label: "Security Insights",  href: "/insights",          Icon: Lightbulb,        desc: "Vault health & alerts" },
  { label: "Security Guide",     href: "/extension",         Icon: SecurityIcon,     desc: "Nepal digital safety tips" },
];

const CAT_COLORS: Record<string, string> = {
  Identity: "bg-blue-100 text-blue-700",
  Financial: "bg-emerald-100 text-emerald-700",
  Medical: "bg-rose-100 text-rose-700",
  Vehicle: "bg-orange-100 text-orange-700",
  Property: "bg-violet-100 text-violet-700",
  Government: "bg-amber-100 text-amber-700",
  Other: "bg-slate-100 text-slate-600",
};

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: passwords } = useListPasswords({});
  const { data: documents } = useListDocuments();

  const go = (href: string) => {
    navigate(href);
    onOpenChange(false);
  };

  const copyPassword = (pwd: { id: number; title: string; password: string }) => {
    navigator.clipboard.writeText(pwd.password);
    setCopiedId(pwd.id);
    toast({ title: `${pwd.title} — password copied`, duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search passwords, documents, navigate…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No results found</p>
          </div>
        </CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {PAGES.map(({ label, href, Icon, desc }) => (
            <CommandItem
              key={href}
              value={`navigate ${label} ${desc}`}
              onSelect={() => go(href)}
              className="gap-3 py-2.5"
            >
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13.5px] font-medium">{label}</span>
                <span className="text-[12px] text-muted-foreground ml-2">{desc}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Passwords */}
        {passwords && passwords.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Passwords (${passwords.length})`}>
              {passwords.slice(0, 8).map((pwd) => (
                <CommandItem
                  key={pwd.id}
                  value={`password ${pwd.title} ${pwd.username} ${pwd.url ?? ""}`}
                  onSelect={() => copyPassword(pwd)}
                  className="gap-3 py-2.5"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {pwd.url ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${pwd.url}&sz=28`}
                        alt=""
                        className="h-5 w-5 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-blue-700 text-[11px] font-bold">
                        {pwd.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13.5px] font-medium">{pwd.title}</span>
                    {pwd.username && (
                      <span className="text-[12px] text-muted-foreground ml-2 truncate">{pwd.username}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                    {copiedId === pwd.id
                      ? <><Check className="h-3 w-3 text-emerald-600" /> Copied!</>
                      : <><Copy className="h-3 w-3" /> Copy</>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Documents */}
        {documents && documents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Documents (${documents.length})`}>
              {documents.slice(0, 5).map((doc) => (
                <CommandItem
                  key={doc.id}
                  value={`document ${doc.name} ${doc.category} ${doc.documentNumber ?? ""}`}
                  onSelect={() => go("/vault/documents")}
                  className="gap-3 py-2.5"
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${CAT_COLORS[doc.category] ?? "bg-slate-100 text-slate-600"}`}>
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13.5px] font-medium">{doc.name}</span>
                    <span className="text-[12px] text-muted-foreground ml-2">{doc.category}</span>
                  </div>
                  {doc.isExpired && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">Expired</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Footer tip */}
        <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[11px] text-muted-foreground/60">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
