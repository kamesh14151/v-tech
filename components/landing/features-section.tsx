"use client";

import { BrainCircuit, FileSearch, Gauge, Newspaper, Radar, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  { icon: BrainCircuit, title: "Semantic Discovery", description: "Find relevant stories through meaning and context, even when your company is never named." },
  { icon: Gauge, title: "Configurable Rule Engine", description: "Tune monitoring rules for industries, products, competitors, regions, topics, and impact." },
  { icon: ShieldCheck, title: "Contextual Validation", description: "Validate every signal against your company profile before it reaches your morning report." },
  { icon: Newspaper, title: "Smart Extraction", description: "Turn long articles into concise, decision-ready summaries with relationship, relevance, and impact." },
  { icon: Radar, title: "Company Intelligence Profile", description: "Build a living profile from public information so the system understands your business." },
  { icon: FileSearch, title: "Indirect Coverage Detector", description: "Detect competitor, regulatory, and industry stories that matter without explicit company mentions." },
  { icon: Sparkles, title: "Personalized Morning Intelligence", description: "Start every day with the stories, signals, and actions prioritized for your company." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Intelligence capabilities</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">From news collection to company intelligence</h2>
          <p className="mt-6 text-pretty leading-7 text-muted-foreground">Optimus combines semantic discovery, contextual validation, and smart extraction to surface the coverage that deserves your attention.</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent/40">
              <Icon aria-hidden="true" className="size-6 text-primary" />
              <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
