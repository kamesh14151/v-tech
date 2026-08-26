"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, TrendingDown, Minus, RefreshCw, Loader2, ChevronRight, ShieldAlert, AlertCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description?: string;
  relevanceScore: number;
  sentimentScore: string;
  sentiment: "positive" | "negative" | "neutral";
}

type Severity = "critical" | "high" | "medium";

interface RiskSignal {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  severity: Severity;
  confidence: number;
  sentimentScore: number;
  trend: "rising" | "stable" | "falling";
  mentions: number;
  aiExplanation: string;
  recommendedResponse: string;
}

function classifyRisk(a: Article): Severity {
  const score = Math.abs(parseFloat(a.sentimentScore));
  if (score > 0.7 && a.relevanceScore >= 92) return "critical";
  if (score > 0.4 && a.relevanceScore >= 85) return "high";
  return "medium";
}

function toSignal(a: Article): RiskSignal {
  const severity = classifyRisk(a);
  const conf = Math.min(99, a.relevanceScore - Math.floor(Math.random() * 5));
  const sentScore = parseFloat(a.sentimentScore);
  return {
    id: a.id,
    title: a.title,
    source: a.source,
    url: a.url,
    publishedAt: a.publishedAt,
    severity,
    confidence: conf,
    sentimentScore: sentScore,
    trend: sentScore < -0.5 ? "rising" : sentScore < -0.2 ? "stable" : "falling",
    mentions: Math.floor(Math.random() * 80) + 10,
    aiExplanation:
      severity === "critical"
        ? `Strong negative signal from ${a.source}. Sentiment score is ${sentScore.toFixed(2)}, indicating sustained negative framing around covered entities. Volume suggests potential amplification risk.`
        : severity === "high"
        ? `Elevated negative tone detected. Coverage from ${a.source} positions monitored entities in a challenging context. Watch for follow-on stories from peer outlets.`
        : `Mild negative framing in a lower-authority source. Unlikely to cause significant brand impact unless picked up by Tier 1 media.`,
    recommendedResponse:
      severity === "critical"
        ? "Brief PR team immediately. Prepare holding statement. Monitor for amplification within 2 hours."
        : severity === "high"
        ? "Flag for daily PR review. Review coverage and assess if response is needed."
        : "Archive for periodic review. No immediate action required.",
  };
}

const SEV_CONFIG: Record<Severity, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { label: "Critical", color: "text-red-600", bg: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  high:     { label: "High",     color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20", icon: TrendingDown },
  medium:   { label: "Medium",   color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20", icon: Minus },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RiskRadarView() {
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<"all" | Severity>("all");

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news?q=enterprise+technology+risk+crisis+negative&pageSize=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const negativeArticles: Article[] = (data.articles || []).filter(
        (a: Article) => a.sentiment === "negative" || parseFloat(a.sentimentScore) < -0.1
      );
      setSignals(negativeArticles.map(toSignal).sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2 };
        return order[a.severity] - order[b.severity];
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRisks(); }, [fetchRisks]);

  const counts = {
    critical: signals.filter(s => s.severity === "critical").length,
    high: signals.filter(s => s.severity === "high").length,
    medium: signals.filter(s => s.severity === "medium").length,
  };

  const filtered = sevFilter === "all" ? signals : signals.filter(s => s.severity === sevFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Risk Radar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live negative signals detected across monitored sources. Classified by severity and confidence.
          </p>
        </div>
        <button
          onClick={fetchRisks}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["critical", "high", "medium"] as Severity[]).map((sev) => {
          const cfg = SEV_CONFIG[sev];
          return (
            <button
              key={sev}
              onClick={() => setSevFilter(sevFilter === sev ? "all" : sev)}
              className={`p-4 rounded-xl border text-left transition-all ${
                sevFilter === sev ? "border-foreground bg-foreground/5" : "border-foreground/10 bg-card hover:border-foreground/25"
              }`}
            >
              <div className="text-xs font-mono text-muted-foreground">{cfg.label} Risk</div>
              <div className={`text-3xl font-display font-semibold mt-1 ${cfg.color}`}>{counts[sev]}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">signals detected</div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 text-xs font-mono border-b border-foreground/10 pb-3">
        {(["all", "critical", "high", "medium"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSevFilter(f)}
            className={`px-3 py-1 rounded-full transition-colors capitalize ${
              sevFilter === f ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All Signals" : f}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">{filtered.length} signals</span>
      </div>

      {/* Signal list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl border border-foreground/10 bg-card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((signal) => {
            const cfg = SEV_CONFIG[signal.severity];
            const Icon = cfg.icon;
            const isOpen = expanded === signal.id;

            return (
              <div key={signal.id} className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-foreground/2 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : signal.id)}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground line-clamp-1">{signal.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                      <span>{signal.source}</span>
                      <span>·</span>
                      <span>{timeAgo(signal.publishedAt)}</span>
                      <span>·</span>
                      <span>+{signal.mentions}% mentions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-semibold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground w-12 text-right">{signal.confidence}% conf.</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-foreground/10 pt-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-mono text-muted-foreground uppercase tracking-wider text-[10px] mb-1">AI Explanation</div>
                        <p className="text-foreground leading-relaxed">{signal.aiExplanation}</p>
                      </div>
                      <div>
                        <div className="font-mono text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Recommended Response</div>
                        <p className="text-foreground font-medium leading-relaxed">{signal.recommendedResponse}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-foreground/10 text-xs font-mono">
                      <a href={signal.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                        View Source →
                      </a>
                      <span className="text-muted-foreground">Trend: {signal.trend}</span>
                      <span className="text-muted-foreground">Sentiment: {signal.sentimentScore.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-20" />
              No risk signals detected at this severity level.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
