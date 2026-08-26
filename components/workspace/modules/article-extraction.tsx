"use client";

import { useState } from "react";
import { FileText, Lock, Code, CheckCircle, ExternalLink, Sparkles, User, Calendar, Image as ImageIcon, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ArticleExtractionView() {
  const [viewMode, setViewMode] = useState<"parsed" | "json">("parsed");
  const [copied, setCopied] = useState(false);

  const sampleArticle = {
    title: "Enterprise Robotics Sector Surges as Acme AI Unveils Autonomous Industrial Platform",
    url: "https://techcrunch.com/2026/08/26/enterprise-robotics-acme-ai-platform-launch",
    author: "Sarah Jenkins",
    authorRole: "Senior Enterprise Tech Editor",
    publication: "TechCrunch",
    tier: "Tier 1 Media Outlet",
    domainAuthority: 94,
    publishedAt: "2026-08-26T14:30:00Z",
    paywallBypassed: true,
    paywallStatus: "Bypassed via Multi-Pass Extraction Engine",
    wordCount: 1420,
    sentimentScore: "+0.84 (Highly Positive)",
    primaryEntity: "Acme Enterprise Robotics",
    extractedQuotes: [
      {
        quote: "Our autonomous robotics platform reduces factory downtime by 40% while ensuring complete zero-trust SOC 2 security compliance across all edge nodes.",
        speaker: "Jane Doe",
        title: "CEO, Acme Enterprise Robotics",
      },
      {
        quote: "The integration of multi-modal AI into industrial hardware marks a structural inflection point for North American manufacturing.",
        speaker: "Robert Smith",
        title: "CTO, Acme Enterprise Robotics",
      },
    ],
    entitiesFound: [
      { name: "Acme Enterprise Robotics", type: "Organization", role: "Primary Focal Subject" },
      { name: "Jane Doe", type: "Person", role: "Executive Quote Source" },
      { name: "Robert Smith", type: "Person", role: "Executive Quote Source" },
      { name: "TitanX Bot", type: "Product", role: "Flagship Product Release" },
      { name: "Autonomous OS v4", type: "Software", role: "Software Layer" },
      { name: "CisionOne Benchmark", type: "Competitor", role: "PR Industry Context Mention" },
    ],
    cleanBodySnippet: `SAN FRANCISCO — Enterprise automation vendor Acme Enterprise Robotics today announced the general availability of its next-generation Autonomous Industrial Platform, setting a new benchmark for smart manufacturing and edge intelligence.

Speaking at the launch event, CEO Jane Doe emphasized the platform's ability to seamlessly integrate with legacy industrial equipment while deploying zero-trust security architecture. "Our autonomous robotics platform reduces factory downtime by 40% while ensuring complete zero-trust SOC 2 security compliance across all edge nodes," Doe stated.

The announcement comes amidst rapid consolidation in the industrial AI market, where traditional monitoring tools like legacy CisionOne and Brandwatch systems struggle to parse deep context from unstructured IoT and technical news releases.

According to CTO Robert Smith, "The integration of multi-modal AI into industrial hardware marks a structural inflection point for North American manufacturing." Industry analysts predict Acme's new TitanX Bot line will capture significant market share across automotive, aerospace, and semiconductor fabrication facilities over the next 18 months.`,
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleArticle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>Module 5</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">Requirement 4 📰</span>
            <span>•</span>
            <span className="text-foreground">Smart Paywall-Resilient Extraction Engine</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Smart Article Extraction & Parsing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            High-speed multi-pass clean text extractor with paywall bypass, quote identification, and entity boundary tagging.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-foreground/10 p-1 rounded-full bg-background font-mono text-xs">
          <button
            onClick={() => setViewMode("parsed")}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              viewMode === "parsed" ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Parsed Reader View
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              viewMode === "json" ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Raw JSON Output
          </button>
        </div>
      </div>

      {/* Main Extractor Card */}
      {viewMode === "parsed" ? (
        <div className="space-y-6">
          {/* Article Header & Metadata Card */}
          <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Paywall Bypassed
                </span>
                <span className="text-muted-foreground">Domain Auth: <strong className="text-foreground">{sampleArticle.domainAuthority} DA</strong></span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{sampleArticle.publication} ({sampleArticle.tier})</span>
              </div>

              <a href={sampleArticle.url} target="_blank" rel="noreferrer" className="text-foreground hover:underline flex items-center gap-1">
                Original Article URL <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <h2 className="text-2xl font-display font-semibold text-foreground leading-tight">
              {sampleArticle.title}
            </h2>

            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-foreground" />
                <span>Author: <strong className="text-foreground">{sampleArticle.author}</strong> ({sampleArticle.authorRole})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-foreground" />
                <span>Published: <strong className="text-foreground">Aug 26, 2026</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-foreground" />
                <span>Length: <strong className="text-foreground">{sampleArticle.wordCount} words</strong></span>
              </div>
            </div>
          </div>

          {/* Body & Quotes Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Extracted Text Body */}
            <div className="lg:col-span-2 p-8 rounded-2xl border border-foreground/10 bg-card space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Cleaned Full Text Output
              </h3>
              <div className="text-sm font-sans leading-relaxed text-foreground whitespace-pre-line space-y-4">
                {sampleArticle.cleanBodySnippet}
              </div>
            </div>

            {/* Extracted Quotes & Entities Side Panel */}
            <div className="space-y-6">
              {/* Quotes */}
              <div className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Extracted Executive Quotes
                </h3>

                <div className="space-y-3">
                  {sampleArticle.extractedQuotes.map((q, i) => (
                    <div key={i} className="p-4 rounded-xl border border-foreground/10 bg-background/50 text-xs font-sans space-y-2">
                      <p className="italic text-foreground font-medium">&ldquo;{q.quote}&rdquo;</p>
                      <div className="text-[11px] font-mono text-muted-foreground font-semibold">
                        — {q.speaker}, {q.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              <div className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-3 font-mono text-xs">
                <h3 className="uppercase tracking-wider text-muted-foreground font-bold">
                  Identified Named Entities ({sampleArticle.entitiesFound.length})
                </h3>

                <div className="space-y-2">
                  {sampleArticle.entitiesFound.map((ent, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-foreground/5">
                      <div>
                        <span className="font-bold text-foreground">{ent.name}</span>
                        <span className="block text-[10px] text-muted-foreground">{ent.role}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-foreground/10 text-[10px]">
                        {ent.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* JSON View */
        <div className="p-6 rounded-2xl border border-foreground/10 bg-muted/40 font-mono text-xs relative">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-foreground/10">
            <span className="text-muted-foreground">Structured JSON Extraction Payload</span>
            <Button size="sm" variant="outline" onClick={handleCopyJson} className="rounded-full text-xs font-mono gap-2">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
          </div>
          <pre className="overflow-x-auto p-4 rounded-xl bg-background border border-foreground/10 text-foreground">
            {JSON.stringify(sampleArticle, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
