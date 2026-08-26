"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const competitorData = [
  {
    feature: "Semantic Discovery 🧠",
    optimus: "Vector-based implicit topic & concept discovery",
    cisionOne: "Basic keyword boolean & taxonomy",
    brandwatch: "Query keyword rules only",
    talkwalker: "Boolean search & topic tags",
    muckRack: "Media database query keywords",
    isHighlight: true,
  },
  {
    feature: "Indirect Coverage Detector 🔍",
    optimus: "AI detection of execs, products & unbranded signals",
    cisionOne: "No (Explicit brand keywords only)",
    brandwatch: "Limited topic tracking",
    talkwalker: "No",
    muckRack: "No",
    isHighlight: true,
  },
  {
    feature: "Personalized Morning Intelligence 🌅",
    optimus: "Automated executive synthesis + audio digest",
    cisionOne: "Static daily email clips",
    brandwatch: "Scheduled email digest",
    talkwalker: "Scheduled report PDF",
    muckRack: "Manual email pitch digest",
    isHighlight: true,
  },
  {
    feature: "Contextual Validation 🎯",
    optimus: "Sentence-level focal vs off-hand mention parsing",
    cisionOne: "Basic document sentiment",
    brandwatch: "Document sentiment only",
    talkwalker: "Global sentiment",
    muckRack: "Basic sentiment rating",
    isHighlight: true,
  },
  {
    feature: "Explainable Relevance Scoring 📊",
    optimus: "Transparent 0-100 weight formula breakdown",
    cisionOne: "Opaque relevance tier",
    brandwatch: "Black-box reach index",
    talkwalker: "Basic engagement score",
    muckRack: "Basic rank score",
    isHighlight: false,
  },
  {
    feature: "Coverage Gap Detector 🎯",
    optimus: "Automated competitor story omission alerts",
    cisionOne: "Manual share of voice reports",
    brandwatch: "Share of voice charts",
    talkwalker: "Volume comparison graphs",
    muckRack: "Journalist coverage search",
    isHighlight: true,
  },
  {
    feature: "Business Impact Score 💰",
    optimus: "EMV + Sentiment Risk + Stock correlation",
    cisionOne: "Estimated reach only",
    brandwatch: "Social impression metric",
    talkwalker: "Potential reach metric",
    muckRack: "Publication domain rank",
    isHighlight: false,
  },
  {
    feature: "Configurable Rule Engine ⚙️",
    optimus: "Real-time proximity, sentiment & multi-action rules",
    cisionOne: "Static notification alerts",
    brandwatch: "Alert rules",
    talkwalker: "Alert rules",
    muckRack: "Basic email alerts",
    isHighlight: false,
  },
  {
    feature: "Smart Paywall Extraction 📰",
    optimus: "High-speed multi-pass clean text extraction",
    cisionOne: "Snippet-only for paywalled sources",
    brandwatch: "Metadata only",
    talkwalker: "Metadata only",
    muckRack: "Manual article links",
    isHighlight: false,
  },
];

export function CompetitorMatrixSection({ onOpenWorkspace }: { onOpenWorkspace?: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="competitors" className="relative py-24 lg:py-32 border-t border-foreground/10 bg-background/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground mb-4 px-3 py-1 rounded-full border border-foreground/10 bg-foreground/5">
            <Sparkles className="w-4 h-4 text-foreground" />
            Competitive Benchmarking
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Built to Outperform Legacy PR Tools
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            See how Optimus compares against legacy PR monitoring platforms including CisionOne, Brandwatch, Talkwalker, and Muck Rack.
          </p>
        </div>

        {/* Matrix Table */}
        <div
          className={`overflow-x-auto rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl shadow-xl transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-foreground/10 bg-muted/40">
                <th className="py-5 px-6 font-mono text-xs text-muted-foreground uppercase tracking-wider w-1/4">
                  Feature / Capability
                </th>
                <th className="py-5 px-6 font-display text-lg text-foreground bg-foreground/5 border-x border-foreground/10 w-1/4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 fill-foreground text-foreground" />
                    <span>Optimus PR</span>
                  </div>
                </th>
                <th className="py-5 px-4 font-mono text-xs text-muted-foreground">CisionOne</th>
                <th className="py-5 px-4 font-mono text-xs text-muted-foreground">Brandwatch</th>
                <th className="py-5 px-4 font-mono text-xs text-muted-foreground">Talkwalker</th>
                <th className="py-5 px-4 font-mono text-xs text-muted-foreground">Muck Rack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5 font-mono text-xs">
              {competitorData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-foreground/[0.02] transition-colors ${
                    row.isHighlight ? "bg-foreground/[0.01]" : ""
                  }`}
                >
                  <td className="py-4 px-6 font-sans text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {row.feature}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-sans text-sm text-foreground font-semibold bg-foreground/5 border-x border-foreground/10">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{row.optimus}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground font-sans text-xs">{row.cisionOne}</td>
                  <td className="py-4 px-4 text-muted-foreground font-sans text-xs">{row.brandwatch}</td>
                  <td className="py-4 px-4 text-muted-foreground font-sans text-xs">{row.talkwalker}</td>
                  <td className="py-4 px-4 text-muted-foreground font-sans text-xs">{row.muckRack}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA Footer */}
        <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={onOpenWorkspace}
            className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full group"
          >
            Launch Interactive Platform Demo
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
