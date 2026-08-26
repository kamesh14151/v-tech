"use client";

import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, ShieldCheck, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareableReportsView() {
  const [copied, setCopied] = useState(false);
  const [reportUrl] = useState("https://optimus-pr.com/reports/live/c-suite-q3-briefing-8492");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span className="text-foreground font-bold">CisionOne Reporting Feature</span>
            <span>•</span>
            <span className="text-foreground">Password-Free C-Suite Portal</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Shareable Live Interactive Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate secure live report links to share interactive PR dashboards and media metrics with executives and clients without requiring paid logins.
          </p>
        </div>

        <Button onClick={handleCopyLink} className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-mono text-xs gap-2 px-6 shadow-sm">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Link Copied!" : "Copy Shareable Link"}
        </Button>
      </div>

      {/* Share Link Card */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active Shareable C-Suite Dashboard Link:</span>
          <span className="text-emerald-500 font-bold">✓ Live Interactive Link Active</span>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            readOnly
            value={reportUrl}
            className="flex-1 px-4 py-3 text-sm font-mono rounded-xl border border-foreground/10 bg-background"
          />
          <Button onClick={handleCopyLink} variant="outline" className="rounded-xl px-6">
            Copy Link
          </Button>
        </div>
      </div>

      {/* Executive Report Portal Preview */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-card space-y-6">
        <div className="flex justify-between items-start border-b border-foreground/10 pb-4">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase">Executive Preview Portal</span>
            <h3 className="text-2xl font-display font-semibold text-foreground mt-1">
              Acme Q3 PR & Media Intelligence Executive Report
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-mono text-xs font-bold border border-emerald-500/20">
            No Paid Login Required
          </span>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl border border-foreground/10 bg-background/50">
            <div className="text-muted-foreground">Total Impressions</div>
            <div className="text-2xl font-display font-semibold text-foreground mt-1">42.8 Million</div>
          </div>
          <div className="p-4 rounded-xl border border-foreground/10 bg-background/50">
            <div className="text-muted-foreground">Share of Voice</div>
            <div className="text-2xl font-display font-semibold text-foreground mt-1">48.2% (Leader)</div>
          </div>
          <div className="p-4 rounded-xl border border-foreground/10 bg-background/50">
            <div className="text-muted-foreground">Estimated Media Value</div>
            <div className="text-2xl font-display font-semibold text-emerald-500 mt-1">$1.84 Million</div>
          </div>
        </div>
      </div>
    </div>
  );
}
