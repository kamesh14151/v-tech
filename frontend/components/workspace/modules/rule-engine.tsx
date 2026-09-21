"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Sliders, Plus, Trash2, Pencil, Globe, Clock, Shield, CheckCircle2,
  Play, Pause, AlertTriangle, Sparkles, Loader2, Mail, Send,
  FileDown, Check, RefreshCw, Calendar, ArrowRight, Zap, Bell, X
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
  const [userEmail, setUserEmail] = useState(session?.user?.email || "kamesh14151@gmail.com");
  const [targetEmailState, setTargetEmailState] = useState(session?.user?.email || "kamesh14151@gmail.com");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [triggeringId, setTriggeringId] = useState<number | string | null>(null);
  const [triggeredSuccess, setTriggeredSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [topicDomain, setTopicDomain] = useState("Fintech & Banking");
  const [geography, setGeography] = useState("Within Tamil Nadu (TN)");
  const [scheduleType, setScheduleType] = useState("Daily");
  const [scheduleTime, setScheduleTime] = useState("08:00 AM IST");
  const [customTimeInput, setCustomTimeInput] = useState("08:00");
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
          const mapped: BusinessRule[] = data.rules.map((r: any) => {
            const rawEmail = r.action_json?.email;
            const cleanEmail = (rawEmail && !rawEmail.includes("optimus-intelligence.com") && !rawEmail.includes("optimus.co.in"))
              ? rawEmail
              : (data.userEmail || session?.user?.email || "kamesh14151@gmail.com");
            return {
              id: r.id,
              name: r.name,
              topicDomain: r.condition_json?.topic_domain || "Fintech & Banking",
              geography: r.condition_json?.geography || "Within Tamil Nadu (TN)",
              recency: r.condition_json?.recency || "Last 24 Hours",
              schedule: r.condition_json?.schedule || "Daily at 8:00 AM IST",
              mandatoryTerms: r.condition_json?.mandatoryTerms || "All Sector Signals",
              excludedTerms: r.condition_json?.excludedTerms || "None",
              targetEmail: cleanEmail,
              format: r.action_json?.format || "Executive Briefing + Word Doc (.docx)",
              status: r.is_active ? "Active" : "Paused",
              triggeredCount: r.triggered_count || 0,
              lastTriggered: r.last_triggered ? new Date(r.last_triggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
            };
          });
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

  const handleOpenCreate = () => {
    setEditingRule(null);
    setName("");
    setTopicDomain("Fintech & Banking");
    setGeography("Within Tamil Nadu (TN)");
    setScheduleType("Daily");
    setScheduleTime("08:00 AM IST");
    setCustomTimeInput("08:00");
    setRecency("Last 24 Hours");
    setMandatoryTerms("");
    setExcludedTerms("");
    setTargetEmailState(session?.user?.email || userEmail || "kamesh14151@gmail.com");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setTopicDomain(rule.topicDomain);
    setGeography(rule.geography);
    setRecency(rule.recency);
    setMandatoryTerms(rule.mandatoryTerms === "All Sector Signals" ? "" : rule.mandatoryTerms);
    setExcludedTerms(rule.excludedTerms === "None" ? "" : rule.excludedTerms);
    setTargetEmailState(rule.targetEmail || session?.user?.email || "kamesh14151@gmail.com");

    const sched = rule.schedule || "";
    if (sched.includes("Real-time")) {
      setScheduleType("Real-time");
    } else if (sched.includes("Twice Daily")) {
      setScheduleType("Twice Daily");
    } else if (sched.includes("Weekly")) {
      setScheduleType("Weekly");
    } else {
      setScheduleType("Daily");
      if (sched.includes("06:00 AM")) setScheduleTime("06:00 AM IST");
      else if (sched.includes("07:00 AM")) setScheduleTime("07:00 AM IST");
      else if (sched.includes("08:00 AM") || sched.includes("8:00 AM")) setScheduleTime("08:00 AM IST");
      else if (sched.includes("09:00 AM")) setScheduleTime("09:00 AM IST");
      else if (sched.includes("10:00 AM")) setScheduleTime("10:00 AM IST");
      else if (sched.includes("12:00 PM")) setScheduleTime("12:00 PM IST");
      else if (sched.includes("06:00 PM")) setScheduleTime("06:00 PM IST");
      else if (sched.includes("08:00 PM")) setScheduleTime("08:00 PM IST");
      else setScheduleTime("08:00 AM IST");
    }
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalSchedule = "Daily at 8:00 AM IST";
    if (scheduleType === "Real-time") {
      finalSchedule = "Real-time on Critical Risk";
    } else if (scheduleType === "Twice Daily") {
      finalSchedule = "Twice Daily (Morning & Evening)";
    } else if (scheduleType === "Weekly") {
      finalSchedule = "Weekly on Monday Morning";
    } else if (scheduleTime === "Custom" && customTimeInput) {
      finalSchedule = `Daily at ${customTimeInput} IST`;
    } else {
      finalSchedule = `Daily at ${scheduleTime}`;
    }

    const condition_json = {
      topic_domain: topicDomain,
      geography,
      schedule: finalSchedule,
      delivery_time: scheduleTime === "Custom" ? customTimeInput : scheduleTime,
      recency,
      mandatoryTerms: mandatoryTerms || "All Topic Signals",
      excludedTerms: excludedTerms || "None",
    };

    const action_json = {
      action: `Email Daily Briefing + Word Doc (.docx) to ${targetEmailState}`,
      email: targetEmailState,
      format,
    };

    try {
      if (editingRule) {
        // Update existing rule via PUT /api/rules
        const res = await fetch("/api/rules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRule.id,
            name,
            description: `Automated ${finalSchedule} briefing for ${topicDomain} in ${geography}`,
            condition_json,
            action_json,
          }),
        });
        if (res.ok) fetchRules();
      } else {
        // Create new rule via POST /api/rules
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: `Automated ${finalSchedule} briefing for ${topicDomain} in ${geography}`,
            condition_json,
            action_json,
          }),
        });
        if (res.ok) fetchRules();
      }
    } catch (e) {
      console.error(e);
    }

    setIsModalOpen(false);
    setEditingRule(null);
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

      const data = await res.json();
      if (res.ok && data.status === "sent") {
        setTriggeredSuccess(
          `Morning Intelligence Briefing with clickable story links dispatched directly to ${data.targetEmail || rule.targetEmail}!`
        );
        fetchRules();
        setTimeout(() => setTriggeredSuccess(null), 6000);
      } else if (res.ok) {
        setTriggeredSuccess(
          `Rule executed & dispatched to ${rule.targetEmail}!`
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
    if (!current) return;
    const newStatus = current.status === "Active" ? "Paused" : "Active";
    const newIsActive = newStatus === "Active";

    // Optimistic UI update
    setRules(rules.map(r => r.id === id ? { ...r, status: newStatus } : r));

    try {
      const res = await fetch("/api/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: newIsActive }),
      });
      if (res.ok) {
        fetchRules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRule = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this morning briefing rule?")) return;
    setRules(rules.filter(r => r.id !== id));
    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRules();
      }
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
            Configurable media automation rules delivering daily intelligence summaries straight to your verified email via Resend API.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
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
          Resend API Sender: Optimus Intelligence &lt;noreply@ajstudioz.co.in&gt;
        </div>
      </div>

      {/* Trigger Success Toast */}
      {triggeredSuccess && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <Check className="w-4 h-4 shrink-0" />
            <span><strong>Rule Action Triggered!</strong> {triggeredSuccess}</span>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold bg-emerald-500/20 px-2 py-0.5 rounded">Success</span>
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
                rule.status === "Active" ? "border-foreground/15 bg-card shadow-sm" : "border-foreground/8 bg-muted/20 opacity-70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${rule.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                  <h3 className="font-semibold text-base text-foreground">{rule.name}</h3>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                    rule.status === "Active" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-muted border-foreground/10 text-muted-foreground"
                  }`}>
                    {rule.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>Dispatched: <strong className="text-foreground">{rule.triggeredCount} times</strong></span>
                  <span>•</span>
                  <span>Last: {rule.lastTriggered}</span>
                  
                  <button
                    onClick={() => toggleStatus(rule.id)}
                    className={`p-1.5 rounded-lg border transition-all ml-2 ${
                      rule.status === "Active"
                        ? "hover:bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                    title={rule.status === "Active" ? "Pause Rule Automation" : "Activate Rule Automation"}
                  >
                    {rule.status === "Active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="p-1.5 rounded-lg border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                    title="Edit Rule Criteria"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg border border-foreground/10 hover:border-red-500/30 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                    title="Delete Rule"
                  >
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
                  className="bg-foreground text-background hover:bg-foreground/85 rounded-full text-xs font-mono gap-1.5 shrink-0 shadow-sm"
                >
                  {triggeringId === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {triggeringId === rule.id ? "Sending via Resend..." : "Run Automation & Send Email"}
                </Button>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="p-12 text-center border border-dashed border-foreground/15 rounded-2xl bg-card">
              <Mail className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <div className="text-sm font-semibold text-foreground">No Automation Rules Configured</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a rule to receive daily morning intelligence digests automatically in your email via Resend API.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-foreground/15 bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">
                {editingRule ? "Edit Morning Briefing Rule" : "Create Email Intelligence Rule"}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setEditingRule(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-muted-foreground mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Fintech & Payments Intelligence Digest"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground/40"
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

              {/* Configurable Schedule & Automated Timing Control */}
              <div className="space-y-2.5 p-3 rounded-xl border border-foreground/12 bg-foreground/3">
                <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Automated Schedule & Email Dispatch Timing
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground text-[10px] mb-1">Frequency</label>
                    <select
                      value={scheduleType}
                      onChange={e => setScheduleType(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-foreground/15 bg-background focus:outline-none text-xs"
                    >
                      <option value="Daily">Daily Automated Digest</option>
                      <option value="Twice Daily">Twice Daily (Morning & Evening)</option>
                      <option value="Real-time">Real-time on Critical Risk</option>
                      <option value="Weekly">Weekly Digest (Monday)</option>
                    </select>
                  </div>

                  {scheduleType === "Daily" ? (
                    <div>
                      <label className="block text-muted-foreground text-[10px] mb-1">Delivery Time (IST)</label>
                      <select
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-foreground/15 bg-background focus:outline-none text-xs font-mono"
                      >
                        <option value="06:00 AM IST">06:00 AM IST (Early Morning)</option>
                        <option value="07:00 AM IST">07:00 AM IST (Morning Briefing)</option>
                        <option value="08:00 AM IST">08:00 AM IST (Standard)</option>
                        <option value="09:00 AM IST">09:00 AM IST (Workday Start)</option>
                        <option value="10:00 AM IST">10:00 AM IST (Late Morning)</option>
                        <option value="12:00 PM IST">12:00 PM IST (Midday Digest)</option>
                        <option value="05:00 PM IST">05:00 PM IST (Evening Briefing)</option>
                        <option value="06:00 PM IST">06:00 PM IST (Evening Summary)</option>
                        <option value="08:00 PM IST">08:00 PM IST (Nightly Recap)</option>
                        <option value="Custom">Custom Time...</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-muted-foreground text-[10px] mb-1">Recency Window</label>
                      <select value={recency} onChange={e => setRecency(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-foreground/15 bg-background focus:outline-none text-xs">
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                        <option>Within 1 Month</option>
                      </select>
                    </div>
                  )}
                </div>

                {scheduleType === "Daily" && scheduleTime === "Custom" && (
                  <div className="pt-1">
                    <label className="block text-muted-foreground text-[10px] mb-1">Custom Time (HH:MM IST)</label>
                    <input
                      type="time"
                      value={customTimeInput}
                      onChange={e => setCustomTimeInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-foreground/15 bg-background focus:outline-none text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Mandatory Keywords (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. RBI, UPI, expansion, leadership"
                  value={mandatoryTerms}
                  onChange={e => setMandatoryTerms(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Target Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kamesh14151@gmail.com"
                  value={targetEmailState}
                  onChange={e => setTargetEmailState(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-foreground/10">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingRule(null); }} className="rounded-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs font-semibold">
                  {editingRule ? "Save Rule Changes" : "Save & Enable Automation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
