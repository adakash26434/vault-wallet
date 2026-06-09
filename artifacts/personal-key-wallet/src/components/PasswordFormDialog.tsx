import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreatePassword, useUpdatePassword,
  getListPasswordsQueryKey, getGetPasswordStatsQueryKey,
} from "@workspace/api-client-react";
import { PasswordEntry } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye, EyeOff, Loader2, RefreshCw, KeyRound, Globe,
  User, Tag, StickyNote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  url: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

interface PasswordFormDialogProps {
  children?: React.ReactNode;
  password?: PasswordEntry;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CATEGORIES = [
  "Email", "Social", "Banking", "Mobile Wallet", "Work",
  "Shopping", "Entertainment", "Government", "Personal", "Other",
];

const DOMAIN_CATEGORY_MAP: Record<string, string> = {
  gmail: "Email", yahoo: "Email", outlook: "Email", proton: "Email",
  facebook: "Social", instagram: "Social", twitter: "Social", tiktok: "Social", linkedin: "Social",
  esewa: "Mobile Wallet", khalti: "Mobile Wallet", imepay: "Mobile Wallet",
  nbl: "Banking", nic: "Banking", prabhu: "Banking", siddhartha: "Banking",
  laxmi: "Banking", nabil: "Banking", himalayan: "Banking", kumari: "Banking", mega: "Banking",
  github: "Work", gitlab: "Work", jira: "Work", slack: "Work", notion: "Work",
  netflix: "Entertainment", youtube: "Entertainment", spotify: "Entertainment", disney: "Entertainment",
  daraz: "Shopping", amazon: "Shopping",
  nagarik: "Government", moha: "Government",
};

function generatePassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#$%!&*";
  const all = upper + lower + numbers + symbols;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < length; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join("");
}

function StrengthBar({ password }: { password: string }) {
  const score = React.useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  }, [password]);

  const config = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-amber-400" },
    { label: "Strong", color: "bg-emerald-500" },
  ][score];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i <= score ? config.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${
          score === 1 ? "text-red-500" :
          score === 2 ? "text-orange-500" :
          score === 3 ? "text-amber-500" :
          score === 4 ? "text-emerald-600" : ""
        }`}>
          {config.label}
        </span>
        <span className="text-[11px] text-muted-foreground">{password.length} chars</span>
      </div>
    </div>
  );
}

export default function PasswordFormDialog({
  children, password, open, onOpenChange,
}: PasswordFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreatePassword();
  const updateMutation = useUpdatePassword();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: password?.title || "",
      username: password?.username || "",
      password: password?.password || "",
      url: password?.url || "",
      category: password?.category || "Personal",
      notes: password?.notes || "",
    },
  });

  const currentPassword = form.watch("password") || "";
  const currentUrl = form.watch("url") || "";

  useEffect(() => {
    if (!isOpen) return;
    if (password) {
      form.reset({
        title: password.title,
        username: password.username,
        password: password.password,
        url: password.url || "",
        category: password.category || "Personal",
        notes: password.notes || "",
      });
    } else {
      form.reset({ title: "", username: "", password: "", url: "", category: "Personal", notes: "" });
    }
  }, [password, isOpen]);

  useEffect(() => {
    if (!currentUrl) return;
    const currentCat = form.getValues("category");
    if (currentCat !== "Personal" && currentCat !== "") return;
    try {
      let domain = currentUrl;
      if (currentUrl.includes("://")) domain = new URL(currentUrl).hostname;
      domain = domain.replace(/^www\./, "").split(".")[0].toLowerCase();
      for (const [key, category] of Object.entries(DOMAIN_CATEGORY_MAP)) {
        if (domain.includes(key)) {
          form.setValue("category", category, { shouldValidate: true });
          break;
        }
      }
    } catch { /* ignore */ }
  }, [currentUrl]);

  const handleGenerate = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);
    form.setValue("password", generatePassword(), { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (password) {
      updateMutation.mutate(
        { id: password.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
            toast({ title: "Password updated" });
            setIsOpen(false);
          },
          onError: (e: any) =>
            toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
            toast({ title: "Password saved securely" });
            setIsOpen(false);
            form.reset();
          },
          onError: (e: any) =>
            toast({ title: "Failed to save", description: e.message, variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">

        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(210,100%,40%)] to-[hsl(210,100%,32%)] px-6 pt-5 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-[17px] font-bold text-white">
                {password ? "Edit Credential" : "Add New Credential"}
              </DialogTitle>
            </div>
            <p className="text-[12px] text-white/70 mt-1.5">
              Stored with AES-256-GCM encryption
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold">Service / Website Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gmail, Facebook, NIC Asia" className="h-10 bg-muted/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username + Category */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Username / Email
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" className="h-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "Personal"}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      Password
                    </FormLabel>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                      Generate strong
                    </button>
                  </div>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-10 pr-10 font-mono bg-muted/20"
                        placeholder="Enter or generate a password"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <StrengthBar password={currentPassword} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Website URL
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" className="h-10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-semibold flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                    Notes
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Security question, PIN, or additional info…"
                      className="resize-none h-16 bg-muted/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-10 font-bold"
                style={{ background: "hsl(var(--primary))" }}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {password ? "Save Changes" : "Save Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
