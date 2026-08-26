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
  Bell,
  ChevronDown,
  Layers,
  Sparkles,
  Users,
  Send,
  Globe
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
import { MediaOutreachCrmView } from "./modules/media-outreach-crm";

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
  | "morning"
  | "outreach";

interface ModuleConfig {
  id: WorkspaceModuleId;
  name: string;
  category: "Overview" | "Media Monitoring" | "Intelligence & Analytics" | "Automations" | "PR Outreach & Reports";
  icon: any;
}

const MODULES: ModuleConfig[] = [
  // Overview
  { id: "dashboard", name: "Executive Dashboard", category: "Overview", icon: Gauge },
  { id: "impact", name: "Business Impact Score", category: "Overview", icon: PieChart },
  { id: "login", name: "Workspace & Auth", category: "Overview", icon: UserCheck },
  { id: "onboarding", name: "Company Setup Wizard", category: "Overview", icon: Building2 },

  // Media Monitoring
  { id: "collection", name: "News Collection Feed", category: "Media Monitoring", icon: Newspaper },
  { id: "extraction", name: "Smart Paywall Extraction", category: "Media Monitoring", icon: FileText },
  { id: "semantic", name: "Semantic Vector Discovery", category: "Media Monitoring", icon: Brain },

  // Intelligence & Analytics
  { id: "profile", name: "Company Intelligence Profile", category: "Intelligence & Analytics", icon: Layers },
  { id: "validation", name: "Contextual Boundary Validation", category: "Intelligence & Analytics", icon: CheckCircle2 },
  { id: "indirect", name: "Indirect Coverage Detector", category: "Intelligence & Analytics", icon: Eye },
  { id: "entity-context", name: "Entity Context Boundaries", category: "Intelligence & Analytics", icon: Shield },
  { id: "relevance", name: "Explainable Relevance Audit", category: "Intelligence & Analytics", icon: TrendingUp },

  // Automations
  { id: "rules", name: "Configurable Rule Engine", category: "Automations", icon: Sliders },

  // PR Outreach & Reports
  { id: "morning", name: "Morning Intelligence Briefing", category: "PR Outreach & Reports", icon: Sun },
  { id: "outreach", name: "Journalist CRM & Database", category: "PR Outreach & Reports", icon: Users },
  { id: "gap", name: "Coverage Gap Detector", category: "PR Outreach & Reports", icon: Zap },
];

export function WorkspaceLayout({ onClose }: { onClose?: () => void }) {
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
      case "outreach":
        return <MediaOutreachCrmView onNavigate={setActiveModule} />;
      default:
        return <ExecutiveDashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden noise-overlay">
      {/* Clean CisionOne Style Navigation Header */}
      <header className="h-16 border-b border-foreground/10 bg-background/90 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveModule("dashboard")}>
            <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center font-display font-bold text-base shadow-sm">
              O
            </div>
            <span className="font-display font-semibold tracking-tight text-xl">Optimus Enterprise</span>
          </div>

          <div className="h-4 w-px bg-foreground/10 hidden sm:block" />

          {/* Quick Switcher */}
          <div className="hidden md:flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setActiveModule("login")}
              className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 px-3 py-1.5 rounded-full border border-foreground/10 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{currentWorkspace}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search global news, entities, media contacts..."
              className="pl-9 pr-4 py-1.5 text-xs font-mono rounded-full border border-foreground/10 bg-background/50 focus:bg-background focus:outline-none w-64 lg:w-80 transition-all"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setActiveModule("morning")}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-mono text-xs gap-2 px-4 shadow-sm"
          >
            <Sun className="w-3.5 h-3.5 fill-current" />
            <span>Morning Briefing</span>
          </Button>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full text-xs font-mono">
              Back to Site
            </Button>
          )}
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Clean Sidebar */}
        <aside className="w-64 border-r border-foreground/10 bg-muted/20 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {(["Overview", "Media Monitoring", "Intelligence & Analytics", "Automations", "PR Outreach & Reports"] as const).map((category) => (
              <div key={category} className="space-y-1">
                <div className="px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {category}
                </div>
                {MODULES.filter((m) => m.category === category).map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left font-sans ${
                        isActive
                          ? "bg-foreground text-background font-medium shadow-sm"
                          : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                      <span className="truncate">{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-foreground/10 bg-background/40 font-mono text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between items-center text-foreground font-semibold">
              <span>Competitor Engine Active</span>
              <span className="text-emerald-500 font-bold">100%</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80">
              CisionOne • Brandwatch • Talkwalker • Muck Rack
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
