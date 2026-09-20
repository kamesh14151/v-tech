"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, signIn, useSession } from "next-auth/react";
import {
  Gauge, Search, Sparkles, LogOut, X,
  Globe, ChevronDown, Check, Settings, Trophy, Clock,
  Mail, Sliders, Menu, GitBranch, Layers, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceUser { id: string; name: string; email: string; image: string }

import { ExecutiveDashboardView } from "./modules/executive-dashboard";
import { RuleEngineView } from "./modules/rule-engine";
import { AccountSettingsView } from "./modules/account-settings";
import { PipelineMonitorView } from "./modules/pipeline-monitor";
import { StoriesDashboardView } from "./modules/stories-dashboard";
import { AgentObservabilityView } from "./modules/agent-observability";

export type WorkspaceModuleId =
  | "dashboard"
  | "pipeline"
  | "stories"
  | "observability"
  | "rules"
  | "settings";

interface ModuleConfig {
  id: WorkspaceModuleId;
  name: string;
  category: "Intelligence & Overview" | "AI Pipeline" | "Automation & Settings";
  icon: any;
  badge?: string;
}

const MODULES: ModuleConfig[] = [
  { id: "dashboard",     name: "Executive Dashboard",  category: "Intelligence & Overview", icon: Gauge,      badge: "Live" },
  { id: "stories",       name: "Stories Dashboard",    category: "AI Pipeline",            icon: Layers,     badge: "New" },
  { id: "pipeline",      name: "Pipeline Monitor",     category: "AI Pipeline",            icon: GitBranch,  badge: "New" },
  { id: "observability", name: "Agent Observability",  category: "AI Pipeline",            icon: Activity,   badge: "New" },
  { id: "rules",         name: "Morning Briefing Rules", category: "Automation & Settings", icon: Sliders,    badge: "Gmail" },
  { id: "settings",      name: "Discovery & Scope Settings", category: "Automation & Settings", icon: Settings },
];

const CATEGORIES = [
  "Intelligence & Overview",
  "AI Pipeline",
  "Automation & Settings",
] as const;

const TOPIC_DOMAIN_OPTIONS = [
  {
    name: "Cricket & Sports",
    desc: "IPL, BCCI, ICC tournaments, athlete transfers, and championship news",
    emoji: "🏏",
  },
  {
    name: "Fintech & Banking",
    desc: "UPI, PayU, Paytm, RBI compliance, payment gateways, and digital banking",
    emoji: "💳",
  },
  {
    name: "IT Companies & Tech",
    desc: "TCS, Infosys, Wipro, Google, Microsoft, AI models, and cloud infrastructure",
    emoji: "💻",
  },
  {
    name: "Automotive & Electric Vehicles",
    desc: "Tesla, Tata Motors, EV batteries, autonomous vehicles, and supply chains",
    emoji: "🚗",
  },
  {
    name: "Cinema & Entertainment",
    desc: "Kollywood, Bollywood, OTT releases, box office collections, and studios",
    emoji: "🎬",
  },
  {
    name: "Healthcare & Biotech",
    desc: "Pharma manufacturing, clinical trials, FDA approvals, and medical AI",
    emoji: "🏥",
  },
];

const QUICK_LOCATIONS = [
  "Within Tamil Nadu (TN)",
  "India (National)",
  "Within Karnataka",
  "Global (All)",
];

const QUICK_RECENCY = [
  "Recent",
  "Past hour",
  "Past 24 hours",
  "Past week",
  "Past month",
  "Past year",
  "Archives",
  "Custom range...",
];

export function WorkspaceLayout({
  onClose,
  user,
}: {
  onClose?: () => void;
  user?: WorkspaceUser;
  isNewUser?: boolean;
}) {
  const { data: session } = useSession();
  const [activeModule, setActiveModule] = useState<WorkspaceModuleId>("dashboard");
  const [globalQuery, setGlobalQuery] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [searchInput, setSearchInput] = useState("");
  const [topicDomain, setTopicDomain] = useState("Cricket & Sports");
  const [topicQuery, setTopicQuery] = useState("");
  const [location, setLocation] = useState("Within Tamil Nadu (TN)");
  const [recency, setRecency] = useState("Past 24 hours");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customFromDate, setCustomFromDate] = useState("2026-09-01");
  const [customToDate, setCustomToDate] = useState("2026-09-20");

  const [modalSelectedDomain, setModalSelectedDomain] = useState("Cricket & Sports");
  const [modalCustomTopic, setModalCustomTopic] = useState("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isRecencyDropdownOpen, setIsRecencyDropdownOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const effectiveEmail = session?.user?.email || user?.email || "user@gmail.com";
  const isGmailAuth = effectiveEmail.includes("@gmail.com");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Load user saved preferences from Postgres on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then(res => res.json())
      .then(data => {
        if (data.preferences) {
          if (data.preferences.topic_domain) {
            setTopicDomain(data.preferences.topic_domain);
            setModalSelectedDomain(data.preferences.topic_domain);
          } else {
            setIsDomainModalOpen(true);
          }
          if (data.preferences.topic_query) {
            setTopicQuery(data.preferences.topic_query);
            setModalCustomTopic(data.preferences.topic_query);
          }
          if (data.preferences.location) setLocation(data.preferences.location);
          if (data.preferences.recency) setRecency(data.preferences.recency);
        } else {
          setIsDomainModalOpen(true);
        }
      })
      .catch(() => {
        setIsDomainModalOpen(true);
      });
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setTopicQuery(q);
    setActiveModule("dashboard");
    showToast(`Topic search: "${q}" in ${topicDomain}`);
  };

  const clearQuery = () => {
    setSearchInput("");
    setTopicQuery("");
    searchRef.current?.focus();
  };

  const handleSaveDomainFromModal = async (selectedDomain: string, customTopic: string = "") => {
    const finalDomain = selectedDomain || "Cinema & Entertainment";
    const finalTopic = customTopic.trim();
    if (finalTopic.length < 2) {
      showToast("Topic keyword is mandatory (must be at least 2 characters)");
      return;
    }
    setTopicDomain(finalDomain);
    setTopicQuery(finalTopic);
    setIsDomainModalOpen(false);
    showToast(`Configured: ${finalDomain} | Topic: "${finalTopic}"`);

    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_domain: finalDomain,
          topic_query: finalTopic,
          location,
          recency,
          target_email: effectiveEmail,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocationSelect = async (newLoc: string) => {
    setLocation(newLoc);
    setIsLocationDropdownOpen(false);
    showToast(`Location set to ${newLoc}`);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_domain: topicDomain, location: newLoc, recency, target_email: effectiveEmail }),
      });
    } catch {}
  };

  const handleRecencySelect = async (newRec: string) => {
    if (newRec === "Custom range...") {
      setIsRecencyDropdownOpen(false);
      setIsCustomDateModalOpen(true);
      return;
    }
    setRecency(newRec);
    setIsRecencyDropdownOpen(false);
    showToast(`Time set to ${newRec}`);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_domain: topicDomain, location, recency: newRec, target_email: effectiveEmail }),
      });
    } catch {}
  };

  const renderActiveView = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <ExecutiveDashboardView
            onNavigate={setActiveModule as any}
            onOpenDomainModal={() => setIsDomainModalOpen(true)}
            topicDomain={topicDomain}
            topicQuery={topicQuery}
            location={location}
            recency={recency}
            userEmail={effectiveEmail}
            initialReport={analysisResult}
            onAnalysisComplete={(result: any) => setAnalysisResult(result)}
          />
        );
      case "pipeline":
        return <PipelineMonitorView analysisResult={analysisResult} />;
      case "stories":
        return (
          <StoriesDashboardView
            analysisResult={analysisResult}
            onRefresh={() => setActiveModule("dashboard")}
          />
        );
      case "observability":
        return <AgentObservabilityView analysisResult={analysisResult} />;
      case "rules":
        return <RuleEngineView />;
      case "settings":
        return (
          <AccountSettingsView
            onSavePreferences={(prefs) => {
              setTopicDomain(prefs.topic_domain);
              setLocation(prefs.location);
              setRecency(prefs.recency);
              showToast("Preferences saved to account!");
            }}
          />
        );
      default:
        return (
          <ExecutiveDashboardView
            onNavigate={setActiveModule as any}
            onOpenDomainModal={() => setIsDomainModalOpen(true)}
            topicDomain={topicDomain}
            topicQuery={topicQuery}
            location={location}
            recency={recency}
            userEmail={effectiveEmail}
            onAnalysisComplete={(result: any) => setAnalysisResult(result)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col noise-overlay">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-foreground text-background font-mono text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-foreground/10 bg-background/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-foreground/10 md:hidden text-foreground hover:bg-foreground/5"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveModule("dashboard")}>
            <img src="/logo.jpeg" alt="Optimus Logo" className="w-8 h-8 rounded-xl object-cover border border-foreground/10 shadow-sm" />
            <div className="hidden sm:block">
              <span className="font-display font-semibold tracking-tight text-base leading-tight block">Optimus</span>
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest block -mt-1">Media Discovery</span>
            </div>
          </div>

          <div className="h-4 w-px bg-foreground/10 hidden md:block shrink-0" />

          {/* 1. Topic Domain Pill Button */}
          <button
            onClick={() => setIsDomainModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-foreground/10 bg-foreground/3 text-xs font-mono text-foreground hover:bg-foreground/8 transition-colors max-w-[140px] sm:max-w-44 truncate"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold truncate text-[11px] sm:text-xs">{topicDomain || "Select Domain"}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          </button>

          {/* 2. Location Scope Pill */}
          <div className="relative hidden md:block">
            <button
              onClick={() => { setIsLocationDropdownOpen(!isLocationDropdownOpen); setIsRecencyDropdownOpen(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-foreground/10 bg-foreground/3 text-xs font-mono text-foreground hover:bg-foreground/8 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-medium">{location}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>

            {isLocationDropdownOpen && (
              <div className="absolute left-0 mt-2 w-60 rounded-2xl border border-foreground/15 bg-background p-2 shadow-2xl z-30 font-mono text-xs space-y-1">
                <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Location Scope
                </div>
                {QUICK_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocationSelect(loc)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors ${
                      location === loc ? "bg-foreground text-background font-semibold" : "text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <span>{loc}</span>
                    {location === loc && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Recency Time Window Pill */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => { setIsRecencyDropdownOpen(!isRecencyDropdownOpen); setIsLocationDropdownOpen(false); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-foreground/10 bg-foreground/3 text-xs font-mono text-foreground hover:bg-foreground/8 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="font-medium">{recency}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>

            {isRecencyDropdownOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-2xl border border-foreground/15 bg-background p-2 shadow-2xl z-30 font-mono text-xs space-y-1">
                <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Time Window
                </div>
                {QUICK_RECENCY.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRecencySelect(r)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors ${
                      recency === r ? "bg-foreground text-background font-semibold" : "text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <span>{r}</span>
                    {recency === r && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs xl:max-w-sm mx-3 hidden md:flex items-center relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={`Search topic (e.g. PayU, IPL)...`}
            className="w-full pl-8 pr-8 py-1.5 text-xs font-mono rounded-full border border-foreground/15 bg-background/60 focus:bg-background focus:outline-none focus:border-foreground/40 transition-all"
          />
          {searchInput && (
            <button type="button" onClick={clearQuery} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/85 transition-colors"
          >
            <Search className="w-2.5 h-2.5" />
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* User Profile & Signout */}
          {user || session?.user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 bg-foreground/5 border border-foreground/10 rounded-full pl-1.5 pr-2.5 py-1 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-foreground font-medium truncate max-w-24 sm:max-w-32 text-[11px] sm:text-xs">
                  {session?.user?.name || user?.name || effectiveEmail.split("@")[0]}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-1 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full text-xs font-mono">
              Back
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Search & Controls Bar */}
      <div className="p-3 border-b border-foreground/8 bg-background/50 md:hidden flex items-center gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={`Search topic in ${topicDomain || "media"}...`}
            className="w-full pl-8 pr-8 py-2 text-xs font-mono rounded-full border border-foreground/15 bg-background focus:outline-none"
          />
          {searchInput && (
            <button type="button" onClick={clearQuery} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-foreground/10 bg-muted/20 hidden md:flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 space-y-4">
            {CATEGORIES.map((category) => {
              const mods = MODULES.filter(m => m.category === category);
              if (!mods.length) return null;
              return (
                <div key={category} className="space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    {category}
                  </div>
                  {mods.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeModule === mod.id;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => setActiveModule(mod.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all text-left font-sans ${
                          isActive
                            ? "bg-foreground text-background font-semibold shadow-sm"
                            : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
                        <span className="truncate">{mod.name}</span>
                        {mod.badge && (
                          <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-background/20 text-background"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {mod.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-auto p-4 border-t border-foreground/10 bg-background/40 font-mono text-[11px] text-muted-foreground space-y-1.5">
            <div className="flex justify-between items-center text-foreground font-semibold">
              <span>Domain:</span>
              <span className="text-amber-500 font-bold truncate max-w-28">{topicDomain || "Unset"}</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80 truncate">
              {location} · {recency}
            </div>
            <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{effectiveEmail}</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden flex">
            <div className="w-4/5 max-w-xs bg-background border-r border-foreground/15 p-5 flex flex-col shadow-2xl h-full">
              <div className="flex items-center justify-between pb-4 border-b border-foreground/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.jpeg" alt="Optimus Logo" className="w-7 h-7 rounded-lg object-cover border border-foreground/10" />
                  <span className="font-display font-semibold text-sm">Optimus Navigation</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 flex-1">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => { setActiveModule(mod.id); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left ${
                        isActive
                          ? "bg-foreground text-background font-semibold"
                          : "text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mod.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-foreground/10 text-xs font-mono text-muted-foreground space-y-1">
                <div>Domain: <strong className="text-foreground">{topicDomain || "Unset"}</strong></div>
                <div>Scope: <strong className="text-foreground">{location}</strong></div>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Workspace Canvas (Full Width on Mobile) */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-3.5 sm:p-6 lg:p-8 w-full max-w-full">
          <div className="max-w-6xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* TOPIC DOMAIN & NEWS QUERY SELECTION POPUP MODAL */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-foreground/20 bg-background p-5 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Media Intelligence Scope
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
                  Select Domain & News Topic
                </h2>
              </div>
              {topicDomain && (
                <button
                  onClick={() => setIsDomainModalOpen(false)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step 1: Select Industry Domain Category */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-foreground font-semibold flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">1</span>
                Select Industry Domain:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
                {TOPIC_DOMAIN_OPTIONS.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setModalSelectedDomain(item.name)}
                    className={`p-3.5 rounded-2xl border text-left transition-all group flex flex-col justify-between space-y-1.5 ${
                      modalSelectedDomain === item.name
                        ? "border-emerald-500 bg-emerald-500/10 font-semibold shadow-sm"
                        : "border-foreground/10 hover:border-foreground/30 bg-card hover:bg-foreground/3"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <span className={`font-semibold text-xs sm:text-sm ${modalSelectedDomain === item.name ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-foreground"}`}>
                          {item.name}
                        </span>
                      </div>
                      {modalSelectedDomain === item.name && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Custom News Title / Topic Query Entry (Mandatory) */}
            <div className="space-y-3 pt-3 border-t border-foreground/10">
              <label className="block text-xs font-mono text-foreground font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] flex items-center justify-center font-bold">2</span>
                  Enter Specific News Title / Topic <span className="text-red-500 font-bold ml-1">* (Required)</span>:
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">Min 2 characters</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={modalCustomTopic}
                  onChange={(e) => setModalCustomTopic(e.target.value)}
                  placeholder="e.g. vijay, GOAT movie release, PayU IPO..."
                  className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/20 bg-background focus:outline-none focus:border-emerald-500"
                />
                <Button
                  onClick={() => handleSaveDomainFromModal(modalSelectedDomain, modalCustomTopic)}
                  disabled={!modalSelectedDomain || modalCustomTopic.trim().length < 2}
                  className="bg-foreground text-background hover:bg-foreground/85 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-mono text-xs font-semibold px-6 py-2.5 shadow-md gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Confirm Scope & Discover
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Mandatory:</strong> Enter a specific topic, keyword, or breaking news title (at least 2 characters) for targeted media intelligence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DATE RANGE SELECTION POPUP MODAL (Google Tools Style with Apple Glassmorphism UI) */}
      {isCustomDateModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md rounded-3xl border border-foreground/20 bg-background/90 backdrop-blur-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
              <h3 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Customised date range
              </h3>
              <button
                onClick={() => setIsCustomDateModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <label className="w-12 text-muted-foreground font-semibold">From</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-foreground/20 bg-background text-foreground text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="w-12 text-muted-foreground font-semibold">To</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-foreground/20 bg-background text-foreground text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Interactive Month Calendar Preview Grid */}
              <div className="p-3 rounded-2xl border border-foreground/10 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold px-1">
                  <span>« September 2026 »</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Active Scope</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, idx) => (
                    <span key={idx} className="text-muted-foreground font-bold">{d}</span>
                  ))}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isSelected = dayNum >= 14 && dayNum <= 20;
                    return (
                      <span
                        key={dayNum}
                        className={`py-1 rounded-lg ${
                          isSelected ? "bg-blue-600 text-white font-bold" : "text-foreground hover:bg-foreground/10"
                        }`}
                      >
                        {dayNum}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="rounded-xl font-mono text-xs px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const finalRec = `Custom: ${customFromDate} to ${customToDate}`;
                  handleRecencySelect(finalRec);
                  setIsCustomDateModalOpen(false);
                }}
                className="bg-foreground text-background hover:bg-foreground/85 rounded-xl font-mono text-xs font-semibold px-6 shadow-md"
              >
                Go
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
