"use client";

import { useState } from "react";
import { ShieldAlert, AlertOctagon, CheckCircle2, Shield, Sparkles, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const scannedCoverage = [
  {
    id: "risk-101",
    title: "Enterprise Robotics Sector Surges as Acme AI Unveils Platform",
    source: "TechCrunch Enterprise",
    threatType: "Safe / Clean Coverage",
    riskScore: "2.1 % (Minimal Risk)",
    hateSpeech: "0.0%",
    fakeNews: "0.0%",
    controversy: "0.0%",
    sarcasm: "0.0%",
    status: "Verified Brand Safe",
  },
  {
    id: "risk-102",
    title: "Viral Social Thread Speculating on Factory Automation Delay Rumors",
    source: "X (Twitter) & Industry Forums",
    threatType: "Internet Controversy & Misinformation Speculation",
    riskScore: "34.5 % (Moderate Monitor)",
    hateSpeech: "0.0%",
    fakeNews: "28.4%",
    controversy: "42.1%",
    sarcasm: "12.0%",
    status: "Auto-Mitigation Rule Triggered",
  },
  {
    id: "risk-103",
    title: "Competitor Blog Post: Sarcastic Review of Industrial OS Market",
    source: "TechBlog Wire",
    threatType: "Heavy Sarcasm / Opinion Piece",
    riskScore: "18.2 % (Low Risk)",
    hateSpeech: "0.0%",
    fakeNews: "0.0%",
    controversy: "14.2%",
    sarcasm: "84.0%",
    status: "Monitored",
  },
];

export function BrandRiskScoreView() {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("All");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-amber-500 font-bold">CisionOne Crisis AI Feature</span>
            <span>•</span>
            <span className="text-foreground">Brand Risk & Safety Scanner</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Brand Risk Score & Crisis Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scans incoming media coverage and social chatter for hate speech, fake news, internet controversy, heavy sarcasm, and reputational threats.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" /> Overall Risk: Low (4.2%)
          </span>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Reputational Threat Level</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">Low (4.2%)</div>
          <div className="text-[10px] text-muted-foreground/80">0 Critical Crisis Events</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Fake News / Rumor Scanner</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">99.8% Clean</div>
          <div className="text-[10px] text-muted-foreground/80">1 Misinformation Alert Monitored</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Hate Speech & Toxicity</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">0.0%</div>
          <div className="text-[10px] text-muted-foreground/80">Brand Safety Verified</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Sarcasm & Cynicism Detection</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">Filtered</div>
          <div className="text-[10px] text-muted-foreground/80">Natural Language Intent Model</div>
        </div>
      </div>

      {/* Scanned Coverage Feed */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-foreground" /> Scanned Articles & Safety Breakdown
        </h3>

        <div className="space-y-4">
          {scannedCoverage.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                <span className="font-bold text-foreground">{item.source} • {item.threatType}</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold border ${
                    item.status.includes("Safe")
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  Risk Score: {item.riskScore}
                </span>
              </div>

              <h4 className="text-lg font-sans font-semibold text-foreground">{item.title}</h4>

              {/* Threat Component Meter */}
              <div className="grid grid-cols-4 gap-3 font-mono text-xs pt-2 border-t border-foreground/10">
                <div className="p-3 rounded-xl bg-background/50 border border-foreground/10">
                  <div className="text-[10px] text-muted-foreground uppercase">Hate Speech</div>
                  <div className="font-bold text-foreground mt-0.5">{item.hateSpeech}</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-foreground/10">
                  <div className="text-[10px] text-muted-foreground uppercase">Fake News</div>
                  <div className="font-bold text-foreground mt-0.5">{item.fakeNews}</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-foreground/10">
                  <div className="text-[10px] text-muted-foreground uppercase">Controversy</div>
                  <div className="font-bold text-foreground mt-0.5">{item.controversy}</div>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-foreground/10">
                  <div className="text-[10px] text-muted-foreground uppercase">Sarcasm</div>
                  <div className="font-bold text-foreground mt-0.5">{item.sarcasm}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
