"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Sliders, CheckCircle2, FileText, Sparkles, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    number: "01",
    title: "Semantic Discovery & Synonym Expansion",
    description: "Recovers 60% of coverage that rigid keyword search misses. Uses contextual expansion to identify articles when journalists use synonyms or jargon instead of exact client names (e.g. 'Fintech unicorn' or 'Prosus payments firm' instead of 'PayU').",
    visual: "ai",
  },
  {
    number: "02",
    title: "Contextual Validation & False Positive Elimination",
    description: "Kills 85% of junk alerts using LLM-based sentence disambiguation. Validates whether 'Apple' refers to the tech company or fruit orchards, 'Amazon' to AWS or the rainforest, and 'Reliance' to the conglomerate or political self-reliance.",
    visual: "security",
  },
  {
    number: "03",
    title: "Configurable Business Rule Engine",
    description: "Empowers PR and intelligence teams to enforce hard business logic: Geography (India + APAC, NA, EU), Domain Authority Tiering (ET, Mint, TechCrunch > random blogs), and strict 24-hour Recency Windows.",
    visual: "collab",
  },
  {
    number: "04",
    title: "Smart Clean Extraction & Paywall Parsing",
    description: "Multi-pass clean text extraction pulling author, publish timestamp, executive quotes, structured entities, and clean article body even from JS-heavy sites without messy HTML noise.",
    visual: "deploy",
  },
  {
    number: "05",
    title: "Autonomous AI Intelligence Agent & Reports",
    description: "Single-click autonomous multi-stage analyst agent powered by Optimus AI that clusters themes, evaluates risk signals, generates executive summaries, and exports downloadable Markdown reports.",
    visual: "ai",
  },
];

function DeployVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <defs>
        <clipPath id="deployClip">
          <rect x="30" y="20" width="140" height="120" rx="4" />
        </clipPath>
      </defs>
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <g clipPath="url(#deployClip)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x="40"
            y={35 + i * 16}
            width="120"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.15"
          >
            <animate attributeName="opacity" values="0.15;0.8;0.15" dur="2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
          </rect>
        ))}
      </g>
    </svg>
  );
}

function AIVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <circle cx="100" cy="80" r="12" fill="currentColor">
        <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
      </circle>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const radius = 50;
        const xCoord = Number((100 + Math.cos(angle) * radius).toFixed(4));
        const yCoord = Number((80 + Math.sin(angle) * radius).toFixed(4));
        return (
          <g key={i}>
            <line
              x1="100"
              y1="80"
              x2={xCoord}
              y2={yCoord}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.5"
            />
            <circle
              cx={xCoord}
              cy={yCoord}
              r="6"
              fill="currentColor"
              opacity="0.7"
            />
          </g>
        );
      })}
    </svg>
  );
}

function CollabVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="40" y="40" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="110" y="70" width="50" height="50" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M90 65 L110 95" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
        <animate attributeName="stroke-dashoffset" values="0;8" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function SecurityVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <path
        d="M100 30 L140 50 L140 90 C140 120 100 135 100 135 C100 135 60 120 60 90 L60 50 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="100" cy="80" r="10" fill="currentColor" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const getVisual = (type: string) => {
    switch (type) {
      case "ai":
        return <AIVisual />;
      case "collab":
        return <CollabVisual />;
      case "security":
        return <SecurityVisual />;
      case "deploy":
        return <DeployVisual />;
      default:
        return <AIVisual />;
    }
  };

  return (
    <section ref={sectionRef} id="features" className="relative py-24 lg:py-32 border-t border-foreground/10 bg-background/50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div className="mb-20 max-w-3xl">
          <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest block mb-4">
            Core Automation Architecture
          </span>
          <h2 className="text-4xl lg:text-6xl font-display tracking-tight leading-[1.05]">
            Engineered to Solve the Core Flaws of Keyword Alerts
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Move beyond brittle string matching to intent-aware media discovery with human-like contextual comprehension and configurable business rules.
          </p>
        </div>

        {/* Feature list */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Left: Feature buttons */}
          <div className="lg:col-span-7 space-y-4">
            {features.map((feature, index) => (
              <div
                key={feature.number}
                onClick={() => setActiveFeature(index)}
                className={`p-6 lg:p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  activeFeature === index
                    ? "bg-foreground/5 border-foreground/30 shadow-sm"
                    : "border-foreground/10 hover:border-foreground/20 bg-background/40"
                }`}
              >
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="font-mono text-sm text-emerald-500 font-bold">{feature.number}</span>
                  <h3 className="text-xl font-display font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Visual preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="aspect-[4/3] rounded-3xl border border-foreground/15 bg-card/60 backdrop-blur-xl p-8 flex items-center justify-center text-foreground">
              {getVisual(features[activeFeature].visual)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
