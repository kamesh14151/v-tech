"use client";

import { useState } from "react";
import { UserCheck, Building2, ShieldCheck, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const workspaces = [
  { id: "ws-1", name: "Global Enterprise Workspace", region: "Worldwide / HQ", role: "VP of Global Communications", members: 42, activeAlerts: 3 },
  { id: "ws-2", name: "Tech & Product PR Division", region: "North America & EU", role: "Senior PR Strategist", members: 18, activeAlerts: 1 },
  { id: "ws-3", name: "Crisis Operations Center", region: "Global 24/7", role: "Crisis Response Director", members: 12, activeAlerts: 5 },
  { id: "ws-4", name: "Agency Client - Benchmark Inc.", region: "Global Enterprise", role: "Lead Intelligence Analyst", members: 8, activeAlerts: 0 },
];

export function LoginWorkspaceView({
  currentWorkspace,
  setCurrentWorkspace,
  currentRole,
  setCurrentRole,
  onNavigate,
}: {
  currentWorkspace: string;
  setCurrentWorkspace: (ws: string) => void;
  currentRole?: string;
  setCurrentRole?: (role: string) => void;
  onNavigate: (mod: any) => void;
}) {
  const [selectedWs, setSelectedWs] = useState("ws-1");

  const handleSelectWorkspace = (ws: typeof workspaces[0]) => {
    setSelectedWs(ws.id);
    setCurrentWorkspace(ws.name);
    if (setCurrentRole) setCurrentRole(ws.role);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
          <span>Module 1</span>
          <span>•</span>
          <span className="text-foreground">Authentication & Workspace Management</span>
        </div>
        <h1 className="text-3xl font-display tracking-tight">Login & Enterprise Workspace Switcher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage multi-tenant enterprise permissions, SSO credentials, and active brand monitoring environments.
        </p>
      </div>

      {/* User Session Banner */}
      <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-foreground/10 text-foreground flex items-center justify-center font-bold text-lg">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-semibold text-base">Kamesh (Authenticated User)</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> SSO Verified
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">kamesh@optimus-intelligence.com • Enterprise Admin</p>
          </div>
        </div>

        <Button size="sm" variant="outline" className="rounded-full text-xs font-mono">
          <Lock className="w-3.5 h-3.5 mr-2 text-muted-foreground" /> Switch SSO Identity
        </Button>
      </div>

      {/* Select Workspace Grid */}
      <div className="space-y-4">
        <h3 className="font-sans font-semibold text-sm text-muted-foreground uppercase tracking-wider font-mono">
          Available Workspaces ({workspaces.length})
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {workspaces.map((ws) => {
            const isSelected = selectedWs === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-foreground bg-foreground/5 shadow-md"
                    : "border-foreground/10 bg-card hover:border-foreground/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-foreground/10 text-foreground">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-foreground">{ws.name}</h4>
                      <span className="text-xs font-mono text-muted-foreground">{ws.region}</span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                </div>

                <div className="pt-3 border-t border-foreground/10 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <div>Role: <span className="text-foreground">{ws.role}</span></div>
                  <div>Alerts: <span className="font-bold text-foreground">{ws.activeAlerts}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => onNavigate("onboarding")} className="rounded-full text-xs font-mono">
          + Create New Enterprise Workspace
        </Button>

        <Button
          onClick={() => onNavigate("dashboard")}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 text-xs font-mono"
        >
          Launch Active Workspace <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
