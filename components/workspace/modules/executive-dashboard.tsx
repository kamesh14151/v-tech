"use client";

import { useState, useEffect, useCallback } from "react";
import { Sun, RefreshCw, Loader2, TrendingUp, TrendingDown, AlertTriangle, Newspaper, ChevronRight, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

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

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function getHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function aiWhyMatters(a: Article): string {
  if (a.sentiment === "negative" && a.relevanceScore >= 90) return "High-authority negative coverage — potential brand impact if amplified.";
  if (a.sentiment === "positive" && a.relevanceScore >= 90) return "Positive signal. Consider amplifying through owned channels.";
  if (a.relevanceScore >= 88) return "Relevant competitive context worth monitoring for narrative shifts.";
  return "Industry coverage providing market context for your monitored entities.";
}

function aiRecommendedAction(a: Article): string {
  if (a.sentiment === "negative" && a.relevanceScore >= 90) return "Brief PR team and monitor for amplification.";
  if (a.sentiment === "positive" && a.relevanceScore >= 90) return "Add to morning briefing and share with leadership.";
  return "Flag for daily digest.";
}

export function ExecutiveDashboardView({ onNavigate }: { onNavigate: (mod: string) => void }) {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_data = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news?q=enterprise+technology+AI+media+PR&pageSize=20");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_data(); }, [fetch_data]);

  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const positiveCount = articles.filter(a => a.sentiment === "positive").length;
  const negativeCount = articles.filter(a => a.sentiment === "negative").length;
  const sentimentPct = articles.length ? Math.round((positiveCount / articles.length) * 100) : 0;
  const riskSignals = articles.filter(a => a.sentiment === "negative" && a.relevanceScore >= 85).length;
  const criticalRisks = articles.filter(a => a.sentiment === "negative" && a.relevanceScore >= 92).length;
  const topArticles = [...articles].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);

  // AI Executive Brief
  const briefParts: string[] = [];
  if (criticalRisks > 0) briefParts.push(`${criticalRisks} critical risk signal${criticalRisks > 1 ? "s" : ""} detected`);
  if (negativeCount > positiveCount) briefParts.push("negative sentiment trending above positive coverage");
  if (articles.length > 15) briefParts.push(`${articles.length} intelligence items collected across monitored sources`);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-1">{todayStr()}</div>
          <h1 className="text-3xl font-display tracking-tight">{getHour()}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what changed across your monitored landscape.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetch_data}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          <button
            onClick={() => onNavigate("morning")}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-mono transition-colors"
          >
            <Sun className="w-3.5 h-3.5 fill-current" />
            Morning Brief
          </button>
        </div>
      </div>

      {/* AI Executive Brief */}
      {!loading && articles.length > 0 && (
        <div className="p-5 rounded-xl border border-foreground/15 bg-foreground/3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">AI Executive Brief</div>
              <p className="text-sm text-foreground leading-relaxed">
                {briefParts.length > 0
                  ? `${briefParts.join(", ")}.`
                  : `${articles.length} intelligence items collected. Overall sentiment is ${sentimentPct}% positive with ${riskSignals} elevated risk signals requiring attention.`}
              </p>
            </div>
            <button
              onClick={() => onNavigate("briefings")}
              className="text-xs font-mono text-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors shrink-0"
            >
              Full Brief <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl border border-foreground/10 bg-card animate-pulse" />)
        ) : (
          <>
            <button onClick={() => onNavigate("feed")} className="p-5 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all text-left group">
              <div className="text-xs font-mono text-muted-foreground">Media Mentions</div>
              <div className="text-3xl font-display font-semibold mt-1 text-foreground">{articles.length}</div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-500 mt-0.5">
                <TrendingUp className="w-3 h-3" /> Live from 2 sources
              </div>
            </button>

            <button onClick={() => onNavigate("risk")} className="p-5 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all text-left group">
              <div className="text-xs font-mono text-muted-foreground">Risk Signals</div>
              <div className={`text-3xl font-display font-semibold mt-1 ${riskSignals > 0 ? "text-red-500" : "text-foreground"}`}>{riskSignals}</div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground mt-0.5">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                {criticalRisks} critical
              </div>
            </button>

            <button onClick={() => onNavigate("feed")} className="p-5 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all text-left group">
              <div className="text-xs font-mono text-muted-foreground">Sentiment</div>
              <div className={`text-3xl font-display font-semibold mt-1 ${sentimentPct >= 60 ? "text-emerald-500" : sentimentPct >= 40 ? "text-amber-500" : "text-red-500"}`}>
                {sentimentPct}%
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground mt-0.5">
                {sentimentPct >= 60 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                positive coverage
              </div>
            </button>

            <button onClick={() => onNavigate("competitors")} className="p-5 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all text-left group">
              <div className="text-xs font-mono text-muted-foreground">Intelligence Sources</div>
              <div className="text-3xl font-display font-semibold mt-1 text-foreground">2</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-0.5">NewsAPI + Guardian</div>
            </button>
          </>
        )}
      </div>

      {/* What Matters Today */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">What Matters Today</h2>
          <button onClick={() => onNavigate("feed")} className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Full Feed <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl border border-foreground/10 bg-card animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {topArticles.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-foreground/10 bg-card hover:border-foreground/20 transition-all">
                <div className="flex items-start gap-4">
                  {/* Relevance indicator */}
                  <div className="shrink-0 flex flex-col items-center pt-1">
                    <span className="text-[10px] font-mono font-bold text-foreground">{a.relevanceScore}</span>
                    <div className="w-0.5 h-6 bg-foreground/10 rounded-full mt-1 overflow-hidden">
                      <div className="w-full bg-foreground rounded-full" style={{ height: `${a.relevanceScore}%` }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:underline line-clamp-2 block">
                      {a.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-muted-foreground">
                      <span className="font-medium">{a.source}</span>
                      <span>·</span>
                      <span>{timeAgo(a.publishedAt)}</span>
                      <span>·</span>
                      <span className={
                        a.sentiment === "positive" ? "text-emerald-500" :
                        a.sentiment === "negative" ? "text-red-500" : "text-amber-500"
                      }>{a.sentiment}</span>
                    </div>

                    {/* AI interpretation inline */}
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                      <div>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Why it matters · </span>
                        <span className="text-[11px] text-foreground/80">{aiWhyMatters(a)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Action · </span>
                        <span className="text-[11px] text-foreground font-medium">{aiRecommendedAction(a)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {topArticles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono text-sm">
                <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />
                No intelligence items. Check your connection or refresh.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
