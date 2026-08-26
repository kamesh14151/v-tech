"use client";

import { useState } from "react";
import { Newspaper, Rss, Globe, Radio, ShieldCheck, Zap, RefreshCw, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const liveArticles = [
  {
    id: "art-101",
    title: "Enterprise Robotics Sector Surges as Acme AI Unveils Autonomous Industrial Platform",
    source: "TechCrunch Enterprise",
    time: "2 mins ago",
    type: "Web News",
    tier: "Tier 1 Press",
    domainAuth: 94,
    sentiment: "+0.84 Positive",
    relevance: 98,
  },
  {
    id: "art-102",
    title: "AI Supply Chain Analysis: How Next-Gen Sensors Are Disrupting Factory Automation",
    source: "Bloomberg Technology",
    time: "8 mins ago",
    type: "RSS Wire",
    tier: "Tier 1 Financial",
    domainAuth: 96,
    sentiment: "+0.45 Neutral",
    relevance: 92,
    indirect: true,
  },
  {
    id: "art-103",
    title: "Executive Q&A: CEO Jane Doe Speaks on Enterprise Security and Autonomous OS",
    source: "Wall Street Journal",
    time: "15 mins ago",
    type: "Web News",
    tier: "Tier 1 Press",
    domainAuth: 98,
    sentiment: "+0.91 Positive",
    relevance: 99,
  },
  {
    id: "art-104",
    title: "Competitor Market Share Shift: CisionOne vs Optimus Enterprise Benchmarking",
    source: "PR Week Intelligence",
    time: "32 mins ago",
    type: "Industry Blog",
    tier: "Tier 2 Trade",
    domainAuth: 82,
    sentiment: "+0.72 Positive",
    relevance: 89,
  },
];

export function NewsCollectionView({ onNavigate }: { onNavigate: (mod: any) => void }) {
  const [filterType, setFilterType] = useState<string>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>Module 4</span>
            <span>•</span>
            <span className="text-foreground">Global Media Ingestion Stream</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">News Collection Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-source ingestion engine collecting global news, RSS wires, broadcast transcripts, and trade blogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="rounded-full text-xs font-mono gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Pipeline
          </Button>

          <Button onClick={() => onNavigate("extraction")} className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-mono gap-2">
            Open Article Extractor <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Ingestion Stream Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ingestion Throughput", value: "14,280 / hr", sub: "Global Crawlers Active" },
          { label: "Paywall Bypass Rate", value: "99.4%", sub: "Clean Full Text Extraction" },
          { label: "Domain Authority Avg", value: "88.6 DA", sub: "Tier 1 Media Prioritized" },
          { label: "Latency", value: "1.2 seconds", sub: "Publishing to Ingestion" },
        ].map((m, i) => (
          <div key={i} className="p-5 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl">
            <div className="text-xs font-mono text-muted-foreground">{m.label}</div>
            <div className="text-2xl font-display font-semibold mt-1 text-foreground">{m.value}</div>
            <div className="text-[10px] font-mono text-muted-foreground/80 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Filter Sources:</span>
          {["All", "Web News", "RSS Wire", "Industry Blog", "Tier 1 Press"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-[11px] transition-colors ${
                filterType === type
                  ? "bg-foreground text-background font-bold"
                  : "bg-foreground/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="text-muted-foreground text-[11px]">
          Showing <span className="font-bold text-foreground">{liveArticles.length}</span> live items
        </div>
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        {liveArticles.map((art) => (
          <div
            key={art.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-bold text-foreground">{art.source}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{art.time}</span>
                <span className="px-2 py-0.5 rounded bg-foreground/10 text-muted-foreground text-[10px]">
                  {art.type}
                </span>
                {art.indirect && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold">
                    ⚡ Indirect Coverage
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-emerald-500 font-medium">{art.sentiment}</span>
                <span className="px-2.5 py-1 rounded-full bg-foreground text-background font-bold text-[11px]">
                  {art.relevance} / 100 Score
                </span>
              </div>
            </div>

            <h3 className="text-lg font-sans font-semibold text-foreground hover:underline cursor-pointer">
              {art.title}
            </h3>

            <div className="flex items-center justify-between pt-2 border-t border-foreground/10 text-xs font-mono text-muted-foreground">
              <span>Domain Authority: <strong className="text-foreground">{art.domainAuth} DA</strong> ({art.tier})</span>
              <button onClick={() => onNavigate("extraction")} className="text-foreground font-semibold hover:underline flex items-center gap-1">
                Inspect Extraction & Metadata →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
