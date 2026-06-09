import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle, Scale, Users, Ban } from "lucide-react";

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

export default function TermsOfService() {
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
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Terms of Service</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Last updated: {LAST_UPDATED} · Governed by the laws of Nepal
          </p>
        </div>

        {/* Intro card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 mb-8 text-[13.5px] text-foreground/80 leading-relaxed">
          These Terms of Service ("Terms") constitute a legally binding agreement between you and{" "}
          <strong>Aakash Adhikari</strong> ("developer", "we", "our") governing your use of Personal Key Wallet
          ("the application", "the service"). By creating an account or using the service, you agree to be
          bound by these Terms, which are governed by the laws of Nepal — including the{" "}
          <strong>Electronic Transaction Act, 2063 (2006)</strong>,{" "}
          <strong>Consumer Protection Act, 2075 (2018)</strong>, and{" "}
          <strong>Individual Privacy Act, 2075 (2018)</strong>.
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border/60">

          {/* Section 1 */}
          <div className="p-6">
            <Section icon={FileText} title="1. Acceptance of Terms">
              <p>
                By registering for or using Personal Key Wallet, you confirm that you are at least{" "}
                <strong>16 years of age</strong> (or the age of digital consent under applicable Nepal law) and have the
                legal capacity to enter into this agreement.
              </p>
              <p>
                If you are using the service on behalf of an organisation, you confirm you have authority to bind
                that organisation to these Terms.
              </p>
              <p>
                We reserve the right to amend these Terms at any time. Material changes will be communicated by
                updating the "Last updated" date above. Continued use of the service constitutes acceptance of
                the revised Terms.
              </p>
            </Section>
          </div>

          {/* Section 2 */}
          <div className="p-6">
            <Section icon={ShieldCheck} title="2. Description of Service">
              <p>Personal Key Wallet is a personal data management application that provides:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>An encrypted password vault for storing login credentials.</li>
                <li>A secure document store for identity, financial, medical, vehicle, and government documents.</li>
                <li>A personal finance tracker for logging income and expenses in NPR.</li>
                <li>Mandatory two-factor authentication (TOTP via Google Authenticator) on every login.</li>
              </ul>
              <p className="mt-2">
                The service is provided on an <strong>"as is"</strong> basis for personal, non-commercial use.
                We do not guarantee uninterrupted availability and reserve the right to modify or discontinue
                features with reasonable notice.
              </p>
            </Section>
          </div>

          {/* Section 3 */}
          <div className="p-6">
            <Section icon={Users} title="3. Your Responsibilities">
              <p>You are solely responsible for:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Keeping your login credentials and 2FA device secure and confidential.</li>
                <li>The accuracy of data you enter into the vault. We do not verify or validate vault content.</li>
                <li>Maintaining a backup of your Google Authenticator recovery codes. Loss of your 2FA device
                    may result in permanent loss of access to your account.</li>
                <li>Ensuring the data you store does not violate any Nepal law or infringe on third-party rights.</li>
                <li>Notifying us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a> if you
                    suspect unauthorised access to your account.</li>
              </ul>
            </Section>
          </div>

          {/* Section 4 */}
          <div className="p-6">
            <Section icon={Ban} title="4. Prohibited Activities">
              <p>
                In accordance with the <strong>Electronic Transaction Act, 2063, Sections 44–47</strong> (cyber offences),
                the following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Attempting to gain unauthorised access to any account, database, or system component.</li>
                <li>Reverse-engineering, decompiling, or disassembling any part of the application.</li>
                <li>Using the service to store data that facilitates fraud, identity theft, money laundering,
                    or any activity illegal under Nepal law.</li>
                <li>Transmitting malware, viruses, or any code designed to disrupt the service.</li>
                <li>Sharing your account credentials with other persons.</li>
                <li>Automated scraping, crawling, or bulk data extraction from the service.</li>
              </ul>
              <p className="mt-2">
                Violations may result in immediate account suspension and may be reported to the competent
                authorities under Nepal law.
              </p>
            </Section>
          </div>

          {/* Section 5 */}
          <div className="p-6">
            <Section icon={AlertTriangle} title="5. Disclaimers & Limitation of Liability">
              <p>
                The service is provided for personal convenience. While we employ industry-standard encryption
                (AES-256-GCM) and security practices, no system is completely immune to all risks.
              </p>
              <p>
                <strong>We are not liable for</strong>: loss or corruption of data due to events outside our
                reasonable control; loss of access to your account due to a lost 2FA device; indirect or
                consequential damages arising from use of the service.
              </p>
              <p>
                Under the <strong>Consumer Protection Act, 2075</strong>, consumers in Nepal have the right to
                a safe and reliable service. If you experience a service defect, please contact us so we can
                address it in good faith.
              </p>
            </Section>
          </div>

          {/* Section 6 */}
          <div className="p-6">
            <Section icon={Scale} title="6. Governing Law & Dispute Resolution">
              <p>
                These Terms are governed by and construed in accordance with the laws of{" "}
                <strong>Nepal</strong>. Any dispute arising from or related to these Terms or the service
                shall first be attempted to be resolved through good-faith negotiation.
              </p>
              <p>
                If negotiation fails, disputes shall be submitted to the jurisdiction of the competent courts
                of <strong>Kathmandu, Nepal</strong>.
              </p>
              <p>
                Nothing in these Terms limits your statutory rights as a consumer under the{" "}
                <strong>Consumer Protection Act, 2075 (2018)</strong> of Nepal.
              </p>
              <p>
                For any queries regarding these Terms, contact:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">{CONTACT_EMAIL}</a>
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
            <Link href="/privacy" className="text-primary hover:underline underline-offset-2">Privacy Policy</Link>
            <span className="text-muted-foreground/40">·</span>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
