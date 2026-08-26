"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
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
  Share2,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  image: string;
}

// Import all module views
import { LoginWorkspaceView } from "./modules/login-workspace";
import { CompanyOnboardingView } from "./modules/company-onboarding";
import { CompanyIntelligenceProfileView } from "./modules/company-intelligence-profile";
import { ExecutiveDashboardView } from "./modules/executive-dashboard";
import { RuleEngineView } from "./modules/rule-engine";
import { MorningIntelligenceView } from "./modules/morning-intelligence";
import { NarrativeTrackingView } from "./modules/narrative-tracking";
import { ShareableReportsView } from "./modules/shareable-reports";
import { IntelligenceFeedView } from "./modules/intelligence-feed";
import { RiskRadarView } from "./modules/risk-radar";
import { CompetitiveIntelligenceView } from "./modules/competitive-intelligence";

export type WorkspaceModuleId =
  | "dashboard"
  | "feed"
  | "discovery"
  | "competitors"
  | "media-social"
  | "risk"
  | "narrative"
  | "morning"
  | "shareable-reports"
  | "rules"
  | "login"
  | "onboarding"
  | "profile";

interface ModuleConfig {
  id: WorkspaceModuleId;
  name: string;
  category: "Overview" | "Intelligence" | "Monitoring" | "Risk & Opportunity" | "Reports" | "Automation" | "Admin";
  icon: any;
}

const MODULES: ModuleConfig[] = [
  // Overview
  { id: "dashboard", name: "Executive Dashboard", category: "Overview", icon: Gauge },

  // Intelligence
  { id: "feed", name: "Intelligence Feed", category: "Intelligence", icon: Newspaper },
  { id: "discovery", name: "Search & Discovery", category: "Intelligence", icon: Search },

  // Monitoring
  { id: "competitors", name: "Competitors", category: "Monitoring", icon: Building2 },
  { id: "media-social", name: "Media & Social", category: "Monitoring", icon: Globe },

  // Risk & Opportunity
  { id: "risk", name: "Risk Radar", category: "Risk & Opportunity", icon: ShieldAlert },
  { id: "narrative", name: "Narrative Tracking", category: "Risk & Opportunity", icon: Sparkles },

  // Reports
  { id: "morning", name: "Executive Briefings", category: "Reports", icon: Sun },
  { id: "shareable-reports", name: "Reports", category: "Reports", icon: FileText },

  // Automation
  { id: "rules", name: "Rules & Alerts", category: "Automation", icon: Sliders },

  // Admin
  { id: "login", name: "Workspace", category: "Admin", icon: Layers },
  { id: "profile", name: "Company Settings", category: "Admin", icon: UserCheck },
];

export function WorkspaceLayout({
  onClose,
  user,
  isNewUser = false,
}: {
  onClose?: () => void;
  user?: WorkspaceUser;
  isNewUser?: boolean;
}) {
  const [activeModule, setActiveModule] = useState<WorkspaceModuleId>(
    isNewUser ? "onboarding" : "dashboard"
  );
  const [currentWorkspace, setCurrentWorkspace] = useState(
    user?.name ? `${user.name}'s Workspace` : "Global Enterprise Workspace"
  );
  const [currentRole, setCurrentRole] = useState("VP of Communications");

  const renderActiveView = () => {
    switch (activeModule) {
      case "dashboard":
        return <ExecutiveDashboardView onNavigate={setActiveModule} />;
      case "feed":
      case "discovery":
      case "media-social":
        return <IntelligenceFeedView />;
      case "competitors":
        return <CompetitiveIntelligenceView />;
      case "risk":
        return <RiskRadarView />;
      case "narrative":
        return <NarrativeTrackingView />;
      case "morning":
        return <MorningIntelligenceView />;
      case "shareable-reports":
        return <ShareableReportsView />;
      case "rules":
        return <RuleEngineView />;
      case "login":
        return <LoginWorkspaceView currentWorkspace={currentWorkspace} setCurrentWorkspace={setCurrentWorkspace} currentRole={currentRole} setCurrentRole={setCurrentRole} onNavigate={setActiveModule} />;
      case "onboarding":
        return <CompanyOnboardingView onComplete={() => setActiveModule("profile")} />;
      case "profile":
        return <CompanyIntelligenceProfileView onNavigate={setActiveModule} />;
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

          {/* Workspace Switcher */}
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

          {/* User Avatar & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-full pl-1 pr-3 py-1">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-foreground/20 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-mono text-foreground/80 hidden md:block">{user.name?.split(" ")[0]}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-1.5 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : onClose && (
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
            {(["Overview", "Intelligence", "Monitoring", "Risk & Opportunity", "Reports", "Automation", "Admin"] as const).map((category) => (
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
              <span>Optimus Platform</span>
              <span className="text-emerald-500 font-bold">Operational</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80">
              Intelligence Pipeline Active
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
