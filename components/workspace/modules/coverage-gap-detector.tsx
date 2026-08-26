"use client";

import { useState } from "react";
import { Zap, AlertTriangle, Users, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const gapItems = [
  {
    id: "gap-1",
    title: "Enterprise AI Infrastructure Overview 2026",
    competitorCovered: "CisionOne Target Competitor A",
    outlet: "VentureBeat AI",
    journalist: "Alex Rivera",
    gapReason: "Acme Enterprise Robotics omitted from roundup story despite equal market share.",
    action: "Generate Targeted Pitch & Journalist Outreach",
  },
  {
    id: "gap-2",
    title: "Industrial Robotics Market Vendor Ranking Q3",
    competitorCovered: "Brandwatch Monitored Competitor B",
    outlet: "Forbes Tech",
    journalist: "David Vance",
    gapReason: "Story focused solely on competitor funding announcement.",
    action: "Send Acme TitanX Launch Press Briefing",
  },
];

export function CoverageGapDetectorView() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 15</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">Differentiator 15 </span>
          <span>•</span>
          <span className="text-foreground">Competitor Story Omission Detector</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Coverage Gap Detector</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Identifies key stories and media outlets covering competitor wins (CisionOne, Brandwatch, Talkwalker, Muck Rack targets) where your brand was omitted.
        </p>
      </div>

      {/* Gap List */}
      <div className="space-y-4">
        {gapItems.map((g) => (
          <div
            key={g.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-4 hover:border-foreground/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 font-bold w-fit flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Coverage Gap Detected
              </span>
              <span className="text-muted-foreground">{g.outlet} • Journalist: <strong className="text-foreground">{g.journalist}</strong></span>
            </div>

            <h3 className="text-lg font-sans font-semibold text-foreground">{g.title}</h3>

            <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 font-mono text-xs space-y-1">
              <span className="text-muted-foreground uppercase text-[10px]">Competitor Featured:</span>
              <p className="text-foreground font-bold">{g.competitorCovered}</p>
              <p className="text-muted-foreground font-sans mt-1">{g.gapReason}</p>
            </div>

            <div className="pt-2 border-t border-foreground/10 flex justify-end font-mono text-xs">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full gap-2">
                {g.action} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
