"use client";

import { useState } from "react";
import { Gauge, TrendingUp, Sun, Sparkles, Building2, Layers, AlertCircle, ArrowRight, ShieldCheck, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExecutiveDashboardView({ onNavigate }: { onNavigate: (mod: any) => void }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState("CisionOne");

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Enterprise Media Intelligence Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time coverage analytics, competitor share of voice, business impact scores, and morning intelligence updates.
          </p>
        </div>

        <Button
          onClick={() => onNavigate("morning")}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-mono text-xs gap-2 px-6 shadow-md"
        >
          <Sun className="w-4 h-4 fill-current" /> Generate Morning Intelligence Briefing
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Articles Indexed", value: "2,840", change: "+14.2% this week", sub: "100% Paywall Extracted" },
          { label: "Share of Voice vs Competitors", value: "48.2%", change: "+6.8% vs CisionOne benchmark", sub: "Market Leader" },
          { label: "Business Impact Score", value: "94.8 / 100", change: "Est. Media Value: $1.82M", sub: "Financial Impact" },
          { label: "Indirect Coverage Found", value: "312 Stories", change: "Unbranded Signal Match", sub: "Executive & Code-name Signals" },
        ].map((stat, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-2">
            <div className="text-xs font-mono text-muted-foreground">{stat.label}</div>
            <div className="text-3xl font-display font-semibold text-foreground">{stat.value}</div>
            <div className="text-[11px] font-mono text-emerald-500 font-medium">{stat.change}</div>
            <div className="text-[10px] font-mono text-muted-foreground">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Competitor Benchmarking Panel */}
      <div className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-semibold text-lg text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-foreground" /> Share of Voice Benchmarking vs Competitors
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Live market intelligence comparison against legacy platforms
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {["CisionOne", "Brandwatch", "Talkwalker", "Muck Rack"].map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedCompetitor(comp)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  selectedCompetitor === comp
                    ? "bg-foreground text-background font-bold"
                    : "bg-foreground/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                vs {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Share of Voice Bar */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Optimus Enterprise SOV: <strong className="text-foreground">48.2%</strong></span>
            <span>{selectedCompetitor} Client SOV: <strong className="text-muted-foreground">24.5%</strong></span>
          </div>
          <div className="w-full h-4 rounded-full bg-foreground/10 flex overflow-hidden">
            <div className="h-full bg-foreground w-[48.2%]" />
            <div className="h-full bg-emerald-500 w-[24.5%]" />
            <div className="h-full bg-amber-500 w-[15.3%]" />
            <div className="h-full bg-muted-foreground/30 flex-1" />
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-foreground" /> Optimus PR (48.2%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {selectedCompetitor} Targets (24.5%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Other Competitors (15.3%)</span>
          </div>
        </div>
      </div>

      {/* Quick Access Modules Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Semantic Discovery", desc: "Vector search without exact keyword strings", mod: "semantic" },
          { title: "Indirect Coverage", desc: "Detect unbranded C-Suite & product stories", mod: "indirect" },
          { title: "Morning Intelligence", desc: "Generate personalized executive morning digest", mod: "morning" },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => onNavigate(item.mod as any)}
            className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 cursor-pointer transition-all space-y-2 group"
          >
            <h4 className="font-semibold text-base text-foreground group-hover:underline flex items-center justify-between">
              {item.title} <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-xs font-mono text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
