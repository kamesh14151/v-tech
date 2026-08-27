"use client";

import { useState } from "react";
import { TrendingUp, HelpCircle, CheckCircle2, Sparkles, Sliders, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RelevanceScoringView() {
  const [sampleScore, setSampleScore] = useState(98);

  const breakdownFactors = [
    { factor: "Headline Entity Position", points: 30, max: 30, desc: "Brand appears directly in the article headline" },
    { factor: "Domain Authority Tier", points: 25, max: 25, desc: "TechCrunch (94 DA) classified as Tier 1 Press" },
    { factor: "Executive Quote Attribution", points: 20, max: 20, desc: "CEO Jane Doe & CTO Robert Smith quoted directly" },
    { factor: "Contextual Relevance Weight", points: 15, max: 15, desc: "Focal Subject validation confirmed" },
    { factor: "Sentiment Intensity Multiplier", points: 8, max: 10, desc: "Positive score +0.84 applied" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 9</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">Differentiator 12 </span>
          <span>•</span>
          <span className="text-foreground">Transparent Priority & Relevance Model</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Explainable Relevance & Priority Scoring</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eliminates opaque black-box AI scores by providing a granular, verifiable mathematical breakdown for every article.
        </p>
      </div>

      {/* Main Score Card */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Overall Relevance Score</span>
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-display font-bold text-foreground">{sampleScore}</span>
            <span className="text-xl font-mono text-muted-foreground">/ 100 Points</span>
          </div>
          <p className="text-xs font-mono text-emerald-500 font-semibold">
             Priority Level: Executive Briefing Threshold Met (&gt;90 Points)
          </p>
        </div>

        <div className="w-full md:w-auto p-4 rounded-xl border border-foreground/10 bg-foreground/5 font-mono text-xs space-y-2">
          <div className="font-bold text-foreground">Scoring Formula Audit Trail:</div>
          <div className="text-muted-foreground">Score = Headline(30) + DA(25) + ExecQuote(20) + Context(15) + Sentiment(8)</div>
          <div className="text-[10px] text-muted-foreground/80 pt-1 border-t border-foreground/10">
            Compared to CisionOne black-box rank: 100% transparent and reproducible.
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <Sliders className="w-4 h-4 text-foreground" /> Mathematical Weighting Breakdown
        </h3>

        <div className="space-y-3">
          {breakdownFactors.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-3">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="font-bold text-foreground">{f.factor}</span>
                <span className="text-foreground font-bold">
                  +{f.points} / {f.max} pts
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all duration-500"
                  style={{ width: `${(f.points / f.max) * 100}%` }}
                />
              </div>

              <p className="text-xs font-sans text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
