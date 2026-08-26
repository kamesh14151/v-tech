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
  Globe,
  Cpu,
  ShieldAlert,
  Share2
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
import { AiVisibilityDashboardView } from "./modules/ai-visibility-dashboard";
import { BrandRiskScoreView } from "./modules/brand-risk-score";
import { NarrativeTrackingView } from "./modules/narrative-tracking";
import { PressReleaseDistributionView } from "./modules/press-release-distribution";
import { SocialListeningView } from "./modules/social-listening";
import { ShareableReportsView } from "./modules/shareable-reports";

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
  | "outreach"
  | "ai-visibility"
  | "brand-risk"
  | "narrative"
  | "press-release"
  | "social-listening"
  | "shareable-reports";

interface ModuleConfig {
  id: WorkspaceModuleId;
  name: string;
  category: "Overview & AI Visibility" | "Media Monitoring & Listening" | "AI Risk & Narrative Intelligence" | "Automations & Rules" | "PR Wire & Journalist Database" | "Executive Briefings & Reports";
  icon: any;
}

const MODULES: ModuleConfig[] = [
  // Overview & AI Visibility
  { id: "dashboard", name: "Executive Command Dashboard", category: "Overview & AI Visibility", icon: Gauge },
  { id: "ai-visibility", name: "AI Visibility Dashboard (Trajaan AI)", category: "Overview & AI Visibility", icon: Cpu },
  { id: "impact", name: "Business Impact Score", category: "Overview & AI Visibility", icon: PieChart },
  { id: "login", name: "Auth & Workspace Switcher", category: "Overview & AI Visibility", icon: UserCheck },
  { id: "onboarding", name: "Company Setup Wizard", category: "Overview & AI Visibility", icon: Building2 },

  // Media Monitoring & Listening
  { id: "collection", name: "News Collection Pipeline", category: "Media Monitoring & Listening", icon: Newspaper },
  { id: "extraction", name: "Smart Paywall Extraction", category: "Media Monitoring & Listening", icon: FileText },
  { id: "semantic", name: "Semantic Vector Discovery", category: "Media Monitoring & Listening", icon: Brain },
  { id: "social-listening", name: "Social Listening (Brandwatch)", category: "Media Monitoring & Listening", icon: Share2 },

  // AI Risk & Narrative Intelligence
  { id: "brand-risk", name: "Brand Risk & Safety Scanner", category: "AI Risk & Narrative Intelligence", icon: ShieldAlert },
  { id: "narrative", name: "Narrative Tracking Engine", category: "AI Risk & Narrative Intelligence", icon: Sparkles },
  { id: "profile", name: "Company Intelligence Profile", category: "AI Risk & Narrative Intelligence", icon: Layers },
  { id: "validation", name: "Contextual Boundary Validation", category: "AI Risk & Narrative Intelligence", icon: CheckCircle2 },
  { id: "indirect", name: "Indirect Coverage Detector", category: "AI Risk & Narrative Intelligence", icon: Eye },
  { id: "entity-context", name: "Entity Context Boundaries", category: "AI Risk & Narrative Intelligence", icon: Shield },
  { id: "relevance", name: "Explainable Relevance Audit", category: "AI Risk & Narrative Intelligence", icon: TrendingUp },

  // Automations & Rules
  { id: "rules", name: "Configurable Rule Engine", category: "Automations & Rules", icon: Sliders },

  // PR Wire & Journalist Database
  { id: "press-release", name: "Press Release Builder & Wire", category: "PR Wire & Journalist Database", icon: Send },
  { id: "outreach", name: "Journalist CRM & Media DB", category: "PR Wire & Journalist Database", icon: Users },
  { id: "gap", name: "Coverage Gap Detector", category: "PR Wire & Journalist Database", icon: Zap },

  // Executive Briefings & Reports
  { id: "morning", name: "Morning Intelligence Briefing", category: "Executive Briefings & Reports", icon: Sun },
  { id: "shareable-reports", name: "Shareable Live C-Suite Reports", category: "Executive Briefings & Reports", icon: Globe },
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
      case "ai-visibility":
        return <AiVisibilityDashboardView />;
      case "brand-risk":
        return <BrandRiskScoreView />;
      case "narrative":
        return <NarrativeTrackingView />;
      case "press-release":
        return <PressReleaseDistributionView />;
      case "social-listening":
        return <SocialListeningView />;
      case "shareable-reports":
        return <ShareableReportsView />;
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
              placeholder="Search global news, AI queries, contacts..."
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
            {(["Overview & AI Visibility", "Media Monitoring & Listening", "AI Risk & Narrative Intelligence", "Automations & Rules", "PR Wire & Journalist Database", "Executive Briefings & Reports"] as const).map((category) => (
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
              <span>CisionOne Full AI Suite</span>
              <span className="text-emerald-500 font-bold">100% Active</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80">
              Trajaan AI • Brand Risk • Brandwatch • PR Newswire
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
