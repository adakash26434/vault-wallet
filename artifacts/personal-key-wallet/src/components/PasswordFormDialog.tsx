import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePassword, useUpdatePassword, getListPasswordsQueryKey, getGetPasswordStatsQueryKey } from "@workspace/api-client-react";
import { PasswordEntry } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
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

const CATEGORIES = ["Email", "Social", "Banking", "Mobile Wallet", "Work", "Shopping", "Entertainment", "Government", "Personal", "Other"];

const DOMAIN_CATEGORY_MAP: Record<string, string> = {
  gmail: "Email", yahoo: "Email", outlook: "Email", proton: "Email",
  facebook: "Social", instagram: "Social", twitter: "Social", tiktok: "Social", linkedin: "Social",
  esewa: "Mobile Wallet", khalti: "Mobile Wallet", imepay: "Mobile Wallet",
  nbl: "Banking", nic: "Banking", prabhu: "Banking", siddhartha: "Banking", laxmi: "Banking",
  nabil: "Banking", himalayan: "Banking", kumari: "Banking", mega: "Banking",
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
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < length; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join("");
}

export default function PasswordFormDialog({ children, password, open, onOpenChange }: PasswordFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
    if (password && isOpen) {
      form.reset({
        title: password.title,
        username: password.username,
        password: password.password,
        url: password.url || "",
        category: password.category || "Personal",
        notes: password.notes || "",
      });
    } else if (!password && isOpen) {
      form.reset({
        title: "",
        username: "",
        password: "",
        url: "",
        category: "Personal",
        notes: "",
      });
    }
  }, [password, isOpen, form]);

  useEffect(() => {
    const currentCategory = form.getValues("category");
    if (!currentUrl || (currentCategory !== "Personal" && currentCategory !== "")) return;
    
    try {
      let domain = currentUrl;
      if (currentUrl.includes("://")) {
        domain = new URL(currentUrl).hostname;
      }
      domain = domain.replace(/^www\./, '').split('.')[0].toLowerCase();
      
      for (const [key, category] of Object.entries(DOMAIN_CATEGORY_MAP)) {
        if (domain.includes(key)) {
          form.setValue("category", category, { shouldValidate: true });
          break;
        }
      }
    } catch (e) {
      // ignore invalid URLs
    }
  }, [currentUrl, form]);

  const handleGeneratePassword = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 500);
    const newPwd = generatePassword();
    form.setValue("password", newPwd, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
  };

  const calculateStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = calculateStrength(currentPassword);
  
  const getStrengthColor = (index: number) => {
    if (strengthScore === 0) return "bg-muted";
    if (index >= strengthScore) return "bg-muted";
    if (strengthScore === 1) return "bg-red-500";
    if (strengthScore === 2) return "bg-orange-500";
    if (strengthScore === 3) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strengthScore === 0) return "";
    if (strengthScore === 1) return "Weak";
    if (strengthScore === 2) return "Fair";
    if (strengthScore === 3) return "Good";
    return "Strong";
  };

  const getStrengthTextColor = () => {
    if (strengthScore === 1) return "text-red-500";
    if (strengthScore === 2) return "text-orange-500";
    if (strengthScore === 3) return "text-amber-500";
    if (strengthScore === 4) return "text-green-500";
    return "text-muted-foreground";
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (password) {
      updateMutation.mutate(
        { id: password.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
            toast({ title: "Password updated successfully" });
            setIsOpen(false);
          },
          onError: (error: any) => {
            toast({ 
              title: "Failed to update password", 
              description: error.message || "An error occurred", 
              variant: "destructive" 
            });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPasswordsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPasswordStatsQueryKey() });
            toast({ title: "Password added successfully" });
            setIsOpen(false);
            form.reset();
          },
          onError: (error: any) => {
            toast({ 
              title: "Failed to add password", 
              description: error.message || "An error occurred", 
              variant: "destructive" 
            });
          }
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{password ? "Edit Password" : "Add New Password"}</DialogTitle>
          <DialogDescription>
            {password ? "Update your stored credentials." : "Store a new secure credential in your vault."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title / Website Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Gmail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username / Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "Personal"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type={showPassword ? "text" : "password"} className="pr-20" {...field} />
                    </FormControl>
                    <div className="absolute right-0 top-0 h-full flex items-center pr-1">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-transparent"
                        onClick={handleGeneratePassword}
                        title="Generate strong password"
                      >
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${isGenerating ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex gap-1 h-1.5 mb-1">
                      {[0, 1, 2, 3].map((index) => (
                        <div 
                          key={index} 
                          className={`flex-1 rounded-full transition-colors ${getStrengthColor(index)}`}
                        />
                      ))}
                    </div>
                    {strengthScore > 0 && (
                      <div className={`text-xs text-right font-medium ${getStrengthTextColor()}`}>
                        {getStrengthText()}
                      </div>
                    )}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional information" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {password ? "Save Changes" : "Add Password"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
