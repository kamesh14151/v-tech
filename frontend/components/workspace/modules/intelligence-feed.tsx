"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, ExternalLink, Clock, TrendingUp, AlertCircle, Filter, Search, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: string;
  description?: string;
  apiSource: "newsapi" | "guardian";
  relevanceScore: number;
  sentimentScore: string;
  sentiment: "positive" | "negative" | "neutral";
}

const FILTERS = ["All", "News", "Competitors", "Risks", "Opportunities"] as const;
type FilterType = typeof FILTERS[number];

const SORTS = ["Most Relevant", "Most Recent", "Highest Risk"] as const;
type SortType = typeof SORTS[number];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sentimentBadge(s: string) {
  if (s === "positive") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (s === "negative") return "bg-red-500/10 text-red-500 border-red-500/20";
  return "bg-amber-500/10 text-amber-600 border-amber-500/20";
}

function aiSummary(article: Article): string {
  const score = article.relevanceScore;
  if (score >= 95) return `High-impact coverage directly relevant to your monitored entities. ${article.source} reports on a significant development worth immediate attention.`;
  if (score >= 88) return `Relevant industry coverage with moderate strategic significance. Mentions key topics in your monitoring scope.`;
  return `Peripheral coverage. Mentions related topics but primary focus is broader market context.`;
}

function whyItMatters(article: Article): string {
  if (article.sentiment === "negative") return "Negative coverage from a tracked source may affect brand perception. Monitor for amplification.";
  if (article.sentiment === "positive") return "Positive coverage supports narrative positioning. Consider amplifying through owned channels.";
  return "Neutral industry coverage provides competitive context worth tracking.";
}

function recommendedAction(article: Article): string {
  if (article.sentiment === "negative" && article.relevanceScore >= 90) return "Create risk alert and brief PR team.";
  if (article.sentiment === "positive" && article.relevanceScore >= 90) return "Add to morning briefing and share with leadership.";
  if (article.relevanceScore >= 88) return "Flag for daily digest review.";
  return "Archive for periodic competitive review.";
}

export function IntelligenceFeedView({ query: propQuery = "" }: { query?: string }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("Most Relevant");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // The active query — use global prop if set, otherwise a sensible default
  const activeQuery = propQuery.trim() || "technology business news";

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(activeQuery)}&pageSize=20`);
      if (!res.ok) throw new Error("Failed to fetch feed");
      const data = await res.json();
      setArticles(data.articles || []);
      setPage(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeQuery]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const filtered = articles
    .filter((a) => {
      if (filter === "Risks") return a.sentiment === "negative";
      if (filter === "Opportunities") return a.sentiment === "positive" && a.relevanceScore >= 90;
      if (filter === "Competitors") return a.title.toLowerCase().match(/competitor|brandwatch|cision|talkwalker|muck rack/);
      return true;
    })
    .sort((a, b) => {
      if (sort === "Most Recent") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sort === "Highest Risk") return (a.sentiment === "negative" ? -1 : 1);
      return b.relevanceScore - a.relevanceScore;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedFiltered = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filter or sort changes
  useEffect(() => { setPage(1); }, [filter, sort]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Intelligence Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {propQuery
              ? <>Live coverage for <span className="font-semibold text-foreground">"{propQuery}"</span> from NewsAPI + The Guardian.</>  
              : "Live articles from NewsAPI + The Guardian, analyzed and ranked by relevance and impact."}
          </p>
        </div>
        <button
          onClick={fetchFeed}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      {/* Sort only — search is global */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-foreground/8 bg-foreground/3 font-mono text-xs text-muted-foreground">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Monitoring: <strong className="text-foreground">{activeQuery}</strong></span>
          <span className="ml-auto text-[10px]">Use top search to change</span>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-3 py-2 text-xs font-mono rounded-xl border border-foreground/10 bg-background text-foreground focus:outline-none shrink-0"
        >
          {SORTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Filters + Count */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full transition-colors ${
                filter === f ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} items</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-xl border border-foreground/10 bg-card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedFiltered.map((a) => {
            const isOpen = expanded === a.id;
            return (
              <div key={a.id} className="rounded-xl border border-foreground/10 bg-card hover:border-foreground/20 transition-all overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                >
                  {/* Relevance bar */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 w-8">
                    <span className="text-[10px] font-mono font-bold text-foreground">{a.relevanceScore}</span>
                    <div className="w-1 h-8 bg-foreground/5 rounded-full overflow-hidden">
                      <div className="w-full bg-foreground rounded-full" style={{ height: `${a.relevanceScore}%` }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground line-clamp-1">{a.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted-foreground">
                      <span className="font-medium">{a.source}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(a.publishedAt)}</span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.5 rounded border ${sentimentBadge(a.sentiment)}`}>{a.sentiment}</span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </div>

                {/* Expanded intelligence panel */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-foreground/10 space-y-4 pt-4">
                    <div className="grid sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">AI Summary</div>
                        <p className="text-foreground leading-relaxed">{aiSummary(a)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Why It Matters</div>
                        <p className="text-foreground leading-relaxed">{whyItMatters(a)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-mono text-muted-foreground uppercase tracking-wider text-[10px]">Recommended Action</div>
                        <p className="text-foreground font-medium leading-relaxed">{recommendedAction(a)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-foreground/10">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-mono text-foreground hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Source
                      </a>
                      <span className="text-muted-foreground text-xs font-mono">via {a.apiSource === "guardian" ? "The Guardian" : "NewsAPI"}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              No intelligence items for this filter. Try a different query.
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between pt-4 pb-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono disabled:opacity-50 hover:bg-foreground/5 transition-colors text-foreground"
              >
                Previous
              </button>
              <span className="text-xs font-mono text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-full border border-foreground/10 text-xs font-mono disabled:opacity-50 hover:bg-foreground/5 transition-colors text-foreground"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
