"use client";

import { useState } from "react";
import { PieChart, DollarSign, TrendingUp, ShieldAlert, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BusinessImpactScoreView() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 14</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">Differentiator 14 </span>
          <span>•</span>
          <span className="text-foreground">Financial & PR ROI Quantification Model</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Business Impact Score Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Translates media coverage into actionable business metrics: Estimated Media Value (EMV), Brand Equity Shift, and Virality Risk.
        </p>
      </div>

      {/* Impact KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-2">
          <div className="text-xs font-mono text-muted-foreground">Estimated Media Value (EMV)</div>
          <div className="text-3xl font-display font-semibold text-emerald-500">$1,840,500</div>
          <div className="text-[10px] font-mono text-muted-foreground">Equivalent Ad Spend Value</div>
        </div>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-2">
          <div className="text-xs font-mono text-muted-foreground">Brand Equity Index</div>
          <div className="text-3xl font-display font-semibold text-foreground">+14.2 pts</div>
          <div className="text-[10px] font-mono text-muted-foreground">Tier 1 Press Sentiment Gain</div>
        </div>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-2">
          <div className="text-xs font-mono text-muted-foreground">Virality & Crisis Risk</div>
          <div className="text-3xl font-display font-semibold text-emerald-500">Low (4.2%)</div>
          <div className="text-[10px] font-mono text-muted-foreground">0 Threatening Viral Stories</div>
        </div>
        <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-2">
          <div className="text-xs font-mono text-muted-foreground">Executive Reputation Score</div>
          <div className="text-3xl font-display font-semibold text-foreground">96 / 100</div>
          <div className="text-[10px] font-mono text-muted-foreground">CEO & CTO Quote Coverage</div>
        </div>
      </div>
    </div>
  );
}
