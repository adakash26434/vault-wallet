import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePassword, useUpdatePassword, getListPasswordsQueryKey, getGetPasswordStatsQueryKey } from "@workspace/api-client-react";
import { PasswordEntry } from "@workspace/api-client-react/src/generated/api.schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

const CATEGORIES = ["Personal", "Work", "Finance", "Social", "Shopping", "Other"];

export default function PasswordFormDialog({ children, password, open, onOpenChange }: PasswordFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
  
  // Update form if password changes
  React.useEffect(() => {
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type={showPassword ? "text" : "password"} {...field} />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
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
