import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Optimus Enterprise",
  description: "Learn about Optimus, the AI-powered media intelligence platform built for enterprise PR teams.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>

        <div className="mt-8">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">About</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-6">Built for the intelligence era of PR</h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Optimus is an enterprise media intelligence platform that replaces fragmented PR tools with a single, AI-powered command center. We track coverage, discover indirect mentions, validate context, and deliver daily intelligence briefings — automatically.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 my-12">
            {[
              { stat: "50M+", label: "Articles processed daily" },
              { stat: "99.4%", label: "Boundary precision" },
              { stat: "4", label: "Competitors benchmarked" },
            ].map(({ stat, label }) => (
              <div key={label} className="p-6 rounded-2xl border border-foreground/10 bg-foreground/3">
                <div className="text-3xl font-display font-semibold">{stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-display tracking-tight mt-12 mb-4">Our mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We believe PR intelligence should be fast, accurate, and effortless. Most teams still spend hours manually searching for coverage, reading through irrelevant results, and assembling reports. Optimus automates all of that — so your team can focus on strategy, not searching.
          </p>

          <h2 className="text-2xl font-display tracking-tight mt-10 mb-4">The team</h2>
          <p className="text-muted-foreground leading-relaxed">
            Optimus is built by a team of engineers and PR professionals who have experienced firsthand the frustration of fragmented media tools. We're headquartered globally, with users across North America, Europe, and APAC.
          </p>
        </div>
      </div>
    </main>
  );
}
