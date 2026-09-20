import Link from "next/link";
import type { Metadata } from "next";
import { Shield, Lock, Eye, Server } from "lucide-react";

export const metadata: Metadata = {
  title: "Security — Optimus Enterprise",
  description: "How Optimus protects your data and ensures enterprise-grade security.",
};

const practices = [
  { icon: Lock, title: "Encryption at rest & in transit", body: "All data is encrypted using AES-256 at rest. All connections are secured via TLS 1.3." },
  { icon: Shield, title: "SOC 2 Type II compliant", body: "Our infrastructure and processes are audited annually for security, availability, and confidentiality." },
  { icon: Eye, title: "Zero-trust access model", body: "Every internal service requires authenticated, role-scoped tokens. No implicit trust between services." },
  { icon: Server, title: "Isolated tenant data", body: "Each workspace operates in a logically isolated data environment. Cross-tenant data access is architecturally impossible." },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>

        <div className="mt-8">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Security</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-4">Enterprise-grade security, by default</h1>
          <p className="text-muted-foreground leading-relaxed mb-12">
            Security isn't a checkbox for us — it's a core product requirement. Every layer of Optimus is built with data protection and zero-trust principles.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {practices.map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-6 rounded-2xl border border-foreground/10 bg-card">
                <Icon className="w-5 h-5 text-foreground mb-3" />
                <h2 className="font-semibold text-sm mb-1">{title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-display tracking-tight mb-4">Vulnerability reporting</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            If you discover a security vulnerability, please disclose it responsibly by emailing{" "}
            <a href="mailto:security@optimus-intelligence.com" className="text-foreground underline underline-offset-2">
              security@optimus-intelligence.com
            </a>
            . We aim to acknowledge all reports within 24 hours and resolve critical issues within 72 hours.
          </p>

          <div className="p-5 rounded-2xl border border-foreground/10 bg-foreground/3 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-foreground font-semibold">All systems operational</span>
            </div>
            <span>Last audit: August 2026 · Next audit: February 2027</span>
          </div>
        </div>
      </div>
    </main>
  );
}
