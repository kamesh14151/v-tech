"use client";

import { useState } from "react";
import { TrendingUp, MessageSquare, Newspaper, Share2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const coreNarratives = [
  {
    id: "nar-1",
    pillar: "Zero-Trust Edge Robotics Security",
    messageUptake: "88.4%",
    socialVolume: "14,200 posts",
    earnedArticles: "64 Tier 1 stories",
    trend: "Accelerating Across Tech Press",
    keyQuote: "Acme Autonomous OS v4 sets zero-trust standard for factory robotics.",
  },
  {
    id: "nar-2",
    pillar: "40% Factory Downtime Reduction ROI",
    messageUptake: "92.1%",
    socialVolume: "8,900 posts",
    earnedArticles: "42 Financial press stories",
    trend: "High Executive C-Suite Uptake",
    keyQuote: "TitanX Bot platform reduces industrial downtime by 40%.",
  },
  {
    id: "nar-3",
    pillar: "North American Manufacturing Reshoring",
    messageUptake: "76.5%",
    socialVolume: "6,400 posts",
    earnedArticles: "28 Trade stories",
    trend: "Steady Macro Trend Alignment",
    keyQuote: "Acme AI infrastructure powers North American smart factory reshoring.",
  },
];

export function NarrativeTrackingView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-amber-500 font-bold">CisionOne AI Feature</span>
            <span>•</span>
            <span className="text-foreground">Cross-Media Message Uptake Engine</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Narrative Tracking Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Synthesizes social media chatter and earned news articles into a unified view, showing how your core talking points drive public opinion.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
            Average Message Uptake: 85.6%
          </span>
        </div>
      </div>

      {/* Narrative Pillars Grid */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Monitored Core Talking Points & Uptake
        </h3>

        <div className="space-y-4">
          {coreNarratives.map((nar) => (
            <div
              key={nar.id}
              className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-sans font-semibold text-lg text-foreground">{nar.pillar}</h4>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-muted-foreground">Message Uptake:</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    {nar.messageUptake}
                  </span>
                </div>
              </div>

              {/* Message Uptake Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-foreground" style={{ width: nar.messageUptake }} />
              </div>

              <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 font-mono text-xs space-y-1">
                <span className="text-muted-foreground uppercase text-[10px]">Dominant Media Quote & Talking Point:</span>
                <p className="text-foreground italic font-sans text-sm">&ldquo;{nar.keyQuote}&rdquo;</p>
              </div>

              <div className="pt-2 border-t border-foreground/10 flex justify-between font-mono text-xs text-muted-foreground">
                <span>Social Chatter: <strong className="text-foreground">{nar.socialVolume}</strong></span>
                <span>Earned Media: <strong className="text-foreground">{nar.earnedArticles}</strong></span>
                <span className="text-emerald-500 font-bold">Trend: {nar.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
