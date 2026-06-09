import { useState } from "react";
import { Document } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Copy, Check, FileText, CreditCard, Heart, Car, Home, Landmark,
  ShieldCheck, CalendarDays, Building2, Hash, CalendarClock,
  StickyNote, ExternalLink, ClipboardList, Pencil,
} from "lucide-react";
import { formatDate } from "@/lib/format";

const CATEGORY_META: Record<string, { Icon: React.ElementType; bg: string; text: string; border: string }> = {
  Identity:   { Icon: ShieldCheck, bg: "bg-blue-100",    text: "text-blue-700",    border: "border-blue-200" },
  Financial:  { Icon: CreditCard,  bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  Medical:    { Icon: Heart,       bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200" },
  Vehicle:    { Icon: Car,         bg: "bg-orange-100",  text: "text-orange-700",  border: "border-orange-200" },
  Property:   { Icon: Home,        bg: "bg-violet-100",  text: "text-violet-700",  border: "border-violet-200" },
  Government: { Icon: Landmark,    bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200" },
  Other:      { Icon: FileText,    bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200" },
};

function CopyField({
  label, value, icon: Icon,
}: { label: string; value: string; icon: React.ElementType }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: `${label} copied`, duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-border/60 shadow-sm">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-[13.5px] font-semibold text-foreground mt-0.5 break-all leading-snug">{value}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </Button>
    </div>
  );
}

function ExpiryBadge({ doc }: { doc: Document }) {
  if (!doc.expiryDate) return null;
  if (doc.isExpired)
    return <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px]">Expired</Badge>;
  if (doc.daysUntilExpiry != null && doc.daysUntilExpiry <= 30)
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">
        Expires in {doc.daysUntilExpiry}d
      </Badge>
    );
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[11px]">Valid</Badge>;
}

interface DocumentPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export default function DocumentPreviewDialog({
  document: doc, open, onOpenChange, onEdit,
}: DocumentPreviewDialogProps) {
  const { toast } = useToast();
  const [copiedAll, setCopiedAll] = useState(false);

  if (!doc) return null;

  const meta = CATEGORY_META[doc.category] ?? CATEGORY_META.Other;
  const { Icon: CategoryIcon } = meta;

  const fields: Array<{ label: string; value: string | null | undefined; icon: React.ElementType }> = [
    { label: "Document Number", value: doc.documentNumber, icon: Hash },
    { label: "Issued By",       value: doc.issuedBy,       icon: Building2 },
    { label: "Issue Date",      value: doc.issueDate ? formatDate(doc.issueDate) : null,   icon: CalendarDays },
    { label: "Expiry Date",     value: doc.expiryDate ? formatDate(doc.expiryDate) : null, icon: CalendarClock },
    { label: "Notes",           value: doc.notes,           icon: StickyNote },
  ];

  const visibleFields = fields.filter((f) => f.value);

  const handleCopyAll = () => {
    const lines = [
      `Document: ${doc.name}`,
      `Category: ${doc.category}`,
      ...visibleFields.map((f) => `${f.label}: ${f.value}`),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopiedAll(true);
    toast({ title: "All details copied!", duration: 1800 });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden gap-0">

        {/* Light-theme header */}
        <div className={`${meta.bg} px-6 pt-5 pb-5 border-b ${meta.border}`}>
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={`h-14 w-14 rounded-2xl ${meta.bg} border-2 ${meta.border} flex items-center justify-center shadow-sm`}>
                <CategoryIcon className={`h-7 w-7 ${meta.text}`} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <DialogTitle className="text-[17px] font-bold text-foreground leading-tight">
                  {doc.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.text} ${meta.border}`}>
                    {doc.category}
                  </span>
                  <ExpiryBadge doc={doc} />
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
          {visibleFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-[13.5px] font-medium text-foreground">No details stored</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Click "Edit" to add document number, dates, and more.
              </p>
            </div>
          ) : (
            visibleFields.map((f) => (
              <CopyField key={f.label} label={f.label} value={f.value!} icon={f.icon} />
            ))
          )}

          {doc.fileUrl && (
            <Button
              variant="outline"
              className="w-full mt-2 h-10 text-[13px]"
              onClick={() => window.open(doc.fileUrl!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open File Link
            </Button>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-5 flex gap-2 border-t border-border/50 pt-4">
          {visibleFields.length > 0 && (
            <Button variant="secondary" className="flex-1 h-10 text-[13px]" onClick={handleCopyAll}>
              {copiedAll
                ? <><Check className="h-4 w-4 mr-2 text-emerald-600" /> Copied!</>
                : <><ClipboardList className="h-4 w-4 mr-2" /> Copy All</>}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" className="flex-1 h-10 text-[13px]" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Document
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
