"use client";

import { useState } from "react";
import { Building2, User, Package, Check, ArrowRight, ArrowLeft, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompanyOnboardingView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "Acme Enterprise Robotics",
    ticker: "ACME",
    industry: "Autonomous Robotics & AI Infrastructure",
    executives: "Jane Doe (CEO), Robert Smith (CTO), Marcus Vance (CFO)",
    products: "TitanX Bot, Autonomous OS v4, CyberCore Edge",
    aliases: "Acme Robotics, AcmeAI, Acme Corp",
    competitors: "CisionOne Targets, Brandwatch Competitor A, Talkwalker Competitor B, Muck Rack Client C",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 2</span>
          <span>•</span>
          <span className="text-foreground">Company Onboarding Wizard</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Enterprise Entity Setup & Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your enterprise intelligence profile to power semantic vector discovery, indirect coverage detection, and contextual validation.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-4 font-mono text-xs">
        {[
          { num: 1, label: "Entity Profile" },
          { num: 2, label: "Execs & Products" },
          { num: 3, label: "Competitor Benchmarks" },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              step === s.num ? "text-foreground font-bold" : step > s.num ? "text-emerald-500" : "text-muted-foreground"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num
                  ? "bg-foreground text-background"
                  : step > s.num
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="p-8 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-sans font-semibold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-foreground" /> Primary Enterprise Info
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1">Stock Ticker Symbol</label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">Industry Sector</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">Brand Aliases & Trade Names (comma separated)</label>
              <input
                type="text"
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-sans font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-foreground" /> Key Executives & Products
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">
                C-Suite Executives & Key Spokespeople (Powers Indirect Coverage Detection)
              </label>
              <textarea
                rows={3}
                value={formData.executives}
                onChange={(e) => setFormData({ ...formData, executives: e.target.value })}
                className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">
                Flagship Products, Code-Names & Services
              </label>
              <textarea
                rows={3}
                value={formData.products}
                onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-sans font-semibold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-foreground" /> Competitors & Media Outlets
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1">
                Competitors & Media Database Benchmarks (CisionOne, Brandwatch, Talkwalker, Muck Rack comparison)
              </label>
              <textarea
                rows={3}
                value={formData.competitors}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                className="w-full px-4 py-2 text-sm font-sans rounded-xl border border-foreground/10 bg-background"
              />
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-mono text-emerald-600 dark:text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Ready to Build Intelligence Knowledge Graph
              </div>
              <p>Entity relations will be mapped for automatic semantic vector discovery & gap detection.</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 border-t border-foreground/10 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-full text-xs font-mono">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-mono px-6">
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onComplete} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-full text-xs font-mono px-6">
              Save Profile & Launch Platform <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
