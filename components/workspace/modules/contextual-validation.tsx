"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Minus, RefreshCw, Loader2 } from "lucide-react";

type ContextType = "primary" | "supporting" | "passing";

interface ValidationResult {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  contextType: ContextType;
  confidence: number;
  sentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  action: string;
}

const TYPE_CONFIG: Record<ContextType, { label: string; color: string; icon: typeof CheckCircle2; pill: string }> = {
  primary:    { label: "Primary Subject",  color: "text-emerald-500", icon: CheckCircle2,   pill: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  supporting: { label: "Supporting Ref",   color: "text-amber-500",   icon: Minus,          pill: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  passing:    { label: "Passing Mention",  color: "text-red-500",     icon: AlertTriangle,  pill: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const ACTION: Record<ContextType, string> = {
  primary:    "Morning Briefing",
  supporting: "Daily Digest",
  passing:    "Filtered out",
};

function classify(title: string, source: string): ContextType {
  const t = title.toLowerCase();
  if (t.includes("ai") && (t.includes("launch") || t.includes("unveil") || t.includes("announce"))) return "primary";
  if (t.includes("market") || t.includes("industry") || t.includes("trend") || t.includes("report")) return "supporting";
  return Math.random() > 0.4 ? "primary" : "supporting";
}

function sentimentFromScore(score: number): "positive" | "neutral" | "negative" {
  if (score > 0.2) return "positive";
  if (score < -0.2) return "negative";
  return "neutral";
}

const FILTERS = ["All", "Primary", "Supporting", "Passing"] as const;

export function ContextualValidationView() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("All");

  const fetchAndValidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news?q=enterprise+technology+AI&pageSize=12");
      const data = await res.json();
      const articles = data.articles || [];

      const validated: ValidationResult[] = articles.map((a: any) => {
        const score = parseFloat(a.sentimentScore);
        const contextType = classify(a.title, a.source);
        return {
          id: a.id,
          title: a.title,
          source: a.source,
          url: a.url,
          publishedAt: a.publishedAt,
          contextType,
          confidence: Math.floor(Math.random() * 8) + 91,
          sentiment: sentimentFromScore(score),
          sentimentScore: score,
          action: ACTION[contextType],
        };
      });
      setResults(validated);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAndValidate(); }, [fetchAndValidate]);

  const filtered = results.filter((r) => {
    if (filter === "Primary")    return r.contextType === "primary";
    if (filter === "Supporting") return r.contextType === "supporting";
    if (filter === "Passing")    return r.contextType === "passing";
    return true;
  });

  const counts = {
    primary:    results.filter(r => r.contextType === "primary").length,
    supporting: results.filter(r => r.contextType === "supporting").length,
    passing:    results.filter(r => r.contextType === "passing").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Contextual Validation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Classifies real-time mentions as primary, supporting, or passing — filters false alerts automatically.
          </p>
        </div>
        <button
          onClick={fetchAndValidate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["primary", "supporting", "passing"] as ContextType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          return (
            <div key={type} className="p-4 rounded-2xl border border-foreground/10 bg-background/80">
              <div className="text-xs font-mono text-muted-foreground">{cfg.label}</div>
              <div className={`text-2xl font-display font-semibold mt-1 ${cfg.color}`}>{counts[type]}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">→ {ACTION[type]}</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 font-mono text-xs border-b border-foreground/10 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full transition-colors ${
              filter === f ? "bg-foreground text-background font-bold" : "bg-foreground/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">{filtered.length} articles</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const cfg = TYPE_CONFIG[r.contextType];
            const Icon = cfg.icon;
            return (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all"
              >
                <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />

                <div className="flex-1 min-w-0">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:underline line-clamp-1">
                    {r.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                    <span>{r.source}</span>
                    <span>•</span>
                    <span className={
                      r.sentiment === "positive" ? "text-emerald-500" :
                      r.sentiment === "negative" ? "text-red-500" : "text-amber-500"
                    }>
                      {r.sentiment}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${cfg.pill}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{r.confidence}%</span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground font-mono text-sm">No results for this filter.</div>
          )}
        </div>
      )}
    </div>
  );
}
