"use client";

import { useState } from "react";
import { Sliders, Plus, Trash2, Settings2, Play, Pause, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rule {
  id: string;
  name: string;
  condition: string;
  action: string;
  status: "Active" | "Paused";
  triggeredCount: number;
  lastTriggered: string;
}

const initialRules: Rule[] = [
  {
    id: "rule-1",
    name: "Tier 1 PR Crisis Risk Alert",
    condition: "IF [Entity = Acme] AND [Sentiment < -0.45] AND [DomainAuth > 85 DA]",
    action: "Send Urgent SMS to PR Crisis Team + Tag #Crisis-Alert",
    status: "Active",
    triggeredCount: 3,
    lastTriggered: "Today, 8:21 PM"
  },
  {
    id: "rule-2",
    name: "C-Suite Executive Quote Tracker",
    condition: "IF [Entity = Jane Doe OR Robert Smith] AND [Contains Extracted Quote]",
    action: "Add to Executive Morning Briefing + Slack #exec-coverage",
    status: "Active",
    triggeredCount: 42,
    lastTriggered: "Yesterday, 10:14 AM"
  },
  {
    id: "rule-3",
    name: "Competitor Action Detected",
    condition: "IF [Competitor Mentioned] AND NOT [Acme Mentioned] AND [Category = Robotics]",
    action: "Log to Coverage Gap Matrix + Flag Outreach Lead",
    status: "Paused",
    triggeredCount: 12,
    lastTriggered: "Aug 20, 2:30 PM"
  },
];

export function RuleEngineView() {
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleAction, setNewRuleAction] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!newRuleName) return;
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      condition: newRuleCondition,
      action: newRuleAction,
      status: "Active",
      triggeredCount: 0,
      lastTriggered: "Never",
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

  const duplicateRule = (r: Rule) => {
    setRules([...rules, { ...r, id: `rule-${Date.now()}`, name: `${r.name} (Copy)`, triggeredCount: 0, lastTriggered: "Never" }]);
  };

  // Convert technical condition "IF [Entity = Acme] AND [Sentiment < -0.45]" into readable "Acme is mentioned AND sentiment < -0.45"
  const makeReadable = (condition: string) => {
    return condition
      .replace(/^IF /i, "")
      .replace(/\[Entity = (.*?)\]/i, "$1 is mentioned")
      .replace(/\[(.*?)\]/g, "$1");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Rules & Alerts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automate alerts, briefings, and notifications based on live intelligence signals.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 rounded-full font-mono text-xs gap-2">
          <Plus className="w-3.5 h-3.5" /> Create Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((r) => (
          <div
            key={r.id}
            className="p-5 rounded-xl border border-foreground/10 bg-card hover:border-foreground/25 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{r.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                  <span className={r.status === "Active" ? "text-emerald-500 font-bold" : "text-muted-foreground"}>{r.status.toUpperCase()}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Triggered: {r.triggeredCount} times</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Last: {r.lastTriggered}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleRuleStatus(r.id)}
                  className="px-3 py-1.5 rounded border border-foreground/10 hover:bg-foreground/5 text-foreground text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  {r.status === "Active" ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                </button>
                <button
                  onClick={() => duplicateRule(r)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-foreground/10 rounded"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteRule(r.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors border border-transparent hover:border-red-500/10 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm items-baseline">
              <div className="text-xs font-mono text-muted-foreground font-semibold">WHEN</div>
              <div className="text-foreground">{makeReadable(r.condition)}</div>
              
              <div className="text-xs font-mono text-muted-foreground font-semibold">THEN</div>
              <div className="text-emerald-600 dark:text-emerald-500 font-medium">{r.action}</div>
            </div>

            {/* Advanced toggle */}
            <div className="mt-4 pt-3 border-t border-foreground/10">
              <button 
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                className="text-[10px] font-mono flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="w-3 h-3" /> 
                {expandedId === r.id ? "Hide Advanced Implementation" : "View Advanced Implementation"}
              </button>
              
              {expandedId === r.id && (
                <div className="mt-3 p-3 rounded-lg bg-foreground/3 border border-foreground/5 font-mono text-xs overflow-x-auto space-y-2">
                  <div><span className="text-muted-foreground">Raw Condition:</span> <span className="text-foreground">{r.condition}</span></div>
                  <div><span className="text-muted-foreground">Provider:</span> <span className="text-foreground">Internal Rule Engine v2</span></div>
                  <div><span className="text-muted-foreground">Target Hook:</span> <span className="text-foreground">alert_webhook_3b9f2c</span></div>
                </div>
              )}
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
