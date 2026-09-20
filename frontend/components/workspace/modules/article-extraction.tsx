"use client";

import { useState, useEffect } from "react";
import { FileText, Lock, Code, CheckCircle, ExternalLink, Sparkles, User, Calendar, Copy, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedArticle {
  title: string;
  url: string;
  author: string;
  publication: string;
  domainAuthority: number;
  publishedAt: string;
  paywallBypassed: boolean;
  paywallStatus: string;
  wordCount: number;
  sentimentScore: string;
  primaryEntity: string;
  extractedQuotes: Array<{ quote: string; speaker: string; title: string }>;
  entitiesFound: Array<{ name: string; type: string; role: string }>;
  cleanBodySnippet: string;
}

export function ArticleExtractionView() {
  const [urlInput, setUrlInput] = useState("");
  const [viewMode, setViewMode] = useState<"parsed" | "json">("parsed");
  const [extractedData, setExtractedData] = useState<ExtractedArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentLiveArticles, setRecentLiveArticles] = useState<Array<{ title: string; url: string; source: string }>>([]);

  // Fetch real articles from News API to give user quick extraction presets
  useEffect(() => {
    fetch("/api/news?q=technology+business&pageSize=6")
      .then(res => res.json())
      .then(data => {
        if (data.articles && data.articles.length > 0) {
          setRecentLiveArticles(data.articles.slice(0, 4));
          // Auto-extract the first live article
          const first = data.articles[0];
          handleExtract(first.url, first.title);
        }
      })
      .catch(() => {});
  }, []);

  const handleExtract = async (targetUrl?: string, targetTitle?: string) => {
    const urlToUse = targetUrl || urlInput;
    if (!urlToUse.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToUse }),
      });
      const data = await res.json();
      setExtractedData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Core Capability 4</span>
          <span>•</span>
          <span className="text-foreground font-semibold">Multi-Pass Clean Extraction Engine</span>
        </div>
        <h1 className="text-2xl font-display tracking-tight">Smart Article & Paywall Extraction</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Extract clean text, author, timestamp, executive quotes, and structured entities from JS-heavy media sources without HTML noise.
        </p>
      </div>

      {/* URL Input Bar */}
      <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-3">
        <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          Live Article URL Extractor
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleExtract(); }} className="flex gap-2">
          <input
            type="url"
            placeholder="Paste any live media article URL (e.g. https://techcrunch.com/...)"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Extract Real Data
          </button>
        </form>

        {/* Quick select live articles */}
        {recentLiveArticles.length > 0 && (
          <div className="pt-2 border-t border-foreground/5 flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-muted-foreground text-[10px]">Quick Extract from Live News:</span>
            {recentLiveArticles.map((art, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { setUrlInput(art.url); handleExtract(art.url); }}
                className="px-2.5 py-1 rounded-full border border-foreground/10 bg-foreground/3 text-muted-foreground hover:text-foreground hover:bg-foreground/5 truncate max-w-xs transition-colors"
              >
                {art.source}: {art.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Extraction Results */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
          <div className="h-48 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
        </div>
      ) : extractedData ? (
        <div className="space-y-4">
          {/* Metadata Top Card */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-foreground/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> CLEAN TEXT EXTRACTED
                </span>
                <span className="font-mono text-xs text-muted-foreground">{extractedData.publication}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-foreground/10 p-0.5 font-mono text-[10px]">
                  <button
                    onClick={() => setViewMode("parsed")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === "parsed" ? "bg-foreground text-background font-semibold" : "text-muted-foreground"}`}
                  >
                    Structured View
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === "json" ? "bg-foreground text-background font-semibold" : "text-muted-foreground"}`}
                  >
                    Raw JSON
                  </button>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded-lg border border-foreground/10 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
            </div>

            <h2 className="text-xl font-display font-semibold text-foreground">
              {extractedData.title}
            </h2>

            {/* Meta tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-foreground/3">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                  <User className="w-3 h-3" /> Author / Byline
                </div>
                <div className="font-semibold text-foreground truncate">{extractedData.author}</div>
              </div>
              <div className="p-3 rounded-xl bg-foreground/3">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3" /> Publication
                </div>
                <div className="font-semibold text-foreground truncate">{extractedData.publication}</div>
              </div>
              <div className="p-3 rounded-xl bg-foreground/3">
                <div className="text-[10px] text-muted-foreground mb-0.5">Word Count</div>
                <div className="font-semibold text-foreground">{extractedData.wordCount} words</div>
              </div>
              <div className="p-3 rounded-xl bg-foreground/3">
                <div className="text-[10px] text-muted-foreground mb-0.5">Sentiment Polarity</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">{extractedData.sentimentScore}</div>
              </div>
            </div>
          </div>

          {viewMode === "json" ? (
            <div className="p-5 rounded-2xl border border-foreground/15 bg-black text-emerald-400 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(extractedData, null, 2)}</pre>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Clean text body */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-foreground/10 bg-card space-y-3">
                <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                  Clean Article Body (Stripped of Scripts & Paywall Noise)
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {extractedData.cleanBodySnippet}
                </p>
                {extractedData.url && (
                  <div className="pt-3 border-t border-foreground/5">
                    <a href={extractedData.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-foreground hover:underline flex items-center gap-1">
                      View Original Web Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Extracted Entities */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-3">
                  <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                    Named Entities & Context
                  </div>
                  <div className="space-y-2">
                    {extractedData.entitiesFound.map((ent, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-foreground/5 bg-foreground/2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{ent.name}</span>
                          <span className="text-[10px] text-muted-foreground">{ent.type}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{ent.role}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {extractedData.extractedQuotes.length > 0 && (
                  <div className="p-5 rounded-2xl border border-foreground/10 bg-card space-y-3">
                    <div className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                      Extracted Quotes
                    </div>
                    {extractedData.extractedQuotes.map((q, idx) => (
                      <blockquote key={idx} className="text-xs italic text-foreground/90 border-l-2 border-emerald-500 pl-3 py-1">
                        "{q.quote}"
                        <footer className="text-[10px] font-mono not-italic text-muted-foreground mt-1">
                          — {q.speaker} ({q.title})
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
