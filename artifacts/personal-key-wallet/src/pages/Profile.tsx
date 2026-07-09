import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useUpdateProfile, useChangePassword,
  useListSessions, useRevokeSession, useLogoutOtherSessions,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  User, Mail, Phone, Calendar, MapPin, Edit3, Save, X, Lock,
  ShieldCheck, KeyRound, FileText, Wallet, Eye, EyeOff,
  Monitor, Smartphone, Globe, LogOut, Trash2, AlertCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AVATAR_COLORS = [
  "#0078D4", "#107C10", "#C50F1F", "#7719AA", "#038387",
  "#CA5010", "#8764B8", "#E74856", "#00B294", "#FF8C00",
];

function AvatarDisplay({ name, email, color, size = "lg" }: { name?: string | null; email?: string | null; color?: string | null; size?: "sm" | "lg" }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";
  const bg = color || "#0078D4";
  const dim = size === "lg" ? 80 : 40;
  const font = size === "lg" ? 28 : 15;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none"
      style={{ width: dim, height: dim, background: bg, fontSize: font }}
    >
      {initials}
    </div>
  );
}

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android phone")) return <Smartphone className="h-5 w-5" />;
  if (d.includes("ipad") || d.includes("tablet")) return <Monitor className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Profile() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
    address: user?.address ?? "",
    bio: user?.bio ?? "",
    avatarColor: user?.avatarColor ?? "#0078D4",
  });

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [logoutAllConfirm, setLogoutAllConfirm] = useState(false);

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const revokeMutation = useRevokeSession();
  const logoutOthersMutation = useLogoutOtherSessions();

  const { data: sessions, isLoading: sessionsLoading } = useListSessions();

  function handleEdit() {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      dateOfBirth: user?.dateOfBirth ?? "",
      address: user?.address ?? "",
      bio: user?.bio ?? "",
      avatarColor: user?.avatarColor ?? "#0078D4",
    });
    setEditing(true);
  }

  async function handleSave() {
    updateProfile.mutate(
      { data: { ...form, dateOfBirth: form.dateOfBirth || undefined } },
      {
        onSuccess: (updated) => {
          if (token) login(token, { ...user!, ...updated });
          setEditing(false);
          toast({ title: "Profile updated", description: "Your details have been saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
        },
      }
    );
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast({ title: "Passwords don't match", description: "New password and confirm must match.", variant: "destructive" });
      return;
    }
    changePassword.mutate(
      { data: { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword } },
      {
        onSuccess: () => {
          setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
          setChangingPw(false);
          toast({ title: "Password changed", description: "Your password has been updated successfully." });
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not change password.";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  }

  function handleRevokeSession(id: number) {
    revokeMutation.mutate(
      { sessionId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          toast({ title: "Session removed", description: "That device has been logged out." });
        },
        onError: () => toast({ title: "Failed to remove session", variant: "destructive" }),
      }
    );
  }

  function handleLogoutOthers() {
    logoutOthersMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        setLogoutAllConfirm(false);
        toast({ title: "All other sessions removed", description: "Only your current session remains active." });
      },
      onError: () => toast({ title: "Failed", variant: "destructive" }),
    });
  }

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-[14px]">Manage your personal details and account security</p>
      </div>

      {/* Profile card */}
      <Card className="bg-white border-border" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <CardContent className="pt-6 pb-6 px-6">
          <div className="flex items-start gap-5">
            <AvatarDisplay name={editing ? form.name : user?.name} email={user?.email} color={editing ? form.avatarColor : user?.avatarColor} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-[18px] font-bold text-foreground truncate">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10.5px]">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      2FA Active
                    </Badge>
                  </div>
                </div>
                {!editing ? (
                  <Button size="sm" variant="outline" onClick={handleEdit} className="gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending} className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      {updateProfile.isPending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-5 pt-4 border-t border-border/60">
              <Label className="text-[12.5px] font-semibold mb-2 block">Avatar Color</Label>
              <div className="flex gap-2.5 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      background: c,
                      borderColor: form.avatarColor === c ? "#111" : "transparent",
                      transform: form.avatarColor === c ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Details */}
      <Card className="bg-white border-border" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-[15px] font-bold">Personal Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[12.5px]">Full Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Aakash Adhikari" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[12.5px]">Phone Number</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+977-98XXXXXXXX" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-[12.5px]">Date of Birth</Label>
                <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-[12.5px]">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Kathmandu, Nepal" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bio" className="text-[12.5px]">Bio / About</Label>
                <Textarea id="bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="A short description about yourself…" className="text-[13px] resize-none h-20" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: User, label: "Full Name", value: user?.name },
                { icon: Mail, label: "Email", value: user?.email },
                { icon: Phone, label: "Phone", value: user?.phone },
                { icon: Calendar, label: "Date of Birth", value: user?.dateOfBirth },
                { icon: MapPin, label: "Address", value: user?.address },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-[13.5px] text-foreground font-medium truncate mt-0.5">{value || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
                  </div>
                </div>
              ))}
              {user?.bio && (
                <div className="sm:col-span-2 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Bio</p>
                    <p className="text-[13.5px] text-foreground mt-0.5 leading-relaxed">{user.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="bg-white border-border" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-700" />
              </div>
              <CardTitle className="text-[15px] font-bold">Account Security</CardTitle>
            </div>
            {!changingPw && (
              <Button size="sm" variant="outline" onClick={() => setChangingPw(true)} className="gap-1.5 text-[12.5px]">
                <KeyRound className="h-3.5 w-3.5" />
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-emerald-800">Google Authenticator (2FA)</p>
                <p className="text-[11.5px] text-emerald-700">Active and protecting your account</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Lock className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-[12.5px] font-semibold text-blue-800">AES-256-GCM Encryption</p>
                <p className="text-[11.5px] text-blue-700">All vault data encrypted at rest</p>
              </div>
            </div>
          </div>

          {changingPw && (
            <div className="pt-2 border-t border-border/60 space-y-3">
              <p className="text-[13px] font-semibold text-foreground">Change Password</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[12.5px]">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className="h-9 text-[13px] pr-10"
                    />
                    <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[12.5px]">New Password</Label>
                    <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="8+ characters" className="h-9 text-[13px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12.5px]">Confirm New</Label>
                    <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" className="h-9 text-[13px]" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setChangingPw(false); setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); }}>Cancel</Button>
                <Button size="sm" onClick={handleChangePassword} disabled={changePassword.isPending || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm}>
                  {changePassword.isPending ? "Saving…" : "Update Password"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="bg-white border-border" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold">Active Sessions</CardTitle>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">Devices currently logged in to your account</p>
              </div>
            </div>
            {otherSessions.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-[12.5px] text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setLogoutAllConfirm(true)}
                disabled={logoutOthersMutation.isPending}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout all other devices
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="flex items-center gap-3 py-4 px-4 bg-muted/30 rounded-xl">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-[13px] text-muted-foreground">No active sessions found. This may update after your next login.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                    s.isCurrent
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-muted/20 border-border hover:border-border/80"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.isCurrent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <DeviceIcon device={s.device} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-foreground truncate">{s.device}</p>
                      {s.isCurrent && (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-emerald-200">
                          This device
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {s.ip && s.ip !== "unknown" ? `${s.ip} · ` : ""}
                      Last active {timeAgo(s.lastSeenAt)} · Signed in {timeAgo(s.createdAt)}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokeMutation.isPending}
                      title="Force logout this device"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: KeyRound, label: "Password Vault", sublabel: "Stored credentials", color: "bg-blue-100 text-blue-700" },
          { icon: FileText, label: "Documents", sublabel: "Secured documents", color: "bg-purple-100 text-purple-700" },
          { icon: Wallet, label: "Finance", sublabel: "Records tracked", color: "bg-green-100 text-green-700" },
        ].map(({ icon: Icon, label, sublabel, color }) => (
          <Card key={label} className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{sublabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logout all others confirm */}
      <AlertDialog open={logoutAllConfirm} onOpenChange={setLogoutAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access from all other devices. Only your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutOthers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout all others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
