"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  RefreshCw, Loader2, Sparkles, ShieldCheck, Sliders,
  ExternalLink, FileText, CheckCircle2, Trophy, Globe,
  Clock, Download, FileDown, Mail, Send, Check, Eye,
  Layers, Printer, FileType
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWordDocx } from "@/lib/export-word";
import { exportAnthropicStyledPDF } from "@/lib/export-pdf";

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: string;
}

interface AnalysisResult {
  query: string;
  generatedAt: string;
  totalArticles: number;
  sources: string[];
  topicDomain?: string;
  location?: string;
  recency?: string;
  topStories: Array<{ title: string; source: string; url: string; relevanceScore: number; publishedAt: string }>;
  themes: Array<{ name: string; count: number; description?: string }>;
  risks: Array<{ severity: "critical" | "high" | "medium"; title: string; source: string; reason: string }>;
  sentiment: { positive: number; negative: number; neutral: number };
  executiveSummary: string;
  recommendedActions: string[];
  markdown: string;
  discoveredArticles?: number;
  relevantArticles?: number;
  noiseFilteredPercent?: number | null;
  agent_trace?: Array<{ agent: string; status: string; duration_ms?: number; items_out?: number; error?: string }>;
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ExecutiveDashboardView({
  onNavigate,
  onOpenDomainModal,
  topicDomain = "",
  topicQuery = "",
  location = "Within Tamil Nadu (TN)",
  recency = "Last 24 Hours",
  userEmail = "",
  onAnalysisComplete,
}: {
  onNavigate?: (mod: string) => void;
  onOpenDomainModal?: () => void;
  topicDomain?: string;
  topicQuery?: string;
  location?: string;
  recency?: string;
  userEmail?: string;
  onAnalysisComplete?: (result: any) => void;
}) {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(0);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!reportLoading) {
      setPipelineStage(0);
      setPipelineProgress(0);
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);

