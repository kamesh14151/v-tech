"use client";

import { useState } from "react";
import { Sparkles, Search, CheckCircle2, TrendingUp, Cpu, Globe, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const aiEngines = [
  {
    name: "ChatGPT Plus (GPT-4o)",
    shareOfVoice: "52.4%",
    sentiment: "+0.88 Positive Advocate",
    topCitation: "Acme Enterprise Robotics leads zero-trust factory automation.",
    recommendationRate: "94.2%",
    status: "Active Sync",
  },
  {
    name: "OpenAI SearchGPT",
    shareOfVoice: "48.6%",
    sentiment: "+0.91 Positive",
    topCitation: "Acme Autonomous OS v4 highlighted as premier industrial AI kernel.",
    recommendationRate: "91.8%",
    status: "Active Sync",
  },
  {
    name: "Google Gemini 1.5 Pro",
    shareOfVoice: "46.2%",
    sentiment: "+0.79 Positive",
    topCitation: "Acme TitanX Bot cited as top benchmark for aerospace manufacturing.",
    recommendationRate: "88.4%",
    status: "Active Sync",
  },
  {
    name: "Perplexity AI",
    shareOfVoice: "54.1%",
    sentiment: "+0.94 Positive Advocate",
    topCitation: "Acme cited in 8 out of 10 industrial AI research queries.",
    recommendationRate: "96.0%",
    status: "Active Sync",
  },
  {
    name: "Anthropic Claude 3.5 Sonnet",
    shareOfVoice: "50.8%",
    sentiment: "+0.85 Positive",
    topCitation: "Acme CEO Jane Doe quoted on AI safety and edge security standards.",
    recommendationRate: "92.5%",
    status: "Active Sync",
  },
];

export function AiVisibilityDashboardView() {
  const [queryTerm, setQueryTerm] = useState("Best enterprise autonomous robotics platform for manufacturing");
  const [isSearching, setIsSearching] = useState(false);

  const handleSimulateQuery = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 900);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-amber-500 font-bold">CisionOne AI Feature</span>
            <span>•</span>
            <span className="text-foreground">Trajaan Search Intelligence Engine</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">AI Visibility Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tracks how your brand is represented, cited, and recommended across major consumer-facing AI models and AI search engines.
          </p>
        </div>

        <Button
          onClick={handleSimulateQuery}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-mono text-xs gap-2 px-6 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} /> Run Live AI Audit Query
        </Button>
      </div>

      {/* AI Query Inspector */}
      <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" /> Monitored AI Consumer Prompt Query:
          </span>
          <span className="text-emerald-500 font-bold">✓ 5 AI Search Models Audited</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={queryTerm}
            onChange={(e) => setQueryTerm(e.target.value)}
            className="flex-1 px-4 py-3 text-sm font-sans rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground"
          />
          <Button onClick={handleSimulateQuery} className="bg-foreground text-background rounded-xl font-mono text-xs px-6">
            Audit Prompt
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Avg AI Recommendation Rate</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">92.6%</div>
          <div className="text-[10px] text-muted-foreground/80">Ranked #1 in 4 of 5 AI Engines</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">AI Share of Voice</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">50.4%</div>
          <div className="text-[10px] text-muted-foreground/80">+12.4% over nearest competitor</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Citation Accuracy Score</div>
          <div className="text-3xl font-display font-semibold text-foreground mt-1">98.9%</div>
          <div className="text-[10px] text-muted-foreground/80">0 Hallucinated Specs Found</div>
        </div>
        <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-1">
          <div className="text-muted-foreground">Brand Advocate Intent</div>
          <div className="text-3xl font-display font-semibold text-emerald-500 mt-1">Strong (+0.87)</div>
          <div className="text-[10px] text-muted-foreground/80">Stance AI Classifier</div>
        </div>
      </div>

      {/* Engine Comparison Grid */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Individual AI Search Engine Audit Results
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {aiEngines.map((engine, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-sans font-semibold text-lg text-foreground">{engine.name}</h4>
                  <span className="text-xs font-mono text-emerald-500 font-bold">{engine.status}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-foreground/10 text-foreground font-mono text-xs font-bold">
                  {engine.shareOfVoice} SOV
                </span>
              </div>

              <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 space-y-1 font-mono text-xs">
                <span className="text-muted-foreground uppercase text-[10px]">Top AI Generated Citation:</span>
                <p className="text-foreground italic font-sans text-sm">&ldquo;{engine.topCitation}&rdquo;</p>
              </div>

              <div className="pt-2 border-t border-foreground/10 flex justify-between items-center font-mono text-xs text-muted-foreground">
                <span>Recommendation Rate: <strong className="text-foreground">{engine.recommendationRate}</strong></span>
                <span className="text-emerald-500 font-semibold">{engine.sentiment}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
