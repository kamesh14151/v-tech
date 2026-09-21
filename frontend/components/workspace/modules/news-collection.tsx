"use client";

import { useState, useEffect, useCallback } from "react";
import { Newspaper, Globe, RefreshCw, Filter, ArrowRight, ExternalLink, Clock, TrendingUp, AlertCircle, Loader2, Languages, ShieldAlert, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: string;
  description?: string;
  thumbnail?: string;
  apiSource: "gdeltcloud" | "googlenews" | "newsapi" | "guardian";
  language?: string;
  regionName?: string;
  nativeLanguage?: string;
  languageBreakdown?: { language: string; count: number }[];
  topArticles?: { url: string; title: string; domain: string; domain_avatar_url?: string; rank?: number }[];
  crossRegionalCoverage?: { language: string; regionName: string; nativeLanguage?: string; title: string; source: string; url: string }[];
  geo?: { country?: string; region?: string; continent?: string; location?: string };
  actors?: { name: string; country?: string; role?: string }[];
  metrics?: { significance?: number; severity_tier?: string; confidence?: number; article_count?: number };
  relevanceScore: number;
  sentimentScore: string;
  sentiment: "positive" | "negative" | "neutral";
}

const FILTER_TYPES = ["All", "GDELT Cloud", "Google News", "NewsAPI", "Guardian", "High Relevance (90+)"];

