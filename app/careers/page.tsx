import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers — Optimus Enterprise",
  description: "Join the team building the future of AI-powered media intelligence.",
};

const openRoles = [
  { title: "Senior Full-Stack Engineer", team: "Engineering", location: "Remote · Global", type: "Full-time" },
  { title: "AI/ML Engineer — NLP", team: "AI Research", location: "Remote · Global", type: "Full-time" },
  { title: "Enterprise Account Executive", team: "Sales", location: "New York / London", type: "Full-time" },
  { title: "Product Designer", team: "Design", location: "Remote · Global", type: "Full-time" },
  { title: "Customer Success Manager", team: "Customer Success", location: "Remote · US", type: "Full-time" },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Careers</span>
            <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full">We're hiring</span>
          </div>
          <h1 className="text-4xl font-display tracking-tight mb-4">Build the intelligence era of communications</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12">
            We're a small, focused team shipping fast. We value autonomy, craft, and meaningful impact over process and meetings.
          </p>

          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-6">Open Roles</h2>
          <div className="space-y-3">
            {openRoles.map((role) => (
              <div
                key={role.title}
                className="flex items-center justify-between p-5 rounded-2xl border border-foreground/10 hover:border-foreground/30 bg-card transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-foreground group-hover:underline underline-offset-2">{role.title}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">{role.team} · {role.location}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 bg-foreground/5 rounded text-muted-foreground">{role.type}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-foreground/10 bg-foreground/3">
            <p className="text-sm text-muted-foreground">
              Don't see your role? Send your resume and a note about what you'd build to{" "}
              <a href="mailto:careers@optimus-intelligence.com" className="text-foreground underline underline-offset-2">
                careers@optimus-intelligence.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
