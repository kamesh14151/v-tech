"use client";

import { useState } from "react";
import { Layers, Users, Package, Shield, Share2, Sparkles, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompanyIntelligenceProfileView({ onNavigate }: { onNavigate: (mod: any) => void }) {
  const [activeTab, setActiveTab] = useState<"executives" | "products" | "aliases" | "competitors">("executives");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>Module 3</span>
            <span>•</span>
            <span className="text-amber-500 font-bold">Innovation 1</span>
            <span>•</span>
            <span className="text-foreground">Entity Knowledge Graph</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Company Intelligence Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dynamic enterprise entity mapping connecting executives, product aliases, supply partners, and competitor watchlists.
          </p>
        </div>

        <Button onClick={() => onNavigate("indirect")} variant="outline" className="rounded-full text-xs font-mono gap-2 border-foreground/20">
          <Sparkles className="w-4 h-4 text-amber-500" /> View Indirect Coverage
        </Button>
      </div>

      {/* Entity Card Header */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl relative overflow-hidden">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-background font-display font-bold text-2xl flex items-center justify-center">
              A
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold">Acme Enterprise Robotics</h2>
              <p className="text-xs font-mono text-muted-foreground">NASDAQ: ACME • Autonomous AI Infrastructure</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
                Entity Status: Active Sync
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-foreground/10 text-muted-foreground">
                98.4% Confidence
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-foreground/10 pt-4 md:pt-0 md:pl-8 font-mono text-xs">
            <div className="text-muted-foreground uppercase text-[10px] tracking-wider">Entity Stats</div>
            <div className="flex justify-between py-1 border-b border-foreground/5">
              <span className="text-muted-foreground">Tracked Executives:</span>
              <span className="font-bold text-foreground">5 C-Suite</span>
            </div>
            <div className="flex justify-between py-1 border-b border-foreground/5">
              <span className="text-muted-foreground">Flagship Products:</span>
              <span className="font-bold text-foreground">4 Active Lines</span>
            </div>
            <div className="flex justify-between py-1 border-b border-foreground/5">
              <span className="text-muted-foreground">Brand Aliases:</span>
              <span className="font-bold text-foreground">8 Monitored</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Competitor Benchmarks:</span>
              <span className="font-bold text-foreground">4 Platforms</span>
            </div>
          </div>

          <div className="space-y-3 border-t md:border-t-0 md:border-l border-foreground/10 pt-4 md:pt-0 md:pl-8">
            <div className="text-muted-foreground uppercase text-[10px] tracking-wider font-mono">Knowledge Graph Density</div>
            <div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span>Entity Graph Nodes</span>
                <span className="font-bold">142 Entities</span>
              </div>
              <div className="flex justify-between">
                <span>Vector Embeddings</span>
                <span className="font-bold">1,024 Dimensions</span>
              </div>
              <div className="text-[10px] text-muted-foreground pt-1 border-t border-foreground/10">
                Powers Requirement 1 (Semantic Discovery) & Requirement 3 (Contextual Validation)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-foreground/10 font-mono text-xs">
        {[
          { id: "executives", label: "C-Suite Executives", icon: Users },
          { id: "products", label: "Products & Code-Names", icon: Package },
          { id: "aliases", label: "Brand Aliases", icon: Shield },
          { id: "competitors", label: "Competitor Watchlist", icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-all ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === "executives" && [
          { name: "Jane Doe", role: "Chief Executive Officer (CEO)", mentions: "1,240 mentions", quotesTracked: 42, sentiment: "Positive (+0.82)" },
          { name: "Robert Smith", role: "Chief Technology Officer (CTO)", mentions: "890 mentions", quotesTracked: 28, sentiment: "Neutral (+0.54)" },
          { name: "Marcus Vance", role: "Chief Financial Officer (CFO)", mentions: "610 mentions", quotesTracked: 19, sentiment: "Positive (+0.71)" },
          { name: "Elena Rostova", role: "VP of Global Communications", mentions: "340 mentions", quotesTracked: 12, sentiment: "Positive (+0.88)" },
        ].map((exec, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base text-foreground">{exec.name}</h4>
                <p className="text-xs text-muted-foreground font-mono">{exec.role}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {exec.sentiment}
              </span>
            </div>
            <div className="pt-2 border-t border-foreground/10 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{exec.mentions}</span>
              <span>{exec.quotesTracked} quotes indexed</span>
            </div>
          </div>
        ))}

        {activeTab === "products" && [
          { name: "TitanX Industrial Bot", code: "Project Apex", status: "Active Launch", signal: "Unbranded Signal Monitored" },
          { name: "Autonomous OS v4.2", code: "CoreKernel", status: "GA Release", signal: "Indirect Mentions High" },
          { name: "CyberCore Edge Hub", code: "Project Vortex", status: "Beta", signal: "Patent & Tech Blog Tracked" },
        ].map((prod, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-base text-foreground">{prod.name}</h4>
                <p className="text-xs text-muted-foreground font-mono">Code-name: {prod.code}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-foreground/10 text-foreground">
                {prod.status}
              </span>
            </div>
            <div className="pt-2 border-t border-foreground/10 font-mono text-xs text-amber-600 dark:text-amber-400">
              ⚡ {prod.signal}
            </div>
          </div>
        ))}

        {activeTab === "aliases" && [
          { alias: "Acme Robotics Inc", type: "Legal Entity", confidence: "100%" },
          { alias: "AcmeAI", type: "Product Brand", confidence: "99.2%" },
          { alias: "Acme Autonomous", type: "Subsidiary", confidence: "96.4%" },
        ].map((item, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-2 font-mono text-xs">
            <div className="font-bold text-sm text-foreground">{item.alias}</div>
            <div className="flex justify-between text-muted-foreground">
              <span>Type: {item.type}</span>
              <span className="text-emerald-500 font-bold">{item.confidence} Match</span>
            </div>
          </div>
        ))}

        {activeTab === "competitors" && [
          { name: "CisionOne Target Competitor", platform: "Primary Competitor Benchmarked" },
          { name: "Brandwatch Social rival", platform: "Secondary Competitor" },
          { name: "Talkwalker Global Media rival", platform: "Secondary Competitor" },
          { name: "Muck Rack PR rival", platform: "PR & Journalist Competitor" },
        ].map((comp, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-2">
            <h4 className="font-semibold text-sm text-foreground">{comp.name}</h4>
            <p className="text-xs font-mono text-muted-foreground">{comp.platform}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
