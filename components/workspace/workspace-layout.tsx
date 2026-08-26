"use client";

import { useState } from "react";
import {
  Building2,
  Newspaper,
  Brain,
  Sliders,
  CheckCircle2,
  Gauge,
  TrendingUp,
  Sun,
  Shield,
  Search,
  Eye,
  FileText,
  PieChart,
  UserCheck,
  Zap,
  ArrowLeft,
  Bell,
  ChevronDown,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import all module views
import { LoginWorkspaceView } from "./modules/login-workspace";
import { CompanyOnboardingView } from "./modules/company-onboarding";
import { CompanyIntelligenceProfileView } from "./modules/company-intelligence-profile";
import { NewsCollectionView } from "./modules/news-collection";
import { ArticleExtractionView } from "./modules/article-extraction";
import { SemanticDiscoveryView } from "./modules/semantic-discovery";
import { ContextualValidationView } from "./modules/contextual-validation";
import { RuleEngineView } from "./modules/rule-engine";
import { RelevanceScoringView } from "./modules/relevance-scoring";
import { ExecutiveDashboardView } from "./modules/executive-dashboard";
import { IndirectCoverageDetectorView } from "./modules/indirect-coverage-detector";
import { EntityContextValidationView } from "./modules/entity-context-validation";
import { BusinessImpactScoreView } from "./modules/business-impact-score";
import { CoverageGapDetectorView } from "./modules/coverage-gap-detector";
import { MorningIntelligenceView } from "./modules/morning-intelligence";

export type WorkspaceModuleId =
  | "login"
  | "onboarding"
  | "profile"
  | "collection"
  | "extraction"
  | "semantic"
  | "validation"
  | "rules"
  | "relevance"
  | "dashboard"
  | "indirect"
  | "entity-context"
  | "impact"
  | "gap"
  | "morning";

interface ModuleConfig {
  id: WorkspaceModuleId;
  name: string;
  badge?: string;
  category: "Core Flow" | "Requirements & Engine" | "Differentiators & Innovations";
  icon: any;
}

const MODULES: ModuleConfig[] = [
  // Core Flow
  { id: "dashboard", name: "10. Executive Dashboard", category: "Core Flow", icon: Gauge },
  { id: "login", name: "1. Login & Workspace Switcher", category: "Core Flow", icon: UserCheck },
  { id: "onboarding", name: "2. Company Onboarding", category: "Core Flow", icon: Building2 },
  { id: "profile", name: "3. Company Intelligence Profile", badge: "Inno 1", category: "Core Flow", icon: Layers },
  { id: "collection", name: "4. News Collection Pipeline", category: "Core Flow", icon: Newspaper },

  // Requirements & Engine
  { id: "extraction", name: "5. Smart Article Extraction", badge: "Req 4", category: "Requirements & Engine", icon: FileText },
  { id: "semantic", name: "6. Semantic Discovery", badge: "Req 1", category: "Requirements & Engine", icon: Brain },
  { id: "validation", name: "7. Contextual Validation", badge: "Req 3", category: "Requirements & Engine", icon: CheckCircle2 },
  { id: "rules", name: "8. Configurable Rule Engine", badge: "Req 2", category: "Requirements & Engine", icon: Sliders },
  { id: "relevance", name: "9. Priority & Relevance Scoring", category: "Requirements & Engine", icon: TrendingUp },

  // Differentiators & Innovations
  { id: "morning", name: "Morning Intelligence Briefing", badge: "MUST BUILD", category: "Differentiators & Innovations", icon: Sun },
  { id: "indirect", name: "11. Indirect Coverage Detector", badge: "Diff 11", category: "Differentiators & Innovations", icon: Eye },
  { id: "entity-context", name: "13. Entity Context Validation", badge: "Diff 13", category: "Differentiators & Innovations", icon: Shield },
  { id: "impact", name: "14. Business Impact Score", badge: "Diff 14", category: "Differentiators & Innovations", icon: PieChart },
  { id: "gap", name: "15. Coverage Gap Detector", badge: "Diff 15", category: "Differentiators & Innovations", icon: Zap },
];

export function WorkspaceLayout({ onClose }: { onClose: () => void }) {
  const [activeModule, setActiveModule] = useState<WorkspaceModuleId>("dashboard");
  const [currentWorkspace, setCurrentWorkspace] = useState("Global Enterprise Workspace");
  const [currentRole, setCurrentRole] = useState("VP of Global Communications");

  const renderActiveView = () => {
    switch (activeModule) {
      case "login":
        return <LoginWorkspaceView currentWorkspace={currentWorkspace} setCurrentWorkspace={setCurrentWorkspace} currentRole={currentRole} setCurrentRole={setCurrentRole} onNavigate={setActiveModule} />;
      case "onboarding":
        return <CompanyOnboardingView onComplete={() => setActiveModule("profile")} />;
      case "profile":
        return <CompanyIntelligenceProfileView onNavigate={setActiveModule} />;
      case "collection":
        return <NewsCollectionView onNavigate={setActiveModule} />;
      case "extraction":
        return <ArticleExtractionView />;
      case "semantic":
        return <SemanticDiscoveryView />;
      case "validation":
        return <ContextualValidationView />;
      case "rules":
        return <RuleEngineView />;
      case "relevance":
        return <RelevanceScoringView />;
      case "dashboard":
        return <ExecutiveDashboardView onNavigate={setActiveModule} />;
      case "indirect":
        return <IndirectCoverageDetectorView />;
      case "entity-context":
        return <EntityContextValidationView />;
      case "impact":
        return <BusinessImpactScoreView />;
      case "gap":
        return <CoverageGapDetectorView />;
      case "morning":
        return <MorningIntelligenceView />;
      default:
        return <ExecutiveDashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden noise-overlay">
      {/* Workspace Navigation Bar */}
      <header className="h-16 border-b border-foreground/10 bg-background/90 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground gap-2 rounded-full font-mono text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Workspace
          </Button>

          <div className="h-4 w-px bg-foreground/10" />

          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center font-display font-bold text-sm">
              O
            </div>
            <span className="font-display font-semibold tracking-tight text-lg">Optimus Intelligence</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-foreground/10 text-foreground/80 border border-foreground/10">
              v2.5 Enterprise
            </span>
          </div>
        </div>

        {/* Center: Quick Switcher */}
        <div className="hidden md:flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/10">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground font-medium">{currentWorkspace}</span>
          </div>
          <div className="flex items-center gap-2 bg-foreground/5 px-3 py-1.5 rounded-full border border-foreground/10">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{currentRole}</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search entities, rules, articles..."
              className="pl-9 pr-4 py-1.5 text-xs font-mono rounded-full border border-foreground/10 bg-background/50 focus:bg-background focus:outline-none w-48 lg:w-64 transition-all"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModule("morning")}
            className="rounded-full gap-2 border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-mono"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Morning Intelligence</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-72 border-r border-foreground/10 bg-muted/20 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {(["Core Flow", "Requirements & Engine", "Differentiators & Innovations"] as const).map((category) => (
              <div key={category} className="space-y-1.5">
                <div className="px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                  <span>{category}</span>
                </div>
                {MODULES.filter((m) => m.category === category).map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                        isActive
                          ? "bg-foreground text-background font-medium shadow-sm"
                          : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span className="truncate">{mod.name}</span>
                      </div>
                      {mod.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                            isActive
                              ? "bg-background/20 text-background"
                              : mod.badge === "MUST BUILD"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : "bg-foreground/10 text-muted-foreground"
                          }`}
                        >
                          {mod.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-foreground/10 bg-background/40 font-mono text-[11px] text-muted-foreground space-y-2">
            <div className="flex justify-between items-center">
              <span>Competitors Benchmarked</span>
              <span className="text-emerald-500 font-bold">4/4 Active</span>
            </div>
            <div className="text-[10px] text-muted-foreground/70">
              CisionOne • Brandwatch • Talkwalker • Muck Rack
            </div>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