      if (elapsed < 4) {
        setPipelineStage(0);
        setPipelineProgress(Math.min(25, Math.round((elapsed / 4) * 25)));
      } else if (elapsed < 9) {
        setPipelineStage(1);
        setPipelineProgress(25 + Math.min(25, Math.round(((elapsed - 4) / 5) * 25)));
      } else if (elapsed < 16) {
        setPipelineStage(2);
        setPipelineProgress(50 + Math.min(30, Math.round(((elapsed - 9) / 7) * 30)));
      } else {
        setPipelineStage(3);
        setPipelineProgress(80 + Math.min(18, Math.round(((elapsed - 16) / 10) * 18)));
      }
    }, 500);

    return () => clearInterval(timer);
  }, [reportLoading]);

  const effectiveEmail = session?.user?.email || userEmail || "user@gmail.com";
  const isGmailAuth = effectiveEmail.includes("@gmail.com");

  const noiseFilteredPercent = report?.noiseFilteredPercent ?? (
    report?.discoveredArticles && report.discoveredArticles > 0 && report.relevantArticles != null
      ? Math.max(0, Math.min(100, Math.round((1 - report.relevantArticles / report.discoveredArticles) * 100)))
      : null
  );

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/reports/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch report history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!topicDomain) return;
    const effectiveQuery = (topicQuery || topicDomain).trim();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/news?q=${encodeURIComponent(effectiveQuery)}&topic_domain=${encodeURIComponent(topicDomain)}&location=${encodeURIComponent(location)}&recency=${encodeURIComponent(recency)}&pageSize=12`
      );
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [topicDomain, topicQuery, location, recency]);

  const loadPastReport = async (reportId: number) => {
    setReportLoading(true);
    setIsHistoryModalOpen(false);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        onAnalysisComplete?.(data);
      }
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setReportLoading(false);
    }
  };

  const generateReport = useCallback(async (forceFresh: boolean = false) => {
    if (!topicDomain) return;

    const effectiveQuery = (topicQuery || topicDomain).trim();
    const cacheKey = `optimus_report_${topicDomain}_${topicQuery}_${location}_${recency}`;

    // If not forcing fresh, check database or localStorage cache first
    if (!forceFresh) {
      try {
        const dbRes = await fetch("/api/reports/latest");
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData && dbData.executiveSummary) {
            setReport(dbData);
            onAnalysisComplete?.(dbData);
            return;
          }
        }
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setReport(parsed);
          onAnalysisComplete?.(parsed);
          return;
        }
      } catch (e) {
        console.error("Cache / DB read notice:", e);
      }
    }

    setReportLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: effectiveQuery,
          topic_domain: topicDomain || effectiveQuery,
          location,
          recency,
        }),
      });

      let data: any = null;
      if (res.ok) {
        data = await res.json().catch(() => null);
      } else {
        console.warn(`Analyze API returned status ${res.status}. Polling PostgreSQL database for finished report...`);
        // If 504 Gateway Timeout or 503 error occurs, poll /api/reports/latest as the backend completes asynchronously
        for (let attempt = 0; attempt < 6; attempt++) {
          await new Promise((r) => setTimeout(r, 4000));
          const latestRes = await fetch("/api/reports/latest");
          if (latestRes.ok) {
            const latestData = await latestRes.json().catch(() => null);
            if (latestData && latestData.executiveSummary) {
              data = latestData;
              break;
            }
          }
        }
      }

      if (data && data.executiveSummary) {
        setReport(data);
        onAnalysisComplete?.(data);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {}
      }
    } catch (e) {
      console.error("Analysis execution notice:", e);
    } finally {
      setReportLoading(false);
    }
  }, [topicDomain, topicQuery, location, recency, onAnalysisComplete]);

  useEffect(() => {
    if (topicDomain) {
      fetchDashboardData();
      generateReport(false);
    }
  }, [topicDomain, topicQuery, location, recency, fetchDashboardData, generateReport]);

  const handleDownloadDocx = async () => {
    if (!report) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateWordDocx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `optimus-intelligence-report-${report.query.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    setDownloadingPdf(true);
    try {
      await exportAnthropicStyledPDF(
        "optimus-report-container",
        `optimus-intelligence-report-${report.query.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`
      );
    } catch (e) {
      console.error("PDF export error:", e);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const stats = {
    total: articles.length,
    positive: articles.filter(a => a.sentiment === "positive").length,
    negative: articles.filter(a => a.sentiment === "negative").length,
    risks: articles.filter(a => parseFloat(a.sentimentScore) < -0.3).length,
  };

  // If no topic domain configured, show Call to Action to select
  if (!topicDomain) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6 sm:py-10 px-2 sm:px-4">
        <div className="rounded-3xl border border-dashed border-foreground/20 bg-card/60 p-6 sm:p-14 text-center space-y-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-2xl font-bold">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              No Topic Domain Configured Yet
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Please choose an industry or topic domain (e.g. <strong>Cricket & Sports</strong>, <strong>Fintech & Banking</strong>, <strong>IT Companies</strong>) to activate live news discovery and executive intelligence reports.
            </p>
          </div>
          <Button
            onClick={onOpenDomainModal}
            className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-6 sm:px-7 py-2.5 sm:py-3 text-xs font-mono font-semibold shadow-lg gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Select Your Domain & Scope Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-muted-foreground mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-foreground truncate">Optimus Media Intelligence</span>
            <span>•</span>
            <span className="hidden sm:inline">AI Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display tracking-tight font-semibold text-foreground">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time media intelligence, citation synthesis, and downloadable executive reports for {topicDomain}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setIsHistoryModalOpen(true); fetchHistory(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full border border-foreground/15 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            Report History
          </button>
          <button
            onClick={() => { fetchDashboardData(); generateReport(true); }}
            disabled={loading || reportLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/85 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || reportLoading ? "animate-spin" : ""}`} />
            Run Fresh Analysis
          </button>
        </div>
      </div>

      {/* Report History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-card border border-foreground/15 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <div className="flex items-center gap-2 font-display text-lg font-semibold">
                <Clock className="w-5 h-5 text-blue-500" />
                Saved Report History
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-foreground/10"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              All intelligence reports generated and saved in PostgreSQL database history. Click any report to view it immediately.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="py-12 text-center font-mono text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Loading saved reports history from DB...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs text-muted-foreground">
                  No saved report history found yet.
                </div>
              ) : (
                historyList.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => loadPastReport(item.id)}
                    className="p-4 rounded-2xl border border-foreground/10 hover:border-foreground/25 bg-background/50 hover:bg-background cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-foreground text-sm">{item.query || item.topic_domain}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.summary || "Saved intelligence dossier"}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-muted-foreground">
                      <span>Scope: {item.location} ({item.recency})</span>
                      <span className="text-blue-500 font-semibold flex items-center gap-1">
                        View Report →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scope & Delivery Status Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-foreground/12 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenDomainModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold transition-colors text-[11px] sm:text-xs"
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-36">{topicDomain}</span>
            <span className="text-[10px] text-muted-foreground underline ml-1">Change</span>
          </button>

          {topicQuery && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold text-[11px] sm:text-xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-44">Topic: "{topicQuery}"</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] sm:text-xs">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-36">{location}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px] sm:text-xs">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{recency}</span>
          </div>
        </div>

        {/* Gmail Auth Link */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-foreground/8 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground truncate">Reports to:</span>
            <span className="text-foreground font-semibold truncate max-w-32 sm:max-w-40">{effectiveEmail}</span>
          </div>
          {!isGmailAuth && (
            <button
              onClick={() => signIn("google", { callbackUrl: "/workspace" })}
              className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full transition-colors font-bold shrink-0"
              title="Authenticate via Gmail to fetch real verified email"
            >
              Verify Gmail
            </button>
          )}
        </div>
      </div>

      {/* Email Dispatched Toast */}
      {emailSent && (
        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Check className="w-4 h-4 shrink-0" />
            <span><strong>Dispatched!</strong> Intelligence Briefing and PDF report sent to <strong>{effectiveEmail}</strong>.</span>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded shrink-0">Sent</span>
        </div>
      )}

      {/* High-Level Impact Metrics / KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono">
            <span>Ingested Stories</span>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
            {stats.total}
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Live citations
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono">
            <span>Noise Filtered</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
            {noiseFilteredPercent != null ? `${noiseFilteredPercent}%` : "—"}
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
            False alerts killed
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono">
            <span>NLP Polarity</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-foreground flex items-baseline gap-1">
            <span>{stats.positive}</span>
            <span className="text-xs text-muted-foreground">pos</span>
            <span className="text-sm font-normal text-muted-foreground">/</span>
            <span className="text-destructive">{stats.negative}</span>
            <span className="text-xs text-muted-foreground">neg</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
            Lexicon scoring
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-foreground/12 bg-card space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono">
            <span>Adverse Signals</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-amber-500">
            {stats.risks}
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
            Adverse media radar
          </div>
        </div>
      </div>

      {/* OPTIMUS EXECUTIVE INTELLIGENCE DOSSIER (PDF EXPORTABLE) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              Optimus Executive Intelligence Dossier
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              {topicDomain} Executive Report
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || !report}
              className="flex-1 sm:flex-initial bg-foreground text-background hover:bg-foreground/85 rounded-full font-mono text-xs font-semibold gap-1.5 shadow-sm"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileType className="w-3.5 h-3.5 text-emerald-400" />}
              Download PDF (.pdf)
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadDocx}
              disabled={downloadingDocx || !report}
              className="flex-1 sm:flex-initial rounded-full font-mono text-xs gap-1.5 border-foreground/15 text-foreground hover:bg-foreground/5"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              Word (.docx)
            </Button>

            <Button
              variant="outline"
              onClick={handleSendEmail}
              className="flex-1 sm:flex-initial rounded-full font-mono text-xs gap-1.5 border-foreground/15 text-foreground hover:bg-foreground/5"
            >
              <Send className="w-3.5 h-3.5" />
              Send to Gmail
            </Button>
          </div>
        </div>

        {/* The Printable / PDF Container */}
        <div
          id="optimus-report-container"
          className="rounded-3xl border border-foreground/15 bg-white text-zinc-900 p-4 sm:p-8 md:p-12 shadow-xl space-y-6 sm:space-y-8 font-sans overflow-x-hidden"
        >
          {/* Document Header */}
          <div className="border-b border-zinc-200 pb-5 sm:pb-6 space-y-2.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-bold tracking-widest text-zinc-900 uppercase">OPTIMUS AI INTELLIGENCE</span>
              </div>
              <div className="text-[10px] sm:text-xs">{report ? new Date(report.generatedAt).toLocaleString("en-US", { dateStyle: "full" }) : ""}</div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold tracking-tight text-zinc-950">
              Executive Briefing: {topicDomain}
            </h1>
            <p className="text-[11px] sm:text-xs font-mono text-zinc-600">
              Scope: <strong>{location}</strong> · Window: <strong>{recency}</strong> · Target: <strong>{effectiveEmail}</strong>
            </p>
          </div>

          {reportLoading ? (
            <div className="py-8 px-2 sm:px-4 space-y-6 max-w-2xl mx-auto">
              <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-mono text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Multi-Agent Pipeline Active ({elapsedSeconds}s)
                </div>
                <h3 className="text-lg sm:text-xl font-display font-semibold text-zinc-900">
                  Synthesizing Executive Intelligence Briefing
                </h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Running automated news ingestion, rule pre-filtering, and LangGraph multi-agent orchestration for <strong>{topicDomain}</strong>.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-600 font-semibold">
                  <span>Pipeline Execution Progress</span>
                  <span className="text-emerald-700 font-bold">{pipelineProgress}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-200 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 transition-all duration-500 rounded-full shadow-sm"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                </div>
              </div>

              {/* Step-by-Step Stage Cards */}
              <div className="space-y-2.5 pt-1 text-left">
                {[
                  { stage: 0, title: "1. Multi-Source News Ingestion", desc: "Harvesting 35+ RSS feeds & Google News query search", icon: Globe },
                  { stage: 1, title: "2. Deterministic Rule Pre-Filter", desc: "Filtering scope, recency & scoring source reliability", icon: ShieldCheck },
                  { stage: 2, title: "3. LangGraph Multi-Agent Orchestration", desc: "NLP sentiment scoring, NER entity extraction & story clustering", icon: Layers },
                  { stage: 3, title: "4. Executive Synthesis & DB Persistence", desc: "Formulating strategic briefing & saving report to database", icon: FileText },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  const isDone = pipelineStage > s.stage;
                  const isCurrent = pipelineStage === s.stage;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "border-emerald-500/60 bg-emerald-500/5 shadow-sm"
                          : isDone
                          ? "border-emerald-500/20 bg-zinc-50 text-zinc-700"
                          : "border-zinc-200 bg-zinc-50/40 text-zinc-400"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isCurrent ? "bg-emerald-600 text-white animate-pulse" : isDone ? "bg-emerald-500/20 text-emerald-700" : "bg-zinc-200 text-zinc-400"
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : isCurrent ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold truncate ${isCurrent ? "text-emerald-950 font-bold" : isDone ? "text-zinc-900 font-semibold" : "text-zinc-400"}`}>
                            {s.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{s.desc}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                        isCurrent ? "bg-emerald-600 text-white" : isDone ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-500"
                      }`}>
                        {isCurrent ? "Processing" : isDone ? "Completed" : "Queued"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : report ? (
            <div className="space-y-6 sm:space-y-8">
              {/* Anthropic-style Executive Summary Callout */}
              <div className="space-y-2">
                <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">1</span>
                  Executive Summary & Strategic Overview
                </div>
                <div className="p-4 sm:p-6 rounded-2xl border-l-4 border-emerald-600 bg-zinc-50 text-zinc-900 font-serif text-sm sm:text-base md:text-lg leading-relaxed shadow-sm">
                  {report.executiveSummary}
                </div>
              </div>

              {/* Narrative Thematic Clusters */}
              <div className="space-y-3">
                <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">2</span>
                  Key Narrative Clusters & Sector Drivers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {report.themes.map((theme, i) => (
                    <div key={i} className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-zinc-900 truncate">{theme.name}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 shrink-0">
                          {theme.count} citations
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-600 leading-relaxed">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Signals */}
              {report.risks.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">3</span>
                    Risk Signals & Adverse Media Alerts
                  </div>
                  <div className="space-y-2">
                    {report.risks.map((r, i) => (
                      <div key={i} className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-start gap-2.5 sm:gap-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase border shrink-0 ${
                          r.severity === "critical" ? "bg-red-100 text-red-700 border-red-200" :
                          r.severity === "high" ? "bg-amber-100 text-amber-800 border-amber-200" :
                          "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}>
                          {r.severity}
                        </span>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-950 truncate">{r.title}</div>
                          <div className="text-[10px] sm:text-[11px] text-zinc-600 leading-snug">Source: {r.source} — {r.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Strategic Actions */}
              <div className="space-y-3">
                <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">4</span>
                  Actionable Strategic Recommendations
                </div>
                <div className="space-y-2">
                  {report.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-zinc-50">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[11px] sm:text-xs text-zinc-800 leading-relaxed font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perplexity-style Verified Citations Table */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">5</span>
                  Perplexity-Indexed Verified Citations
                </div>
                <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-200">
                  {report.topStories.map((story, idx) => (
                    <div key={idx} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-zinc-100 border border-zinc-300 text-zinc-700 font-mono text-[9px] sm:text-[10px] font-bold flex items-center justify-center shrink-0">
                          [{idx + 1}]
                        </span>
                        <div className="min-w-0">
                          <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-zinc-900 hover:underline truncate block">
                            {story.title}
                          </a>
                          <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 mt-0.5">
                            {story.source} · {timeAgo(story.publishedAt)}
                          </div>
                        </div>
                      </div>
                      <span className="self-start sm:self-center px-2 py-0.5 rounded-full font-mono text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {story.relevanceScore}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Footer */}
              <div className="pt-5 border-t border-zinc-200 text-center font-mono text-[9px] sm:text-[10px] text-zinc-400">
                Synthesized autonomously by Optimus AI · Verified Media Intelligence Platform · Confidential Executive Briefing
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
