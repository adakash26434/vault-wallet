import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, Mail, Scale } from "lucide-react";

const LAST_UPDATED = "June 9, 2025";
const CONTACT_EMAIL = "aakash@personalkeywallet.com.np";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-[16px] font-bold text-foreground">{title}</h2>
      </div>
      <div className="ml-10.5 space-y-2 text-[13.5px] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]" style={{ fontFamily: "'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/auth/login">
            <button className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold text-[15px] text-foreground">Key Wallet</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Privacy Policy</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Last updated: {LAST_UPDATED} · Governed by the laws of Nepal
          </p>
        </div>

        {/* Intro card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 mb-8 text-[13.5px] text-foreground/80 leading-relaxed">
          Personal Key Wallet ("we", "our", "the application") is developed by <strong>Aakash Adhikari</strong> and
          operated under the laws of Nepal. This Privacy Policy explains how we collect, use, and protect your
          personal information in compliance with the{" "}
          <strong>Individual Privacy Act, 2075 (2018)</strong> (व्यक्तिगत गोपनीयता ऐन, २०७५) and the{" "}
          <strong>Electronic Transaction Act, 2063 (2006)</strong> (विद्युतीय कारोबार ऐन, २०६३) of Nepal.
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border/60">
          {/* Section 1 */}
          <div className="p-6">
            <Section icon={Eye} title="1. Information We Collect">
              <p>We collect only what is strictly necessary to provide the service:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Account information</strong> — your name (optional) and email address used to create and identify your account.</li>
                <li><strong>Vault data</strong> — passwords, document details, and financial records that you voluntarily enter. These are encrypted before storage.</li>
                <li><strong>Authentication data</strong> — a TOTP secret for two-factor authentication (Google Authenticator). This is encrypted at rest.</li>
                <li><strong>Usage logs</strong> — anonymised request logs (timestamp, HTTP method, endpoint path, status code) for security monitoring. No request body content is logged.</li>
              </ul>
              <p className="mt-2">We do <strong>not</strong> collect cookies, device fingerprints, location data, or any analytics beyond the above.</p>
            </Section>
          </div>

          {/* Section 2 */}
          <div className="p-6">
            <Section icon={Lock} title="2. How We Protect Your Data">
              <p>
                All sensitive vault fields (passwords, usernames, document numbers, TOTP secrets) are encrypted using{" "}
                <strong>AES-256-GCM</strong> field-level encryption before being written to the database.
                Plaintext values are never stored on disk.
              </p>
              <p>
                Account passwords are hashed using <strong>bcrypt</strong> (cost factor 12). We use HTTPS/TLS in
                transit and apply security headers (HSTS, X-Frame-Options, X-Content-Type-Options) via Helmet.js.
              </p>
              <p>
                These measures align with the security obligations under <strong>Section 47 of the Electronic Transaction Act, 2063</strong>, which requires the protection of electronic records from unauthorised access.
              </p>
            </Section>
          </div>

          {/* Section 3 */}
          <div className="p-6">
            <Section icon={Server} title="3. Data Storage & Retention">
              <p>
                Your data is stored on servers. We retain your account data for as long as your account is active.
                If you delete your account, all associated vault entries are permanently purged within <strong>30 days</strong>.
              </p>
              <p>
                Server-side request logs are retained for a maximum of <strong>90 days</strong> for security auditing,
                after which they are automatically deleted.
              </p>
              <p>
                Under <strong>Section 8 of the Individual Privacy Act, 2075</strong>, you have the right to request
                correction or deletion of your personal data at any time by contacting us at the address below.
              </p>
            </Section>
          </div>

          {/* Section 4 */}
          <div className="p-6">
            <Section icon={ShieldCheck} title="4. Disclosure of Information">
              <p>We do <strong>not</strong> sell, rent, or share your personal information with any third party, advertiser, or data broker.</p>
              <p>We may disclose information only in the following limited circumstances:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>When required by a valid order of a competent court or government authority of Nepal under applicable law.</li>
                <li>To prevent fraud, security breaches, or threats to the safety of users, as permitted under the <strong>Electronic Transaction Act, 2063</strong>.</li>
              </ul>
            </Section>
          </div>

          {/* Section 5 */}
          <div className="p-6">
            <Section icon={Scale} title="5. Your Rights Under Nepal Law">
              <p>Under the <strong>Individual Privacy Act, 2075 (2018)</strong>, you have the following rights:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Right of access</strong> — to know what personal information we hold about you.</li>
                <li><strong>Right to correction</strong> — to request correction of inaccurate personal data.</li>
                <li><strong>Right to deletion</strong> — to request permanent deletion of your account and all associated data.</li>
                <li><strong>Right to restrict processing</strong> — to object to how we use your data in certain circumstances.</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please email us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>.
                We will respond within <strong>15 working days</strong> as required by applicable Nepal law.
              </p>
            </Section>
          </div>

          {/* Section 6 */}
          <div className="p-6">
            <Section icon={Mail} title="6. Contact & Grievance Redressal">
              <p>
                If you have any concerns about how your data is handled, or wish to lodge a complaint, please contact:
              </p>
              <div className="mt-3 bg-muted/40 rounded-xl px-4 py-3 text-[13px] space-y-1">
                <p><strong>Aakash Adhikari</strong> — Developer &amp; Data Controller</p>
                <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a></p>
                <p>Jurisdiction: Nepal</p>
              </div>
              <p className="mt-3">
                If you are unsatisfied with our response, you may file a complaint with the
                competent authority under the Individual Privacy Act, 2075 or approach the
                Department of Information Technology, Government of Nepal.
              </p>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-[12px] text-muted-foreground">
            🇳🇵 Made in Nepal · Developed by <strong>Aakash Adhikari</strong> · © {new Date().getFullYear()} Key Wallet
          </p>
          <div className="flex items-center justify-center gap-3 text-[12px]">
            <Link href="/terms" className="text-primary hover:underline underline-offset-2">Terms of Service</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
