"use client";

import { useState } from "react";
import {
  Brain, Play, Download, Loader2, AlertTriangle, CheckCircle2,
  TrendingDown, Minus, FileText, ChevronDown, ChevronRight,
  Sparkles, ShieldAlert, Lightbulb, BarChart3, ExternalLink,
  Globe, Trophy, Clock, FileDown, Eye, LayoutTemplate,
  Layers, Check
} from "lucide-react";
import { generateWordDocx } from "@/lib/export-word";

interface Theme { name: string; count: number; description?: string }
interface RiskSignal { severity: "critical" | "high" | "medium"; title: string; source: string; reason: string }
interface TopStory { title: string; source: string; url: string; relevanceScore: number; publishedAt: string }
interface AnalysisResult {
  query: string;
  generatedAt: string;
  totalArticles: number;
  sources: string[];
  topicDomain?: string;
  location?: string;
  recency?: string;
  topStories: TopStory[];
  themes: Theme[];
  risks: RiskSignal[];
  sentiment: { positive: number; negative: number; neutral: number };
  executiveSummary: string;
  recommendedActions: string[];
  markdown: string;
}

const RISK_CONFIG = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
  high:     { label: "High",     color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: TrendingDown },
  medium:   { label: "Medium",   color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", icon: Minus },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function downloadMarkdown(markdown: string, query: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `optimus-intelligence-report-${query.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadWordDoc(result: AnalysisResult) {
  try {
    const blob = await generateWordDocx(result);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `optimus-intelligence-report-${result.query.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to generate Word document:", err);
  }
}

function PipelineStep({ label, desc, status }: { label: string; desc: string; status: "idle" | "running" | "done" }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
      status === "done" ? "border-emerald-500/20 bg-emerald-500/5" :
      status === "running" ? "border-foreground/20 bg-foreground/5" :
      "border-foreground/8 bg-transparent opacity-50"
    }`}>
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        status === "done" ? "bg-emerald-500/20" :
        status === "running" ? "bg-foreground/10" :
        "bg-foreground/5"
      }`}>
        {status === "done" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        ) : status === "running" ? (
          <Loader2 className="w-3 h-3 text-foreground animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-foreground/20" />
        )}
      </div>
      <div>
        <div className="text-xs font-semibold text-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{desc}</div>
      </div>
      <div className={`ml-auto text-[10px] font-mono shrink-0 ${
        status === "done" ? "text-emerald-500" : status === "running" ? "text-foreground animate-pulse" : "text-muted-foreground"
      }`}>
        {status === "done" ? "Done" : status === "running" ? "Running..." : "Waiting"}
      </div>
    </div>
  );
}

export function AIAgentView({
  query = "",
  topic_domain: propDomain = "Fintech & Banking",
  location: propLocation = "Within Tamil Nadu (TN)",
  recency: propRecency = "Last 24 Hours",
}: {
  query?: string;
  topic_domain?: string;
  location?: string;
  recency?: string;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [viewMode, setViewMode] = useState<"memo" | "interactive" | "markdown">("memo");
  const [expandedSection, setExpandedSection] = useState<string | null>("summary");

  const effectiveSubject = query.trim() || propDomain;

  const runAgent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStep(1);

    const stepDelay = (s: 1 | 2 | 3 | 4, ms: number) =>
      new Promise<void>(resolve => setTimeout(() => { setStep(s); resolve(); }, ms));

    try {
      const fetchPromise = fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: effectiveSubject,
          topic_domain: propDomain,
          location: propLocation,
          recency: propRecency,
        }),
      });

      await stepDelay(2, 600);
      await stepDelay(3, 1200);
      await stepDelay(4, 1800);

      const res = await fetchPromise;
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setResult(data);
      setExpandedSection("summary");
    } catch (e: any) {
      setError(e.message);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    setDownloadingDocx(true);
    try {
      await downloadWordDoc(result);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const stepStatus = (n: number): "idle" | "running" | "done" => {
    if (step === 0) return "idle";
    if (step > n) return "done";
    if (step === n) return "running";
    return "idle";
  };

  const toggle = (key: string) => setExpandedSection(expandedSection === key ? null : key);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h1 className="text-2xl font-display tracking-tight">Optimus AI Intelligence Agent</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Synthesizes live news for <strong className="text-foreground">{effectiveSubject}</strong> into an executive intelligence report & styled Word document.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {result && (
            <>
              <button
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                Download Word (.docx)
              </button>

              <button
                onClick={() => downloadMarkdown(result.markdown, result.query)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-foreground/15 text-xs font-mono text-foreground hover:bg-foreground/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                .md
              </button>
            </>
          )}

          <button
            onClick={runAgent}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-foreground text-background text-xs font-semibold font-mono hover:bg-foreground/85 transition-colors disabled:opacity-60 shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {loading ? "Optimus AI Analyzing..." : result ? "Re-run Analysis" : `Analyze ${effectiveSubject}`}
          </button>
        </div>
      </div>

      {/* Scope & Domain Badges */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-foreground/10 bg-foreground/3">
          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">Domain:</span>
          <span className="text-foreground font-semibold">{propDomain}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-foreground/10 bg-card">
          <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground">Location:</span>
          <span className="text-foreground font-medium">{propLocation}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-foreground/10 bg-card">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-muted-foreground">Time Window:</span>
          <span className="text-foreground font-medium">{propRecency}</span>
        </div>

        {query && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="text-muted-foreground">Query Filter:</span>
            <span className="font-semibold">{query}</span>
          </div>
        )}
      </div>

      {/* Pipeline stages */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
          Optimus AI Autonomous Pipeline — 4 Stages
        </div>
        <PipelineStep
          label="Stage 1 — Domain & Location Ingestion"
          desc={`Ingesting verified coverage for ${propDomain} in ${propLocation} (${propRecency})`}
          status={stepStatus(1)}
        />
        <PipelineStep
          label="Stage 2 — Semantic Narrative & Entity Clustering"
          desc="Clustering articles by concept, theme, and unbranded narrative signals"
          status={stepStatus(2)}
        />
        <PipelineStep
          label="Stage 3 — Context Validation & False Positive Filtering"
          desc="LLM sentence disambiguation, NLP sentiment polarity scoring, risk detection"
          status={stepStatus(3)}
        />
        <PipelineStep
          label="Stage 4 — Optimus AI Synthesis & Word Document Generation"
          desc="Generating executive summary, thematic insights, and actionable PR steps"
          status={stepStatus(4)}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-500 text-xs font-mono">Analysis Notice</div>
            <div className="text-foreground mt-1 text-xs">{error}</div>
          </div>
        </div>
      )}

      {/* Results Presentation */}
      {result && (
        <div className="space-y-5 border-t border-foreground/10 pt-6">
          {/* View Mode Switcher Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase font-semibold">Report Format:</span>
              <div className="flex rounded-xl border border-foreground/10 p-1 bg-card font-mono text-xs">
                <button
                  onClick={() => setViewMode("memo")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === "memo"
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Executive Document View
                </button>
                <button
                  onClick={() => setViewMode("interactive")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === "interactive"
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Interactive Cards
                </button>
                <button
                  onClick={() => setViewMode("markdown")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === "markdown"
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Raw Markdown
                </button>
              </div>
            </div>

            {/* Quick Word & Markdown download */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-semibold shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export Word .docx
              </button>
            </div>
          </div>

          {/* 1. EXECUTIVE WORD DOCUMENT STYLED VIEW */}
          {viewMode === "memo" && (
            <div className="rounded-3xl border border-foreground/15 bg-card p-8 sm:p-12 shadow-xl space-y-8 font-sans">
              {/* Document Header */}
              <div className="border-b border-foreground/10 pb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    OPTIMUS INTELLIGENCE REPORT · EXECUTIVE DOSSIER
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {new Date(result.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-foreground">
                  Intelligence Briefing: {result.query}
                </h1>
              </div>

              {/* Metadata Dossier Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-foreground/3 border border-foreground/8 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Topic Domain</div>
                  <div className="font-semibold text-foreground truncate mt-0.5">{result.topicDomain || propDomain}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Location Scope</div>
                  <div className="font-semibold text-foreground truncate mt-0.5">{result.location || propLocation}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Time Window</div>
                  <div className="font-semibold text-foreground truncate mt-0.5">{result.recency || propRecency}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Articles Ingested</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{result.totalArticles} verified items</div>
                </div>
              </div>

              {/* Executive Summary Callout Box */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  1. Executive Summary
                </div>
                <div className="p-6 rounded-2xl border-l-4 border-l-emerald-500 border-foreground/10 bg-foreground/2 text-foreground font-serif text-base sm:text-lg leading-relaxed shadow-sm">
                  {result.executiveSummary}
                </div>
              </div>

              {/* Narrative Thematic Clusters */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-foreground" />
                  2. Key Narrative Clusters & Sector Drivers
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {result.themes.map((t, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-foreground/10 bg-background/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-foreground">{idx + 1}. {t.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
                          {t.count} articles
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.description || `Primary media cluster observed across monitored publications.`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Signals */}
              {result.risks.length > 0 && (
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    3. Risk Signals & Adverse Media Alerts
                  </div>
                  <div className="space-y-3">
                    {result.risks.map((r, idx) => {
                      const cfg = RISK_CONFIG[r.severity];
                      const Icon = cfg.icon;
                      return (
                        <div key={idx} className="p-4 rounded-2xl border border-foreground/10 bg-background/50 flex items-start gap-3.5">
                          <Icon className={`w-4 h-4 shrink-0 mt-1 ${cfg.color}`} />
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${cfg.bg} ${cfg.color}`}>
                                {cfg.label.toUpperCase()}
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground">{r.source}</span>
                            </div>
                            <div className="text-sm font-semibold text-foreground">{r.title}</div>
                            <div className="text-xs text-muted-foreground">{r.reason}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Strategic Actions */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  4. Recommended Strategic PR Actions
                </div>
                <div className="space-y-2.5">
                  {result.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-foreground/8 bg-foreground/2">
                      <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-mono font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground leading-relaxed pt-0.5">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cited Media Stories Table */}
              <div className="space-y-4">
                <div className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-foreground" />
                  5. Verified Media Citations
                </div>
                <div className="rounded-2xl border border-foreground/10 overflow-hidden divide-y divide-foreground/5">
                  {result.topStories.map((story, i) => (
                    <div key={i} className="p-4 flex items-center justify-between gap-4 hover:bg-foreground/2 transition-colors">
                      <div className="flex-1 min-w-0">
                        <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:underline flex items-center gap-1.5 truncate">
                          {story.title}
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{story.source}</span>
                          <span>·</span>
                          <span>{timeAgo(story.publishedAt)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {story.relevanceScore}/100
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground">Relevance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Notice */}
              <div className="pt-6 border-t border-foreground/10 text-center font-mono text-xs text-muted-foreground">
                Report generated by Optimus Intelligence Platform · Powered by Optimus AI
              </div>
            </div>
          )}

          {/* 2. INTERACTIVE ACCORDION VIEW */}
          {viewMode === "interactive" && (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Verified Articles", value: result.totalArticles, icon: FileText },
                  { label: "Positive Signals", value: result.sentiment.positive, icon: CheckCircle2, color: "text-emerald-500" },
                  { label: "Negative Signals", value: result.sentiment.negative, icon: TrendingDown, color: "text-red-500" },
                  { label: "Risk Alerts", value: result.risks.length, icon: ShieldAlert, color: result.risks.some(r => r.severity === "critical") ? "text-red-500" : "text-amber-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="p-4 rounded-xl border border-foreground/10 bg-card text-center">
                    <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color || "text-muted-foreground"}`} />
                    <div className="text-2xl font-display font-semibold">{value}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Executive Summary */}
              <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
                <button onClick={() => toggle("summary")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/2 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Executive Summary
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 ml-1">Optimus AI</span>
                  </div>
                  {expandedSection === "summary" ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedSection === "summary" && (
                  <div className="px-5 pb-5 border-t border-foreground/10 pt-4">
                    <p className="text-sm text-foreground leading-relaxed">{result.executiveSummary}</p>
                  </div>
                )}
              </div>

              {/* Top Stories */}
              <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
                <button onClick={() => toggle("stories")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/2 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <FileText className="w-4 h-4 text-foreground" />
                    Verified Citations & Stories ({result.topStories.length})
                  </div>
                  {expandedSection === "stories" ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedSection === "stories" && (
                  <div className="border-t border-foreground/10 divide-y divide-foreground/5">
                    {result.topStories.map((s, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4">
                        <span className="text-xs font-mono font-bold text-foreground/30 w-5 shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-foreground hover:underline flex items-start gap-1.5 group line-clamp-2">
                            {s.title}
                            <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                          <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-muted-foreground">
                            <span className="font-medium text-foreground">{s.source}</span>
                            <span>·</span>
                            <span>{timeAgo(s.publishedAt)}</span>
                            <span>·</span>
                            <span>Relevance: <strong>{s.relevanceScore}/100</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Themes */}
              {result.themes.length > 0 && (
                <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
                  <button onClick={() => toggle("themes")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/2 transition-colors">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <BarChart3 className="w-4 h-4 text-foreground" />
                      Key Narrative Clusters ({result.themes.length})
                    </div>
                    {expandedSection === "themes" ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedSection === "themes" && (
                    <div className="px-5 pb-5 border-t border-foreground/10 pt-4 grid sm:grid-cols-2 gap-3">
                      {result.themes.map((t, i) => (
                        <div key={i} className="p-3 rounded-xl border border-foreground/8 bg-background/50">
                          <div className="font-semibold text-sm text-foreground">{t.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-1">{t.count} articles</div>
                          {t.description && <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{t.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommended Actions */}
              <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden">
                <button onClick={() => toggle("actions")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/2 transition-colors">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Recommended Strategic Actions
                  </div>
                  {expandedSection === "actions" ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {expandedSection === "actions" && (
                  <div className="px-5 pb-5 border-t border-foreground/10 pt-4 space-y-2">
                    {result.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. RAW MARKDOWN VIEW */}
          {viewMode === "markdown" && (
            <div className="p-6 rounded-2xl border border-foreground/15 bg-black text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {result.markdown}
            </div>
          )}

          {/* Bottom Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl border border-foreground/10 bg-foreground/3">
            <div>
              <div className="text-sm font-semibold text-foreground">Optimus AI Intelligence Dossier Ready</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                Target: {result.query} · Domain: {result.topicDomain || propDomain} · Scope: {result.location || propLocation}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadDocx}
                disabled={downloadingDocx}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold font-mono transition-colors shadow-sm disabled:opacity-50"
              >
                {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                Download Word Document (.docx)
              </button>
              <button
                onClick={() => downloadMarkdown(result.markdown, result.query)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-foreground/15 text-xs font-semibold font-mono hover:bg-foreground/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .md
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty / pre-run state */}
      {!result && !loading && !error && (
        <div className="border border-dashed border-foreground/15 rounded-3xl p-12 text-center bg-card/40">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-emerald-500/50" />
          <div className="text-foreground font-semibold text-lg mb-1">Optimus AI Analyst Engine</div>
          <div className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
            Click below to generate a complete intelligence synthesis and downloadable Word document (.docx) for <strong className="text-foreground">{effectiveSubject}</strong> in <strong className="text-foreground">{propLocation}</strong> ({propRecency}).
          </div>
          <button
            onClick={runAgent}
            className="px-6 py-3 rounded-full bg-foreground text-background text-xs font-semibold font-mono hover:bg-foreground/85 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Analyze {effectiveSubject} Now
          </button>
        </div>
      )}
    </div>
  );
}
