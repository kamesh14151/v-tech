import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Optimus Enterprise",
  description: "Insights on AI-powered media monitoring, PR intelligence, and enterprise communications.",
};

const posts = [
  {
    slug: "semantic-discovery-vs-keyword-search",
    date: "Aug 22, 2026",
    category: "Product",
    title: "Why Semantic Discovery Beats Keyword Search for PR Monitoring",
    excerpt: "Traditional keyword matching misses the 60% of coverage that matters most — indirect mentions, competitor contrasts, and context-dependent references.",
  },
  {
    slug: "morning-intelligence-briefings",
    date: "Aug 15, 2026",
    category: "Use Cases",
    title: "How Enterprise PR Teams Are Replacing Manual Clipping with Morning Intelligence Briefings",
    excerpt: "A look at how AI-generated briefings are saving communications teams 3+ hours per day and delivering more accurate coverage summaries.",
  },
  {
    slug: "contextual-validation-false-alerts",
    date: "Aug 8, 2026",
    category: "Technology",
    title: "Eliminating False Alerts with Contextual Boundary Validation",
    excerpt: "We reduced false positive alerts by 98.6% by classifying every mention as primary subject, supporting reference, or passing footnote.",
  },
  {
    slug: "cisionone-vs-optimus",
    date: "Jul 30, 2026",
    category: "Competitive",
    title: "Optimus vs. CisionOne: A Feature-by-Feature Comparison for 2026",
    excerpt: "An honest breakdown of where each platform excels — and where Optimus's AI-native approach changes the game.",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <Link href="/" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-12 inline-flex items-center gap-2">
          ← Back to home
        </Link>

        <div className="mt-8">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Blog</span>
          <h1 className="text-4xl font-display tracking-tight mt-3 mb-2">Intelligence Insights</h1>
          <p className="text-muted-foreground mb-12">Perspectives on AI, PR, and the future of media intelligence.</p>

          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="group p-6 rounded-2xl border border-foreground/10 hover:border-foreground/30 transition-all bg-card">
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground mb-3">
                  <span className="px-2 py-0.5 rounded bg-foreground/5 text-foreground">{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h2 className="text-lg font-semibold font-sans text-foreground group-hover:underline underline-offset-2 mb-2 cursor-pointer">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 text-xs font-mono text-foreground/60 hover:text-foreground transition-colors cursor-pointer">
                  Read more →
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
