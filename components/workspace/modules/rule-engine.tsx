"use client";

import { useState } from "react";
import { Sliders, Plus, Play, Trash2, CheckCircle2, AlertOctagon, Bell, Mail, MessageSquare, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  status: "Active" | "Paused";
  triggeredCount: number;
}

const initialRules: Rule[] = [
  {
    id: "rule-1",
    name: "Tier 1 PR Crisis Risk Alert",
    condition: "IF [Entity = Acme] AND [Sentiment < -0.45] AND [DomainAuth > 85 DA]",
    action: "Send Urgent SMS to PR Crisis Team + Tag #Crisis-Alert",
    status: "Active",
    triggeredCount: 3,
  },
  {
    id: "rule-2",
    name: "C-Suite Executive Quote Tracker",
    condition: "IF [Entity = Jane Doe OR Robert Smith] AND [Contains Extracted Quote]",
    action: "Add to Executive Morning Briefing + Slack #exec-coverage",
    status: "Active",
    triggeredCount: 42,
  },
  {
    id: "rule-3",
    name: "Competitor Omission Gap Detector Trigger",
    condition: "IF [Competitor Mentioned] AND NOT [Acme Mentioned] AND [Category = Robotics]",
    action: "Log to Coverage Gap Matrix + Flag Outreach Lead",
    status: "Active",
    triggeredCount: 12,
  },
];

export function RuleEngineView() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("IF [Product = TitanX] AND [Sentiment > 0.5]");
  const [newRuleAction, setNewRuleAction] = useState("Slack #product-launches + Add 10 Relevance Points");

  const handleAddRule = () => {
    if (!newRuleName) return;
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      condition: newRuleCondition,
      action: newRuleAction,
      status: "Active",
      triggeredCount: 0,
    };
    setRules([...rules, newRule]);
    setNewRuleName("");
    setIsModalOpen(false);
  };

  const toggleRuleStatus = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, status: r.status === "Active" ? "Paused" : "Active" } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>Module 8</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold">Requirement 2 ⚙️</span>
            <span>•</span>
            <span className="text-foreground">Custom Boolean & Sentiment Rule Builder</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Configurable Rule Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build complex proximity, boolean, sentiment, and entity rules to automate alert routing and tagging.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-mono text-xs gap-2">
          <Plus className="w-4 h-4" /> Create New Automation Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card space-y-4 hover:border-foreground/30 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-sans font-semibold text-lg text-foreground">{r.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                    r.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  onClick={() => toggleRuleStatus(r.id)}
                  className="px-3 py-1 rounded-full border border-foreground/10 hover:bg-foreground/5 text-muted-foreground"
                >
                  {r.status === "Active" ? "Pause Rule" : "Activate Rule"}
                </button>
                <button
                  onClick={() => deleteRule(r.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 space-y-1">
                <span className="text-muted-foreground uppercase text-[10px]">Rule Logic Condition</span>
                <p className="text-foreground font-semibold">{r.condition}</p>
              </div>
              <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 space-y-1">
                <span className="text-muted-foreground uppercase text-[10px]">Automated Action</span>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{r.action}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-foreground/10 flex justify-between font-mono text-xs text-muted-foreground">
              <span>Triggered: <strong className="text-foreground">{r.triggeredCount} times</strong></span>
              <span>Last Evaluated: Just Now (Real-time Pipeline)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-2xl border border-foreground/10 bg-background shadow-2xl space-y-6">
            <h3 className="font-display text-xl font-semibold">Create New Automation Rule</h3>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-mono text-muted-foreground mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Product Launch Positive Alert"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-foreground/10 bg-background"
                />
              </div>

              <div>
                <label className="block font-mono text-muted-foreground mb-1">Rule Condition Logic</label>
                <input
                  type="text"
                  value={newRuleCondition}
                  onChange={(e) => setNewRuleCondition(e.target.value)}
                  className="w-full px-4 py-2 text-sm font-mono rounded-xl border border-foreground/10 bg-background"
                />
              </div>

              <div>
                <label className="block font-mono text-muted-foreground mb-1">Triggered Action</label>
                <input
                  type="text"
                  value={newRuleAction}
                  onChange={(e) => setNewRuleAction(e.target.value)}
                  className="w-full px-4 py-2 text-sm font-mono rounded-xl border border-foreground/10 bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 font-mono text-xs">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleAddRule} className="bg-foreground text-background rounded-full px-6">
                Save & Deploy Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
