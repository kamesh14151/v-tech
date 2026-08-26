"use client";

import { useState } from "react";
import { CheckCircle2, Shield, AlertTriangle, Info, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const contextExamples = [
  {
    id: "ctx-1",
    title: "Enterprise Robotics Sector Surges as Acme AI Unveils Autonomous Industrial Platform",
    snippet: "Acme Enterprise Robotics today announced the general availability of its next-generation Autonomous Industrial Platform, setting a new benchmark for smart manufacturing...",
    entity: "Acme Enterprise Robotics",
    contextType: "Primary Focal Subject 🎯",
    confidence: "99.8%",
    sentiment: "+0.92 Positive",
    description: "The article is exclusively centered on Acme's product launch, CEO statements, and market impact.",
    actionRecommended: "High Priority - Highlight in Executive Morning Briefing",
  },
  {
    id: "ctx-2",
    title: "Global Supply Chain Disruptions and Hardware Edge Chip Trends in 2026",
    snippet: "While legacy hardware manufacturers face delays, vendors like Acme Robotics and traditional competitors are adapting by embedding localized edge processing...",
    entity: "Acme Robotics",
    contextType: "Supporting Market Example 📊",
    confidence: "94.2%",
    sentiment: "+0.35 Neutral",
    description: "Brand mentioned as one of several market players in an industry overview story.",
    actionRecommended: "Standard Priority - Include in Daily Media Digest",
  },
  {
    id: "ctx-3",
    title: "Competitor Press Release: Legacy PR Monitoring Tools Update Quarterly Stats",
    snippet: "CisionOne and Brandwatch announced new feature updates today, noting that customers switching from old tools like Acme Corp or smaller PR databases prefer automated reporting...",
    entity: "Acme Corp",
    contextType: "Off-Hand Footnote / Passing Mention ⚠️",
    confidence: "91.5%",
    sentiment: "-0.24 Negative Context",
    description: "Brand is mentioned in passing within a competitor's press release comparison.",
    actionRecommended: "Low Priority - Filtered out of Primary PR Reports",
  },
];

export function ContextualValidationView() {
  const [selectedFilter, setSelectedFilter] = useState("All");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 7</span>
          <span>•</span>
          <span className="text-emerald-500 font-bold">Requirement 3 🎯</span>
          <span>•</span>
          <span className="text-foreground">Contextual Boundary Classifier</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Contextual Validation Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eliminates false alerts by evaluating whether entity mentions represent focal subject matter, supporting context, or irrelevant footnotes.
        </p>
      </div>

      {/* Accuracy Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl">
          <div className="text-xs font-mono text-muted-foreground">False Alert Reduction</div>
          <div className="text-2xl font-display font-semibold text-emerald-500 mt-1">98.6%</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">Eliminates passing reference noise</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl">
          <div className="text-xs font-mono text-muted-foreground">Boundary Precision</div>
          <div className="text-2xl font-display font-semibold text-foreground mt-1">99.4%</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">Sentence-level syntax parser</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl">
          <div className="text-xs font-mono text-muted-foreground">Competitor Contrast Detector</div>
          <div className="text-2xl font-display font-semibold text-foreground mt-1">Active</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">Flags competitor press release traps</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-foreground/10 pb-4 font-mono text-xs">
        <span className="text-muted-foreground">Filter Context Type:</span>
        {["All", "Primary Focal Subject", "Supporting Market Example", "Off-Hand Footnote"].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`px-3 py-1 rounded-full transition-colors ${
              selectedFilter === f
                ? "bg-foreground text-background font-bold"
                : "bg-foreground/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Validation Stream Cards */}
      <div className="space-y-4">
        {contextExamples.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-4 hover:border-foreground/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground font-mono text-xs font-bold w-fit">
                {item.contextType}
              </span>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-muted-foreground">AI Confidence: <strong className="text-foreground">{item.confidence}</strong></span>
                <span className="text-emerald-500 font-semibold">{item.sentiment}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-sans font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm font-sans text-muted-foreground mt-2 italic bg-muted/30 p-3 rounded-xl border border-foreground/5">
                &ldquo;{item.snippet}&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="text-muted-foreground">
                Validation Insight: <span className="text-foreground font-medium">{item.description}</span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {item.actionRecommended}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
