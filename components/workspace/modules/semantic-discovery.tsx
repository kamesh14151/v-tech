"use client";

import { useState } from "react";
import { Brain, Sliders, Sparkles, Network, Search, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const semanticClusters = [
  { id: "c1", title: "Industrial Robotics Automation", count: 84, similarity: 96.4, topics: ["TitanX", "Factory OS", "Zero-Trust IoT"] },
  { id: "c2", title: "Executive Leadership & C-Suite Shifts", count: 42, similarity: 91.8, topics: ["Jane Doe Interview", "CTO Speech", "Q3 Earnings"] },
  { id: "c3", title: "Supply Chain Sensor Disruptions", count: 29, similarity: 88.2, topics: ["Semiconductor Lead Times", "Edge Chips", "Fab Automation"] },
  { id: "c4", title: "Competitor Market Share Shifts", count: 18, similarity: 84.5, topics: ["CisionOne vs Optimus", "Brandwatch Sentiment Benchmark"] },
];

export function SemanticDiscoveryView() {
  const [similarityThreshold, setSimilarityThreshold] = useState(80);
  const [searchConcept, setSearchConcept] = useState("Factory Edge AI Security & Executive Announcements");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 6</span>
          <span>•</span>
          <span className="text-emerald-500 font-bold">Requirement 1 🧠</span>
          <span>•</span>
          <span className="text-foreground">Vector Semantic Search Engine</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Semantic Discovery Workbench</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vector-based concept discovery that surfaces relevant coverage without relying on exact string boolean keywords.
        </p>
      </div>

      {/* Vector Concept Bar */}
      <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Brain className="w-4 h-4 text-emerald-500" />
          <span>Enter High-Dimensional Concept or Vector Topic Query:</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={searchConcept}
            onChange={(e) => setSearchConcept(e.target.value)}
            className="flex-1 px-4 py-3 text-sm font-sans rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground"
          />
          <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-xl px-6 font-mono text-xs gap-2">
            <Sparkles className="w-4 h-4" /> Discover Clusters
          </Button>
        </div>

        {/* Similarity Threshold Slider */}
        <div className="pt-4 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-4 flex-1">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground shrink-0">Vector Similarity Cutoff:</span>
            <input
              type="range"
              min="50"
              max="99"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full accent-foreground cursor-pointer"
            />
            <span className="font-bold text-foreground shrink-0">{similarityThreshold}% Cosine Distance</span>
          </div>

          <div className="text-emerald-500 font-semibold">
            ✓ 173 Implicit Articles Discovered
          </div>
        </div>
      </div>

      {/* Semantic Clusters Grid */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
          <Network className="w-4 h-4 text-foreground" /> Latent Concept Clusters (Discovered Vector Subspaces)
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {semanticClusters
            .filter((c) => c.similarity >= similarityThreshold)
            .map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-sans font-semibold text-lg text-foreground">{c.title}</h4>
                    <span className="text-xs font-mono text-muted-foreground">{c.count} Articles Grouped</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono text-xs font-bold">
                    {c.similarity}% Match
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 font-mono text-xs">
                  {c.topics.map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-foreground/5 border border-foreground/10 text-foreground">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-foreground/10 flex justify-between items-center text-xs font-mono text-muted-foreground">
                  <span>Vector Embedding Space: Ada-3</span>
                  <button className="text-foreground font-semibold hover:underline flex items-center gap-1">
                    View Articles →
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
