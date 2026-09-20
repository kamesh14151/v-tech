import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Optimus Enterprise",
  description: "How Optimus collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>
        <div className="mt-8 prose prose-sm max-w-none text-foreground">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Legal</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-10">Last updated: August 26, 2026</p>

          {[
            { title: "1. Information We Collect", body: "We collect information you provide directly to us, such as when you create an account, fill out a form, or contact us for support. This includes name, email address, company name, and usage data." },
            { title: "2. How We Use Your Information", body: "We use your information to provide, maintain, and improve our services, send transactional and promotional communications, and comply with legal obligations. We do not sell your personal data." },
            { title: "3. Data Storage", body: "Your data is stored on Neon PostgreSQL databases hosted on AWS infrastructure in the US East region. All data is encrypted at rest and in transit using industry-standard TLS." },
            { title: "4. Cookies", body: "We use session cookies strictly necessary for authentication. We do not use third-party tracking cookies or advertising cookies." },
            { title: "5. Third-Party Services", body: "We integrate with Google OAuth for authentication, NewsAPI.org and The Guardian API for news data. These services have their own privacy policies." },
            { title: "6. Your Rights", body: "Depending on your location, you may have rights to access, correct, or delete your personal data. Contact us at privacy@optimus-intelligence.com to exercise your rights." },
            { title: "7. Contact", body: "For privacy-related questions, contact us at privacy@optimus-intelligence.com." },
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
