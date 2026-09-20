"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, Sparkles, Sliders, ArrowRight, CheckCircle2, Search, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SynonymMatch {
  title: string;
  source: string;
  url: string;
  synonymMatched: string;
  similarity: number;
}

export function SemanticDiscoveryView({ query: propQuery = "" }: { query?: string }) {
  const [targetEntity, setTargetEntity] = useState(propQuery || "PayU");
  const [expandedContexts, setExpandedContexts] = useState<string[]>([]);
  const [matchedArticles, setMatchedArticles] = useState<SynonymMatch[]>([]);
  const [similarityThreshold, setSimilarityThreshold] = useState(85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscovery = useCallback(async (entityToSearch: string) => {
    if (!entityToSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/semantic-expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: entityToSearch.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Expansion failed");
      setExpandedContexts(data.expandedContexts || []);
      setMatchedArticles(data.matchedArticles || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = propQuery.trim() || "PayU";
    setTargetEntity(q);
    fetchDiscovery(q);
  }, [propQuery, fetchDiscovery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiscovery(targetEntity);
  };

  const filteredMatches = matchedArticles.filter(a => a.similarity >= similarityThreshold);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
            <Brain className="w-4 h-4 text-emerald-500" />
            <span>Core Capability 1</span>
            <span>•</span>
            <span className="text-foreground font-semibold">Intent-Aware Semantic Discovery</span>
          </div>
          <h1 className="text-2xl font-display tracking-tight">Semantic Concept & Synonym Discovery</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recovers 60% of coverage that rigid keyword searches miss — identifying live articles where journalists use synonyms or jargon instead of exact client names.
          </p>
        </div>

        <button
          onClick={() => fetchDiscovery(targetEntity)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSearch} className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Target Client / Entity / Topic for Live Contextual Expansion:</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={targetEntity}
            onChange={e => setTargetEntity(e.target.value)}
            placeholder="e.g. PayU, Apple M4, Reliance Retail, Zomato, Electric Vehicles..."
            className="flex-1 px-4 py-2.5 text-sm font-sans rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={loading || !targetEntity.trim()}
            className="px-6 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/85 transition-colors shrink-0 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Expand & Discover Live
          </button>
        </div>

        {/* Similarity Threshold Slider */}
        <div className="pt-3 border-t border-foreground/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3 flex-1">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Semantic Similarity Cutoff:</span>
            <input
              type="range"
              min="70"
              max="95"
              value={similarityThreshold}
              onChange={e => setSimilarityThreshold(Number(e.target.value))}
              className="w-36 accent-foreground"
            />
            <span className="font-bold text-foreground">{similarityThreshold}%</span>
          </div>
          <span className="text-muted-foreground text-[10px]">Cuts 85% noise by ignoring low-similarity matches</span>
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500 font-mono">
          {error}
        </div>
      )}

      {/* Expansion Nodes */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          Optimus AI Contextual Synonyms for "{targetEntity}"
        </div>
        {loading && expandedContexts.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl border border-foreground/10 bg-card animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {expandedContexts.map((synonym, i) => (
              <div key={i} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate text-foreground font-medium">{synonym}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Discovered Articles */}
      <div className="space-y-3 pt-3 border-t border-foreground/10">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono font-semibold text-foreground">
            Live Discovered Coverage (Articles found via semantic context without exact keyword)
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {filteredMatches.length} Live Articles Found
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl border border-foreground/10 bg-card animate-pulse" />)}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="space-y-2">
            {filteredMatches.map((article, i) => (
              <div key={i} className="p-4 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:underline flex items-start gap-1.5 line-clamp-2">
                      {article.title}
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
                    </a>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Discovered via: "<strong>{article.synonymMatched}</strong>"
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-foreground bg-foreground/5 px-2 py-1 rounded border border-foreground/10">
                      {article.similarity}% match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs font-mono text-muted-foreground border border-dashed border-foreground/10 rounded-xl">
            No articles found above {similarityThreshold}% cutoff. Try lowering the threshold or refining the entity query.
          </div>
        )}
      </div>
    </div>
  );
}
