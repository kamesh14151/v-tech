"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Sliders, Plus, Trash2, Globe, Clock, Shield, CheckCircle2,
  Play, Pause, AlertTriangle, Sparkles, Loader2, Mail, Send,
  FileDown, Check, RefreshCw, Calendar, ArrowRight, Zap, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessRule {
  id: number | string;
  name: string;
  topicDomain: string;
  geography: string;
  recency: string;
  schedule: string;
  mandatoryTerms: string;
  excludedTerms: string;
  targetEmail: string;
  format: string;
  status: "Active" | "Paused";
  triggeredCount: number;
  lastTriggered: string;
}

export function RuleEngineView() {
  const { data: session } = useSession();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(session?.user?.email || "kamesh@optimus-intelligence.com");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggeringId, setTriggeringId] = useState<number | string | null>(null);
  const [triggeredSuccess, setTriggeredSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [topicDomain, setTopicDomain] = useState("Fintech & Banking");
  const [geography, setGeography] = useState("Within Tamil Nadu (TN)");
  const [schedule, setSchedule] = useState("Daily at 8:00 AM IST");
  const [recency, setRecency] = useState("Last 24 Hours");
  const [mandatoryTerms, setMandatoryTerms] = useState("");
  const [excludedTerms, setExcludedTerms] = useState("");
  const [format, setFormat] = useState("Executive Email Text + Word (.docx) Attachment");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        if (data.userEmail) setUserEmail(data.userEmail);
        if (data.rules) {
          const mapped: BusinessRule[] = data.rules.map((r: any) => ({
            id: r.id,
            name: r.name,
            topicDomain: r.condition_json?.topic_domain || "Fintech & Banking",
            geography: r.condition_json?.geography || "Within Tamil Nadu (TN)",
            recency: r.condition_json?.recency || "Last 24 Hours",
            schedule: r.condition_json?.schedule || "Daily at 8:00 AM IST",
            mandatoryTerms: r.condition_json?.mandatoryTerms || "All Sector Signals",
            excludedTerms: r.condition_json?.excludedTerms || "None",
            targetEmail: r.action_json?.email || data.userEmail || session?.user?.email || "Your Account Email",
            format: r.action_json?.format || "Executive Briefing + Word Doc (.docx)",
            status: r.is_active ? "Active" : "Paused",
            triggeredCount: r.triggered_count || 0,
            lastTriggered: r.last_triggered ? new Date(r.last_triggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          }));
          setRules(mapped);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const condition_json = {
      topic_domain: topicDomain,
      geography,
      schedule,
      recency,
      mandatoryTerms: mandatoryTerms || "All Topic Signals",
      excludedTerms: excludedTerms || "None",
    };

    const action_json = {
      action: `Email Daily Briefing + Word Doc (.docx) to ${userEmail}`,
      email: userEmail,
      format,
    };

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: `Automated ${schedule} briefing for ${topicDomain} in ${geography}`,
          condition_json,
          action_json,
        }),
      });

      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }

    setName("");
    setMandatoryTerms("");
    setExcludedTerms("");
    setIsModalOpen(false);
  };

  const handleTriggerNow = async (rule: BusinessRule) => {
    setTriggeringId(rule.id);
    setTriggeredSuccess(null);

    try {
      const res = await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, trigger_now: true }),
      });

      if (res.ok) {
        setTriggeredSuccess(
          `Morning Briefing & Word Document (.docx) dispatched to ${rule.targetEmail}!`
        );
        fetchRules();
        setTimeout(() => setTriggeredSuccess(null), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTriggeringId(null);
    }
  };

  const toggleStatus = async (id: number | string) => {
    const current = rules.find(r => r.id === id);
    const newStatus = current?.status === "Active" ? "Paused" : "Active";
    setRules(rules.map(r => r.id === id ? { ...r, status: newStatus } : r));

    try {
      await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: newStatus === "Active" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRule = async (id: number | string) => {
    setRules(rules.filter(r => r.id !== id));
    try {
      await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>Core Capability 3</span>
            <span>•</span>
            <span className="text-foreground font-semibold">Automated Intelligence & Email Delivery Engine</span>
          </div>
          <h1 className="text-2xl font-display tracking-tight">Automated Morning Briefing & Alert Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurable media automation rules delivering daily intelligence summaries and Word Documents (.docx) straight to your verified email.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-5 font-mono text-xs gap-2 shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Automation Rule
        </Button>
      </div>

      {/* Target User Email Confirmation Banner */}
      <div className="p-4 rounded-2xl border border-foreground/10 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs font-mono text-muted-foreground">Connected Delivery Address:</div>
            <div className="text-sm font-semibold text-foreground font-mono">{userEmail}</div>
          </div>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground bg-foreground/3 px-3 py-1.5 rounded-xl border border-foreground/5">
          Automatic delivery in formatted executive text + Word (.docx) attachment
        </div>
      </div>

      {/* Trigger Success Toast */}
      {triggeredSuccess && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <Check className="w-4 h-4 shrink-0" />
            <span><strong>Rule Dispatched!</strong> {triggeredSuccess}</span>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Sent</span>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-44 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
          <div className="h-44 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-6 rounded-2xl border transition-all ${
                rule.status === "Active" ? "border-foreground/15 bg-card" : "border-foreground/8 bg-muted/20 opacity-70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${rule.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                  <h3 className="font-semibold text-base text-foreground">{rule.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-foreground/10 bg-foreground/5 text-muted-foreground">
                    {rule.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 font-mono text-xs text-muted-foreground">
                  <span>Dispatched: <strong className="text-foreground">{rule.triggeredCount} times</strong></span>
                  <span>•</span>
                  <span>Last: {rule.lastTriggered}</span>
                  <button onClick={() => toggleStatus(rule.id)} className="p-1 hover:text-foreground ml-2" title={rule.status === "Active" ? "Pause Rule" : "Activate Rule"}>
                    {rule.status === "Active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="p-1 hover:text-red-500 text-muted-foreground" title="Delete Rule">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Criteria Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-foreground/8 text-xs font-mono">
                <div className="p-3 rounded-xl bg-foreground/3">
                  <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Topic Domain
                  </div>
                  <div className="text-foreground font-medium truncate">{rule.topicDomain}</div>
                </div>

                <div className="p-3 rounded-xl bg-foreground/3">
                  <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" /> Location Scope
                  </div>
                  <div className="text-foreground font-medium truncate">{rule.geography}</div>
                </div>

                <div className="p-3 rounded-xl bg-foreground/3">
                  <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Automated Schedule
                  </div>
                  <div className="text-foreground font-medium truncate">{rule.schedule}</div>
                </div>

                <div className="p-3 rounded-xl bg-foreground/3">
                  <div className="text-[10px] text-muted-foreground mb-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-500" /> Recency Filter
                  </div>
                  <div className="text-foreground font-medium truncate">{rule.recency}</div>
                </div>
              </div>

              {/* Delivery Action & Trigger Test Button */}
              <div className="mt-4 pt-3 border-t border-foreground/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Delivery Action: <strong className="text-foreground">{rule.format}</strong> &rarr; <strong className="text-foreground">{rule.targetEmail}</strong></span>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleTriggerNow(rule)}
                  disabled={triggeringId === rule.id}
                  className="bg-foreground text-background hover:bg-foreground/85 rounded-full text-xs font-mono gap-1.5 shrink-0"
                >
                  {triggeringId === rule.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {triggeringId === rule.id ? "Synthesizing & Sending..." : "Send Test Briefing to Email"}
                </Button>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="p-12 text-center border border-dashed border-foreground/15 rounded-2xl">
              <Mail className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <div className="text-sm font-semibold text-foreground">No Automation Rules Configured</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a rule to receive daily morning intelligence digests and Word (.docx) reports automatically in your email.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-foreground/15 bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">Create Email Intelligence Rule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Fintech & Payments Intelligence Digest"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Topic Domain</label>
                  <select value={topicDomain} onChange={e => setTopicDomain(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none">
                    <option>Fintech & Banking</option>
                    <option>Cricket & Sports</option>
                    <option>IT Companies & Tech</option>
                    <option>Automotive & EV</option>
                    <option>Cinema & Entertainment</option>
                    <option>Healthcare & Biotech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Location Scope</label>
                  <select value={geography} onChange={e => setGeography(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none">
                    <option>Within Tamil Nadu (TN)</option>
                    <option>Within Karnataka</option>
                    <option>India (National)</option>
                    <option>Global (All)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Schedule</label>
                  <select value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none">
                    <option>Daily at 8:00 AM IST</option>
                    <option>Twice Daily (Morning & Evening)</option>
                    <option>Real-time on Critical Risk</option>
                    <option>Weekly on Monday Morning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Recency Window</label>
                  <select value={recency} onChange={e => setRecency(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none">
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Within 1 Month</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Delivery Destination & Format</label>
                <input
                  type="email"
                  disabled
                  value={`Sent to: ${userEmail} (Executive Text + Word .docx)`}
                  className="w-full px-3.5 py-2 rounded-xl border border-foreground/10 bg-foreground/5 text-muted-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-foreground/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-semibold">
                  Save & Enable Automation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
