"use client";

import { useState } from "react";
import { Eye, Sparkles, User, Package, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const indirectStories = [
  {
    id: "ind-1",
    title: "North American Robotics Market Report: Next-Gen Autonomous Industrial Chips",
    signalType: "Executive Quote & Product Code-Name Signal",
    signalMatched: "Quote from 'Robert Smith' + Mention of 'Project Apex'",
    outlet: "EE Times Electronics",
    published: "1 hour ago",
    explicitMention: false,
    relevance: 95,
    summary: "Article discusses industrial AI hardware standards, quoting Acme's CTO Robert Smith and referencing Project Apex without explicitly tagging the Acme corporate entity.",
  },
  {
    id: "ind-2",
    title: "Semiconductor Foundry Lead Times and Zero-Trust Edge Hardware Compliance",
    signalType: "Supplier & Patent Technology Match",
    signalMatched: "Zero-Trust Edge Protocol Patent #9,420,110",
    outlet: "Robotics Business Review",
    published: "3 hours ago",
    explicitMention: false,
    relevance: 91,
    summary: "Deep analysis of industrial hardware security featuring Acme's proprietary edge protocol architecture.",
  },
];

export function IndirectCoverageDetectorView() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 11</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">Innovation 2 & Diff 11 </span>
          <span>•</span>
          <span className="text-foreground">Unbranded Signal Detection Engine</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Indirect Coverage Detector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detects coverage discussing executive quotes, product code-names, patents, or supply chain moves where your brand name is omitted.
        </p>
      </div>

      {/* Banner */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2 font-mono text-xs text-amber-600 dark:text-amber-400">
        <div className="font-bold flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" /> 312 Unbranded Stories Captured This Month
        </div>
        <p className="text-muted-foreground font-sans">
          Legacy platforms like CisionOne or Brandwatch miss these articles because they rely strictly on explicit company keyword matches.
        </p>
      </div>

      {/* Stories Grid */}
      <div className="space-y-4">
        {indirectStories.map((story) => (
          <div
            key={story.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-4 hover:border-foreground/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono text-xs font-bold w-fit">
                 {story.signalType}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{story.outlet} • {story.published}</span>
            </div>

            <h3 className="text-lg font-sans font-semibold text-foreground">{story.title}</h3>

            <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 font-mono text-xs space-y-1">
              <span className="text-muted-foreground uppercase text-[10px]">Unbranded Signal Trigger:</span>
              <p className="text-foreground font-bold">{story.signalMatched}</p>
            </div>

            <p className="text-sm font-sans text-muted-foreground">{story.summary}</p>

            <div className="pt-2 border-t border-foreground/10 flex justify-between items-center font-mono text-xs text-muted-foreground">
              <span>Explicit Brand Name Mentioned: <strong className="text-red-500">NO (Indirect Match)</strong></span>
              <span className="text-foreground font-bold">{story.relevance} / 100 Score</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