const LANGUAGES = [
  { code: "all", name: "All Regions & Languages" },
  { code: "ta", name: "Tamil Nadu (தமிழ்)" },
  { code: "kn", name: "Karnataka (ಕನ್ನಡ)" },
  { code: "hi", name: "National Hindi (हिंदी)" },
  { code: "te", name: "AP & Telangana (తెలుగు)" },
  { code: "ml", name: "Kerala (മലയാളം)" },
  { code: "en", name: "Global English" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "zh", name: "Chinese (中文)" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sentimentColor(sentiment: string) {
  if (sentiment === "positive") return "text-emerald-500";
  if (sentiment === "negative") return "text-red-500";
  return "text-amber-500";
}

export function NewsCollectionView({ onNavigate }: { onNavigate: (mod: any) => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("All");
  const [selectedLang, setSelectedLang] = useState("all");
  const [searchQuery, setSearchQuery] = useState("enterprise technology AI PR media");
  const [total, setTotal] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(searchQuery)}&pageSize=25&lang=${selectedLang}`);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLang]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSaveArticle = async (art: Article) => {
    setSavingId(art.id);
    try {
      await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: art.title,
          url: art.url,
          source: art.source,
          publishedAt: art.publishedAt,
          description: art.description,
          sentiment: art.sentiment,
          relevanceScore: art.relevanceScore,
          apiSource: art.apiSource,
        }),
      });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = articles.filter((a) => {
    if (filterType === "GDELT Cloud") return a.apiSource === "gdeltcloud";
    if (filterType === "Google News") return a.apiSource === "googlenews";
    if (filterType === "NewsAPI") return a.apiSource === "newsapi";
    if (filterType === "Guardian") return a.apiSource === "guardian";
    if (filterType === "High Relevance (90+)") return a.relevanceScore >= 90;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display tracking-tight">News Collection Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time cross-regional media engine — Tamil Nadu, Karnataka, National Hindi & Global feeds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchNews}
            disabled={loading}
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-mono gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loading ? "Fetching..." : "Refresh Feed"}
          </Button>

          <Button
            onClick={() => onNavigate("extraction")}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-mono gap-2"
          >
            Open Extractor <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Live Articles", value: total.toString(), sub: "From GDELT + Regional Google Feeds" },
          { label: "Regional Media", value: `${new Set(articles.map(a => a.regionName).filter(Boolean)).size} Regions`, sub: "Tamil Nadu, Karnataka, National..." },
          { label: "High Relevance", value: articles.filter(a => a.relevanceScore >= 90).length.toString(), sub: "90+ Relevance Score" },
          { label: "Multi-Language", value: `${new Set(articles.map(a => a.language).filter(Boolean)).size} Languages`, sub: "Tamil, Kannada, Hindi, English" },
        ].map((m, i) => (
          <div key={i} className="p-5 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl">
            <div className="text-xs font-mono text-muted-foreground">{m.label}</div>
            <div className="text-2xl font-display font-semibold mt-1 text-foreground">{m.value}</div>
            <div className="text-[10px] font-mono text-muted-foreground/80 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Search & Language Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topic (e.g. Cinema, PayU, Vijay, IPL...)"
          className="flex-1 px-4 py-2.5 text-xs font-mono rounded-full border border-foreground/10 bg-background/50 focus:bg-background focus:outline-none focus:border-foreground/30 transition-all"
          onKeyDown={(e) => e.key === "Enter" && fetchNews()}
        />

        <div className="flex items-center gap-2">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-mono rounded-full border border-foreground/10 bg-background text-foreground focus:outline-none font-medium"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>

          <Button onClick={fetchNews} className="rounded-full text-xs font-mono bg-foreground text-background hover:bg-foreground/90 px-6">
            Search
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-4 font-mono text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Provider:</span>
          {FILTER_TYPES.map((type) => (
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
          Showing <span className="font-bold text-foreground">{filtered.length}</span> articles
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-foreground/10 bg-card animate-pulse">
              <div className="h-3 bg-foreground/5 rounded w-1/4 mb-3" />
              <div className="h-5 bg-foreground/5 rounded w-3/4 mb-2" />
              <div className="h-3 bg-foreground/5 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Articles Feed */}
      {!loading && (
        <div className="space-y-4">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                  <span className="font-bold text-foreground">{art.source}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(art.publishedAt)}
                  </span>

                  {/* Regional State Language Badge */}
                  {art.regionName && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {art.regionName} {art.nativeLanguage ? `(${art.nativeLanguage})` : ""}
                    </span>
                  )}

                  {/* Provider Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    art.apiSource === "gdeltcloud"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : art.apiSource === "googlenews"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : art.apiSource === "guardian"
                      ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                  }`}>
                    {art.apiSource === "gdeltcloud" ? "GDELT Cloud" : art.apiSource === "googlenews" ? "Google News" : art.apiSource === "guardian" ? "The Guardian" : "NewsAPI"}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className={`font-medium ${sentimentColor(art.sentiment)}`}>
                    {art.sentiment === "positive" ? "+" : art.sentiment === "negative" ? "-" : "~"}
                    {Math.abs(parseFloat(art.sentimentScore)).toFixed(2)} {art.sentiment}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-foreground text-background font-bold text-[11px]">
                    {art.relevanceScore} / 100
                  </span>
                </div>
              </div>

              <a href={art.url} target="_blank" rel="noopener noreferrer">
                <h3 className="text-lg font-sans font-semibold text-foreground hover:underline cursor-pointer line-clamp-2">
                  {art.title}
                </h3>
              </a>

              {art.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{art.description}</p>
              )}

              {/* Cross-Regional Media Coverage Section (Tamil Nadu, Karnataka, National Hindi, etc.) */}
              {art.crossRegionalCoverage && art.crossRegionalCoverage.length > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-foreground/3 border border-foreground/10 space-y-2">
                  <div className="text-[11px] font-mono font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-blue-500" />
                      Cross-Regional Coverage for this Topic (TN, Karnataka, National Media)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {art.crossRegionalCoverage.length} other regions reporting
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {art.crossRegionalCoverage.map((crc, idx) => (
                      <a
                        key={idx}
                        href={crc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-background border border-foreground/10 hover:border-blue-500/40 transition-all space-y-1 block group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span className="font-bold text-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-emerald-500" /> {crc.regionName}
                          </span>
                          <span className="text-blue-500 font-semibold">{crc.source}</span>
                        </div>
                        <div className="text-xs font-sans text-foreground/90 group-hover:underline line-clamp-1">
                          {crc.title}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-foreground/10 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-3">
                  {art.author && <span>By <strong className="text-foreground">{art.author}</strong></span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveArticle(art)}
                    disabled={savingId === art.id}
                    className="text-foreground/60 hover:text-foreground font-semibold hover:underline flex items-center gap-1 transition-colors"
                  >
                    {savingId === art.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save Article
                  </button>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-semibold hover:underline flex items-center gap-1"
                  >
                    Open Source <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && !error && (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
              No articles found. Try a different search query or select All Regions & Languages.
            </div>
          )}
        </div>
      )}
    </div>
  );
}


