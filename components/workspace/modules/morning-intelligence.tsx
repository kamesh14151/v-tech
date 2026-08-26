"use client";

import { useState } from "react";
import { Sun, Play, Pause, Volume2, Download, Mail, Sparkles, CheckCircle2, FileText, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MorningIntelligenceView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(14);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  const handleSendDigest = () => {
    setDeliverySuccess(true);
    setTimeout(() => setDeliverySuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Personalized Morning Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automated daily executive briefing synthesizing overnight media coverage, C-Suite quotes, competitor moves, and PR risk alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSendDigest} className="rounded-full text-xs font-mono gap-2 border-foreground/20">
            <Mail className="w-3.5 h-3.5" /> Email Digest to C-Suite
          </Button>

          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-mono gap-2">
            <Download className="w-3.5 h-3.5" /> Export PDF Report
          </Button>
        </div>
      </div>

      {deliverySuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Executive Morning Briefing emailed to 5 C-Suite Officers
          </span>
          <span>Delivered 7:00 AM EST</span>
        </div>
      )}

      {/* Audio Narration Bar Simulation */}
      <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-background backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-md"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="font-sans font-semibold text-base text-foreground flex items-center gap-2">
              <span>90-Second Audio Executive Briefing</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                AI Voice Synthesized
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Wednesday, August 26, 2026 • Read by Optimus Intelligence Voice
            </p>
          </div>
        </div>

        {/* Audio Progress */}
        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground w-full sm:w-64">
          <span>0:{playbackTime < 10 ? `0${playbackTime}` : playbackTime}</span>
          <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${(playbackTime / 90) * 100}%` }} />
          </div>
          <span>1:30</span>
        </div>
      </div>

      {/* Main Morning Intelligence Digest Document */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-card space-y-8">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-foreground/10 pb-6">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Daily Executive Digest • Confidential
            </div>
            <h2 className="text-2xl font-display font-semibold text-foreground mt-1">
              Acme Enterprise Morning Intelligence Briefing
            </h2>
            <div className="text-xs font-mono text-muted-foreground mt-1">
              Prepared for: Jane Doe (CEO) • Period: Last 24 Hours
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
              Sentiment Index: +0.86 Positive
            </span>
          </div>
        </div>

        {/* Executive Summary Bullet Points */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Executive Summary & Key Highlights
          </h3>

          <div className="space-y-3 font-sans text-sm">
            <div className="p-4 rounded-xl border border-foreground/10 bg-background/50 space-y-1">
              <span className="font-bold text-foreground font-mono text-xs text-emerald-500">1. Major Product Launch Coverage</span>
              <p className="text-muted-foreground leading-relaxed">
                TechCrunch and Wall Street Journal published lead stories on Acme&apos;s Autonomous Industrial Platform launch. TechCrunch praised the zero-trust architecture, noting a potential 40% reduction in factory downtime.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-foreground/10 bg-background/50 space-y-1">
              <span className="font-bold text-foreground font-mono text-xs text-amber-500">2. Executive Quote Impact</span>
              <p className="text-muted-foreground leading-relaxed">
                CEO Jane Doe and CTO Robert Smith were quoted across 42 publications, driving a 98/100 relevance score across Tier 1 financial press.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-foreground/10 bg-background/50 space-y-1">
              <span className="font-bold text-foreground font-mono text-xs text-foreground">3. Competitor Benchmarking (CisionOne / Brandwatch)</span>
              <p className="text-muted-foreground leading-relaxed">
                Acme achieved 48.2% Share of Voice over the last 24h, outperforming primary rival CisionOne target clients (24.5%) and Brandwatch tracked accounts (15.3%).
              </p>
            </div>
          </div>
        </div>

        {/* Top 3 Actionable Alerts */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Top 3 Actionable Press Alerts
          </h3>

          <div className="grid md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">✓ Tier 1 Feature Story</div>
              <div className="font-sans font-semibold text-foreground">TechCrunch Enterprise</div>
              <p className="text-[11px] text-muted-foreground">Highest reach story of the month. 98/100 score.</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="font-bold text-amber-600 dark:text-amber-400">⚡ Indirect Coverage Found</div>
              <div className="font-sans font-semibold text-foreground">EE Times Hardware</div>
              <p className="text-[11px] text-muted-foreground">Unbranded mention of Project Apex detected.</p>
            </div>

            <div className="p-4 rounded-xl border border-foreground/10 bg-background/50 space-y-2">
              <div className="font-bold text-foreground">🎯 Competitor Gap Alert</div>
              <div className="font-sans font-semibold text-foreground">VentureBeat AI</div>
              <p className="text-[11px] text-muted-foreground">Journalist Alex Rivera covered competitor; pitch ready.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
