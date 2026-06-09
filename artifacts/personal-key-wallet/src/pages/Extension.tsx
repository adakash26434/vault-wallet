import {
  ShieldCheck, Smartphone, CreditCard, Lock, Globe, Eye,
  FileText, CheckCircle2, AlertTriangle, Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GUIDES = [
  {
    Icon: Smartphone,
    title: "eSewa & Khalti Safety",
    badge: "Mobile Wallets",
    badgeColor: "bg-green-100 text-green-700",
    iconColor: "bg-green-100 text-green-700",
    tips: [
      { warn: true,  text: "NEVER install eSewa/Khalti from WhatsApp or SMS links — only from the official Google Play Store or App Store." },
      { warn: true,  text: "Never share your 6-digit PIN or OTP to anyone — not even to people claiming to be eSewa/Khalti support." },
      { warn: false, text: "Enable fingerprint or face lock on your mobile wallet apps." },
      { warn: false, text: "Check the URL carefully before logging in on web: look for 'esewa.com.np' and 'khalti.com' exactly." },
      { warn: false, text: "Turn on SMS transaction alerts so you are notified of every transaction." },
      { warn: true,  text: "If someone sends you money 'by mistake' and asks you to send it back — it is a scam. Contact eSewa support directly." },
    ],
  },
  {
    Icon: CreditCard,
    title: "Internet Banking Safety",
    badge: "NRB Guidelines",
    badgeColor: "bg-blue-100 text-blue-700",
    iconColor: "bg-blue-100 text-blue-700",
    tips: [
      { warn: false, text: "NRB-registered banks (NIC Asia, Nabil, Himalayan, Global IME, etc.) will NEVER ask for your password by phone or email." },
      { warn: false, text: "Use ConnectIPS (connectips.com) for secure inter-bank transfers. Always verify the SSL padlock." },
      { warn: true,  text: "Avoid using internet banking on public computers or shared Wi-Fi (e.g., café, hotel Wi-Fi)." },
      { warn: false, text: "Always log out after completing your internet banking session." },
      { warn: false, text: "Activate dual-factor authentication on your internet banking if your bank supports it." },
      { warn: true,  text: "Report any unauthorised transaction to your bank's helpline and Nepal Police Cybercrime Bureau: 01-4412695." },
    ],
  },
  {
    Icon: Lock,
    title: "Password & Vault Security",
    badge: "Best Practice",
    badgeColor: "bg-purple-100 text-purple-700",
    iconColor: "bg-purple-100 text-purple-700",
    tips: [
      { warn: false, text: "Use a unique password for every service — especially email, eSewa, and banking accounts." },
      { warn: false, text: "A strong password: 12+ characters, mixed UPPER/lower case, numbers (123), and symbols (@#$)." },
      { warn: false, text: "Use Key Wallet's built-in password generator to create strong, random passwords instantly." },
      { warn: true,  text: "Never write passwords on paper or save them in phone notes. Use this encrypted vault instead." },
      { warn: false, text: "Change your passwords immediately if you receive a security alert from any service." },
      { warn: false, text: "Your passwords in Key Wallet are protected by AES-256-GCM military-grade encryption." },
    ],
  },
  {
    Icon: Globe,
    title: "Phishing & Scam Awareness",
    badge: "⚠️ Critical",
    badgeColor: "bg-red-100 text-red-700",
    iconColor: "bg-red-100 text-red-700",
    tips: [
      { warn: true,  text: "\"तपाईंले lottery जित्नुभयो\" (You won a lottery) — SMS or phone calls claiming prizes are ALWAYS scams." },
      { warn: true,  text: "Fake government websites offering visa or passport processing — verify at mofa.gov.np / passport.gov.np." },
      { warn: true,  text: "Fake job offers asking for a 'registration fee' or 'security deposit' are scams targeting migrant workers." },
      { warn: false, text: "Before clicking any link in SMS, hover over it or type the URL manually into the browser." },
      { warn: false, text: "Nepal Police Cybercrime: 01-4412695 | NRB Financial Intelligence: 01-4236256." },
      { warn: true,  text: "WhatsApp messages from unknown numbers offering jobs abroad — verify through the Department of Foreign Employment." },
    ],
  },
  {
    Icon: Eye,
    title: "Two-Factor Authentication",
    badge: "2FA Guide",
    badgeColor: "bg-amber-100 text-amber-700",
    iconColor: "bg-amber-100 text-amber-700",
    tips: [
      { warn: false, text: "2FA (Google Authenticator) means even if someone steals your password, they cannot log in without your phone." },
      { warn: true,  text: "Store your Google Authenticator backup codes securely — losing your phone without backup codes means permanent account loss." },
      { warn: true,  text: "Never screenshot your 2FA QR code and send it to anyone — it gives full account access." },
      { warn: false, text: "Enable 2FA on your email account too — email is the master key to all other accounts via 'Forgot Password'." },
      { warn: false, text: "If you lose your 2FA device for Key Wallet, contact us immediately with proof of identity." },
      { warn: false, text: "Google Authenticator codes expire every 30 seconds — enter them quickly after they appear." },
    ],
  },
  {
    Icon: FileText,
    title: "Document & Identity Safety",
    badge: "Identity Protection",
    badgeColor: "bg-violet-100 text-violet-700",
    iconColor: "bg-violet-100 text-violet-700",
    tips: [
      { warn: true,  text: "Never share your citizenship number, passport number, or PAN card number on social media or unverified forms." },
      { warn: false, text: "Store scanned copies of important documents in Key Wallet's encrypted document vault for emergency access." },
      { warn: false, text: "Track document expiry dates in Key Wallet — passport, driving licence, insurance — to avoid fines." },
      { warn: false, text: "Renew your Nepal passport at: passport.gov.np. Beware of agents charging extra fees." },
      { warn: true,  text: "If your citizenship/PAN card is lost, report immediately to the District Administration Office (DAO)." },
      { warn: false, text: "Keep photos of your bluebook, insurance certificate, and driving licence stored here for roadside emergencies." },
    ],
  },
];

const HELPLINES = [
  { name: "Nepal Police Cybercrime Bureau", number: "01-4412695" },
  { name: "Nepal Rastra Bank (NRB) Financial Intelligence", number: "01-4236256" },
  { name: "Dept. of Foreign Employment (DOFE)", number: "1180" },
  { name: "National Consumer Forum", number: "01-5970270" },
];

export default function Extension() {
  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nepal Digital Security Guide</h1>
            <p className="text-muted-foreground text-[14px]">Protecting yourself online — tailored for Nepali users 🇳🇵</p>
          </div>
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            <strong>Cybercrime in Nepal is rising rapidly.</strong> Digital wallet fraud, phishing scams, and identity theft 
            affected thousands of Nepali users last year. This guide helps you stay protected.
          </span>
        </div>
      </div>

      {/* Guide cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GUIDES.map(({ Icon, title, badge, badgeColor, iconColor, tips }) => (
          <Card key={title} className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-[15px] font-bold text-foreground">{title}</CardTitle>
                </div>
                <Badge className={`text-[10.5px] shrink-0 ${badgeColor}`}>{badge}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2.5">
                {tips.map((tip) => (
                  <div key={tip.text} className="flex items-start gap-2.5">
                    {tip.warn
                      ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      : <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />}
                    <p className="text-[12.5px] text-muted-foreground leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Emergency helplines */}
      <Card className="bg-white border-border" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Phone className="h-[18px] w-[18px] text-red-700" />
            </div>
            <div>
              <CardTitle className="text-[15px] font-bold">Emergency Helplines — Nepal</CardTitle>
              <p className="text-[12.5px] text-muted-foreground">Report cybercrime, fraud, or identity theft</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HELPLINES.map(({ name, number }) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl border border-border/50">
                <div>
                  <p className="text-[12.5px] font-semibold text-foreground">{name}</p>
                </div>
                <a
                  href={`tel:${number.replace(/-/g, "")}`}
                  className="text-[14px] font-bold text-primary hover:underline underline-offset-2 shrink-0 ml-3"
                >
                  {number}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="text-center text-[12px] text-muted-foreground py-2">
        🇳🇵 Personal Key Wallet — Keeping Nepali data safe · Developed by Aakash Adhikari
      </div>
    </div>
  );
}
