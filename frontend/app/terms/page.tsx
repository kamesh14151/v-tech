import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Optimus Enterprise",
  description: "Terms governing use of the Optimus Enterprise platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>
        <div className="mt-8">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Legal</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: August 26, 2026</p>

          {[
            { title: "1. Acceptance of Terms", body: "By accessing or using the Optimus Enterprise platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services." },
            { title: "2. Use of the Service", body: "You may use Optimus only for lawful business purposes. You agree not to reverse-engineer, resell, or misuse the platform or its data. You are responsible for all activity under your account." },
            { title: "3. Subscriptions & Billing", body: "Paid plans are billed monthly or annually in advance. Refunds are provided at our discretion within 14 days of payment. You may cancel at any time — your access continues until the end of the billing period." },
            { title: "4. Data Ownership", body: "You retain full ownership of your data. By using the service, you grant us a limited license to process your data solely for providing the service." },
            { title: "5. Intellectual Property", body: "The Optimus platform, its AI models, and all associated IP are owned by Optimus Intelligence Inc. No license to our IP is granted except as expressly stated here." },
            { title: "6. Limitation of Liability", body: "To the maximum extent permitted by law, Optimus shall not be liable for indirect, incidental, or consequential damages arising from use of the service." },
            { title: "7. Termination", body: "We may suspend or terminate your account for material breach of these terms with reasonable notice. Upon termination, your data will be retained for 30 days then permanently deleted." },
            { title: "8. Changes to Terms", body: "We may update these terms at any time. Continued use of the service after notice of changes constitutes acceptance." },
            { title: "9. Contact", body: "Questions about these terms? Email legal@optimus-intelligence.com." },
          ].map(({ title, body }) => (
            <div key={title} className="mt-8">
              <h2 className="text-lg font-semibold mb-2">{title}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
