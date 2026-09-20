"use client";

import { useState } from "react";
import { Send, FileText, CheckCircle2, Mail, Users, Globe, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PressReleaseDistributionView() {
  const [releaseTitle, setReleaseTitle] = useState(
    "Acme Enterprise Robotics Unveils Autonomous Industrial Platform with Zero-Trust Security"
  );
  const [releaseBody, setReleaseBody] = useState(
    "SAN FRANCISCO — August 26, 2026 — Acme Enterprise Robotics today announced the general availability of its Autonomous Industrial Platform, reducing factory downtime by 40%..."
  );
  const [isDistributed, setIsDistributed] = useState(false);

  const handleDistribute = () => {
    setIsDistributed(true);
    setTimeout(() => setIsDistributed(false), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-foreground font-bold">CisionOne Core Feature</span>
            <span>•</span>
            <span className="text-foreground">Wire & Targeted Email Builder</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Press Release Builder & Distribution</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build media releases with smart templates, distribute globally across PR Newswire & 600,000+ verified journalists, and track open/click rates.
          </p>
        </div>

        <Button
          onClick={handleDistribute}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-mono text-xs gap-2 px-6 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" /> Distribute Press Release Now
        </Button>
      </div>

      {isDistributed && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs flex items-center justify-between font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Release Distributed via PR Newswire & 14,200 Targeted Journalists
          </span>
          <span>Live Tracking Active</span>
        </div>
      )}

      {/* Distribution Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Open Rate</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">68.4%</div>
          <div className="text-[10px] text-muted-foreground/80">9,712 Journalists Opened</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Click-Through Rate (CTR)</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">42.1%</div>
          <div className="text-[10px] text-muted-foreground/80">5,978 Asset Downloads</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Secured Pickups</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">142 Outlets</div>
          <div className="text-[10px] text-muted-foreground/80">Includes TechCrunch & WSJ</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Message Uptake Index</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">94.0%</div>
          <div className="text-[10px] text-muted-foreground/80">High Quote Fidelity</div>
        </div>
      </div>

      {/* Composer Card */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <FileText className="w-4 h-4 text-foreground" /> Press Release Editor & Wire Targeting
        </h3>

        <div className="space-y-4 font-sans text-xs">
          <div>
            <label className="block font-mono text-muted-foreground mb-1">Headline</label>
            <input
              type="text"
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-foreground/10 bg-background"
            />
          </div>

          <div>
            <label className="block font-mono text-muted-foreground mb-1">Release Body Text</label>
            <textarea
              rows={6}
              value={releaseBody}
              onChange={(e) => setReleaseBody(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-foreground/10 bg-background focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-foreground/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Target Wire: <strong className="text-foreground">PR Newswire Enterprise US & EU</strong></span>
              <span>•</span>
              <span>Contacts Selected: <strong className="text-foreground">14,200 Verified Journalists</strong></span>
            </div>

            <Button onClick={handleDistribute} className="bg-foreground text-background rounded-full px-6">
              Launch Distribution Wire <Send className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
