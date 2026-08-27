"use client";

import { useState } from "react";
import { Shield, CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EntityContextValidationView() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 13</span>
          <span>•</span>
          <span className="text-amber-500 font-bold">Differentiator 13 ️</span>
          <span>•</span>
          <span className="text-foreground">Deep Entity Sentence Classifier</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Entity Context Validation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parses sentence syntax to distinguish whether brand entities are focal subjects, executive quote sources, or off-hand footnotes.
        </p>
      </div>

      {/* Visual Demo Parser */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold">
          Sentence-Level Context Parsing Visualizer
        </h3>

        <div className="space-y-4 font-sans text-sm">
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex justify-between items-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Sentence 1 — Focal Subject Match (Weight 1.0)</span>
              <span>100% Subject Priority</span>
            </div>
            <p className="text-foreground font-medium">
              &ldquo;<mark className="bg-emerald-500/20 px-1 rounded">Acme Enterprise Robotics</mark> today announced the general availability of its next-generation Autonomous Industrial Platform.&rdquo;
            </p>
          </div>

          <div className="p-4 rounded-xl border border-foreground/10 bg-card space-y-2">
            <div className="flex justify-between items-center font-mono text-xs text-muted-foreground font-bold">
              <span>Sentence 2 — Executive Quote Source (Weight 0.9)</span>
              <span>Direct Quote Attribution</span>
            </div>
            <p className="text-foreground font-medium">
              &ldquo;Speaking at the launch event, CEO <mark className="bg-amber-500/20 px-1 rounded">Jane Doe</mark> emphasized the platform's ability to seamlessly integrate with legacy industrial equipment.&rdquo;
            </p>
          </div>

          <div className="p-4 rounded-xl border border-foreground/10 bg-muted/40 space-y-2">
            <div className="flex justify-between items-center font-mono text-xs text-muted-foreground">
              <span>Sentence 3 — Competitor Footnote Mention (Weight 0.1)</span>
              <span>Passing Reference (Filtered Out)</span>
            </div>
            <p className="text-muted-foreground">
              &ldquo;Traditional monitoring tools like legacy CisionOne systems struggle to parse deep context...&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
