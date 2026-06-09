import { useState } from "react";
import { Document } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Check,
  FileText,
  CreditCard,
  Heart,
  Car,
  Home,
  Landmark,
  ShieldCheck,
  CalendarDays,
  Building2,
  Hash,
  CalendarClock,
  StickyNote,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { formatDate } from "@/lib/format";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Identity: ShieldCheck,
  Financial: CreditCard,
  Medical: Heart,
  Vehicle: Car,
  Property: Home,
  Government: Landmark,
  Other: FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
  Identity: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Financial: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  Vehicle: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Property: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Government: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Other: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: `${label} copied!`, duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-foreground mt-0.5 break-all">{value}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied
          ? <Check className="h-4 w-4 text-green-500" />
          : <Copy className="h-4 w-4 text-muted-foreground" />
        }
      </Button>
    </div>
  );
}

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30)
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Expiring in {doc.daysUntilExpiry} days</Badge>;
  return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Valid</Badge>;
}

interface DocumentPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export default function DocumentPreviewDialog({ document: doc, open, onOpenChange, onEdit }: DocumentPreviewDialogProps) {
  const { toast } = useToast();
  const [copiedAll, setCopiedAll] = useState(false);

  if (!doc) return null;

  const CategoryIcon = CATEGORY_ICONS[doc.category] ?? FileText;
  const categoryColor = CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.Other;

  const fields: Array<{ label: string; value: string | null | undefined; icon: React.ElementType }> = [
    { label: "Document Name", value: doc.name, icon: FileText },
    { label: "Document Number", value: doc.documentNumber, icon: Hash },
    { label: "Issued By", value: doc.issuedBy, icon: Building2 },
    { label: "Issue Date", value: doc.issueDate ? formatDate(doc.issueDate) : null, icon: CalendarDays },
    { label: "Expiry Date", value: doc.expiryDate ? formatDate(doc.expiryDate) : null, icon: CalendarClock },
    { label: "Notes", value: doc.notes, icon: StickyNote },
  ];

  const visibleFields = fields.filter((f) => f.value);

  const handleCopyAll = () => {
    const text = visibleFields
      .map((f) => `${f.label}: ${f.value}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast({ title: "All details copied!", duration: 1800 });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${categoryColor}`}>
                  <CategoryIcon className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-lg text-white leading-tight">{doc.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColor}`}>
                      {doc.category}
                    </span>
                    <ExpiryBadge doc={doc} />
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {visibleFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No details stored. Edit to add document information.
            </div>
          ) : (
            visibleFields.map((f) => (
              <CopyField key={f.label} label={f.label} value={f.value!} icon={f.icon} />
            ))
          )}

          {doc.fileUrl && (
            <Button
              variant="outline"
              className="w-full mt-1"
              onClick={() => window.open(doc.fileUrl!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open File Link
            </Button>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          {visibleFields.length > 0 && (
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCopyAll}
            >
              {copiedAll
                ? <><Check className="h-4 w-4 mr-2 text-green-500" /> Copied!</>
                : <><ClipboardList className="h-4 w-4 mr-2" /> Copy All</>
              }
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              Edit Document
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
