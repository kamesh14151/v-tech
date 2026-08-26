"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Sliders, CheckCircle2, FileText, Eye, Sun, ArrowRight } from "lucide-react";

const features = [
  {
    number: "01",
    title: "Requirement 1 — Semantic Discovery 🧠",
    description: "Vector-based semantic search & media similarity engine. Finds relevant coverage and implicit stories beyond simple keyword boolean strings.",
    visual: "ai",
  },
  {
    number: "02",
    title: "Requirement 2 — Configurable Rule Engine ⚙️",
    description: "Build custom boolean, proximity, sentiment, domain, and entity rules with automated action triggers (SMS, Slack, tag crisis).",
    visual: "collab",
  },
  {
    number: "03",
    title: "Requirement 3 — Contextual Validation 🎯",
    description: "Sentence-level boundary parser determining if entity mentions represent focal subject matter, supporting context, or passing footnotes.",
    visual: "security",
  },
  {
    number: "04",
    title: "Requirement 4 — Smart Extraction 📰",
    description: "Paywall-resilient multi-pass clean text extraction pulling author, publish timestamp, quotes, media assets, and structured entities.",
    visual: "deploy",
  },
  {
    number: "05",
    title: "Innovation 1 — Company Intelligence Profile",
    description: "Dynamic entity knowledge graph connecting executive names, flagship products, brand aliases, and competitor tracking targets.",
    visual: "ai",
  },
  {
    number: "06",
    title: "Innovation 2 — Indirect Coverage Detector",
    description: "Detects unbranded coverage discussing product code-names, executive quotes, patents, or supply chain moves without explicit company tags.",
    visual: "collab",
  },
  {
    number: "07",
    title: "Innovation 7 — Personalized Morning Intelligence (MUST BUILD)",
    description: "Automated executive morning briefing generator summarizing top news, sentiment shifts, competitor moves, and audio digest narration.",
    visual: "security",
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
        return (
          <g key={i}>
            <line x1="100" y1="80" x2={100 + Math.cos(angle) * radius} y2={80 + Math.sin(angle) * radius} stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx={100 + Math.cos(angle) * radius} cy={80 + Math.sin(angle) * radius} r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function CollabVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="30" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="120" y="50" width="50" height="60" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="80" y1="80" x2="120" y2="80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
    </svg>
  );
}

function SecurityVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <path d="M 100 20 L 150 40 L 150 90 Q 150 130 100 145 Q 50 130 50 90 L 50 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "deploy": return <DeployVisual />;
    case "ai": return <AIVisual />;
    case "collab": return <CollabVisual />;
    case "security": return <SecurityVisual />;
    default: return <DeployVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-10 lg:py-14 border-b border-foreground/10">
        <div className="shrink-0">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>
        
        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl lg:text-3xl font-display mb-3 group-hover:translate-x-2 transition-transform duration-500 text-foreground font-semibold">
              {feature.title}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="w-40 h-32 text-foreground opacity-80">
              <AnimatedVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Core Architecture & Innovations
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Engineered for Precision PR.
            <br />
            <span className="text-muted-foreground">Built to replace legacy tools.</span>
          </h2>
        </div>

        <div>
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
