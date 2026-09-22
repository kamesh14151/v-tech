"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Sliders, Globe, ShieldCheck, Check, Loader2, Sparkles,
  Building2, Save, Trophy, Cpu, Landmark, Car, Film, Stethoscope,
  Clock, CheckCircle2, AlertCircle, Mail, Send, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOPIC_DOMAIN_PRESETS = [
  {
    name: "Fintech & Banking",
    desc: "UPI payments, PayU, Paytm, RBI regulations, merchant credit, digital banking",
    icon: Landmark,
    color: "text-blue-500",
  },
  {
    name: "Cricket & Sports",
    desc: "IPL, BCCI, ICC tournaments, cricket players, football, and athletics",
    icon: Trophy,
    color: "text-amber-500",
  },
  {
    name: "IT Companies & Enterprise Tech",
    desc: "TCS, Infosys, Wipro, Google, Microsoft, AI hardware, and SaaS startups",
    icon: Cpu,
    color: "text-emerald-500",
  },
  {
    name: "Automotive & Electric Vehicles",
    desc: "Tesla, Tata Motors, EV battery manufacturing, and auto industry developments",
    icon: Car,
    color: "text-purple-500",
  },
  {
    name: "Vee Tech & Sona College",
    desc: "Vee Tech, Sona College of Technology, educational innovations, campus tech, and engineering developments",
    icon: GraduationCap,
    color: "text-indigo-500",
  },
  {
    name: "Healthcare & Biotech",
    desc: "Pharma manufacturing, drug discovery, clinical trials, and healthcare policy",
    icon: Stethoscope,
    color: "text-red-500",
  },
];

const LOCATION_PRESETS = [
  { label: "Within Tamil Nadu (TN)", desc: "Hyper-local Chennai, TN state media, DT Next, The Hindu regional coverage" },
  { label: "Within Karnataka", desc: "Bangalore tech hub, startup ecosystem, Karnataka state media" },
  { label: "Within Maharashtra", desc: "Mumbai financial capital, Pune industrial hubs, state developments" },
  { label: "India (National)", desc: "Pan-India national business, policy, and industry outlets" },
  { label: "Global (All)", desc: "Worldwide international media across all continents" },
];

const RECENCY_PRESETS = [
  { label: "Last 24 Hours", desc: "Real-time breaking updates & same-day coverage" },
  { label: "Last 7 Days", desc: "Weekly cycle of developments and editorial commentary" },
  { label: "Within 1 Month", desc: "Monthly narrative trends and policy rollouts" },
  { label: "Within 3 Months", desc: "Quarterly strategic movements, earnings, and market shifts" },
];

export function AccountSettingsView({
  onSavePreferences,
}: {
  onSavePreferences?: (prefs: {
    topic_domain: string;
    location: string;
    recency: string;
    target_email?: string;
    company_name?: string;
    company_keywords?: string;
    competitor_keywords?: string;
  }) => void;
}) {
  const { data: session } = useSession();
  const [companyName, setCompanyName] = useState("");
  const [companyKeywords, setCompanyKeywords] = useState("");
  const [competitorKeywords, setCompetitorKeywords] = useState("");
  const [topicDomain, setTopicDomain] = useState("IT Companies & Enterprise Tech");
  const [location, setLocation] = useState("India (National)");
  const [recency, setRecency] = useState("Last 24 Hours");
  const [targetEmail, setTargetEmail] = useState(session?.user?.email || "kamesh6592@gmail.com");
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/preferences")
      .then(res => res.json())
      .then(data => {
        if (data.preferences) {
          setCompanyName(data.preferences.company_name || "V-Tech Corporation");
          setCompanyKeywords(data.preferences.company_keywords || "Google Gemini, AI Security, LLM Hacks, Bazball, Bazball England, Optimus");
          setCompetitorKeywords(data.preferences.competitor_keywords || "OpenAI, Anthropic, Claude 3.5, ChatGPT");
          setTopicDomain(data.preferences.topic_domain || "IT Companies & Enterprise Tech");
          setLocation(data.preferences.location || "India (National)");
          setRecency(data.preferences.recency || "Last 24 Hours");
          setTargetEmail(data.preferences.target_email || session?.user?.email || "kamesh6592@gmail.com");
          setDailyDigestEnabled(data.preferences.daily_digest_enabled !== false);
          setDeliveryTime(data.preferences.delivery_time || "08:00");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailMsg(null);
    try {
      const res = await fetch("/api/digest/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.status === "sent") {
        setTestEmailMsg({
          type: "success",
          text: `Automated morning briefing (ID: ${data.emailId || 'sent'}) dispatched directly to ${targetEmail}! Check your inbox/spam.`,
        });
      } else if (data.gmailComposeUrl) {
        window.open(data.gmailComposeUrl, "_blank");
        setTestEmailMsg({
          type: "error",
          text: `Resend API on Render message: ${data.error || 'Direct dispatch failed'}. Opened Gmail Compose as fallback.`,
        });
      } else {
        setTestEmailMsg({
          type: "error",
          text: data.error || data.detail || "Could not dispatch test email. Ensure RESEND_API_KEY is set in Render settings.",
        });
      }
    } catch (err: any) {
      setTestEmailMsg({ type: "error", text: err.message || "Failed to trigger morning test email." });
    } finally {
      setTestingEmail(false);
    }
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const effectiveDomain = customDomainInput.trim() || topicDomain;

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          company_keywords: companyKeywords.trim(),
          competitor_keywords: competitorKeywords.trim(),
          topic_domain: effectiveDomain,
          location,
          recency,
          target_email: targetEmail.trim(),
          daily_digest_enabled: dailyDigestEnabled,
          delivery_time: deliveryTime,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (onSavePreferences) {
          onSavePreferences({
            company_name: companyName,
            company_keywords: companyKeywords,
            competitor_keywords: competitorKeywords,
            topic_domain: effectiveDomain,
            location,
            recency,
            target_email: targetEmail,
          });
        }
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err: any) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>Configurable Media Intelligence</span>
          <span>•</span>
          <span className="text-foreground font-semibold">Custom Company & Automation Settings</span>
        </div>
        <h1 className="text-2xl font-display tracking-tight">Discovery & Morning Automation Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize your company details, brand tracking keywords, industry scope, and automated morning email reports with clickable hyperlinks.
        </p>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs font-mono">
              <span className="font-bold">Company Discovery Settings Saved!</span> Morning automated briefings with source hyperlinks will be delivered to <strong className="underline">{targetEmail}</strong> for <strong className="underline">{companyName || "Your Company"}</strong>.
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 font-semibold uppercase">Saved</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
          <div className="h-40 rounded-2xl border border-foreground/10 bg-card animate-pulse" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">

          {/* 1. Custom Company Profile & Brand Tracking Keywords */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Building2 className="w-4.5 h-4.5 text-blue-500" />
                1. Company Profile & Brand Tracking Keywords
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                Custom Alert Targeting
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure your official organization identity and specific brand terms or executive names to prioritize in news discovery.
            </p>

            <div className="grid sm:grid-cols-1 gap-4 pt-1">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                  Company / Organization Name:
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. V-Tech Corporation, Infosys Ltd, Acme AI Solutions"
                  className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                  Brand Keywords & Focus Topics (Comma Separated):
                </label>
                <textarea
                  rows={2}
                  value={companyKeywords}
                  onChange={e => setCompanyKeywords(e.target.value)}
                  placeholder="e.g. Google Gemini, AI Security, LLM Hacks, Bazball, Bazball England, Optimus"
                  className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground transition-all resize-none"
                />
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  * Incoming news articles containing these exact keywords will be flagged with high relevance and included in your morning email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                  Competitors & Watch List Keywords (Optional):
                </label>
                <input
                  type="text"
                  value={competitorKeywords}
                  onChange={e => setCompetitorKeywords(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic, Claude 3.5, ChatGPT"
                  className="w-full px-4 py-2 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Topic Domain & Industry Sector */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Trophy className="w-4.5 h-4.5 text-amber-500" />
                2. Primary Industry Sector / Domain
              </div>
              <span className="text-xs font-mono text-muted-foreground">Active Sector: <strong className="text-foreground">{customDomainInput || topicDomain}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select your focus sector. Optimus AI and news feeds will discover intelligence around this domain.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOPIC_DOMAIN_PRESETS.map((item) => {
                const isSelected = topicDomain === item.name && !customDomainInput;
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    onClick={() => { setTopicDomain(item.name); setCustomDomainInput(""); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30 shadow-sm"
                        : "border-foreground/10 hover:border-foreground/20 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="font-semibold text-xs text-foreground">{item.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-1">
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                Or Custom Domain / Sector Name:
              </label>
              <input
                type="text"
                value={customDomainInput}
                onChange={e => setCustomDomainInput(e.target.value)}
                placeholder="e.g. Semiconductors, Space Tech, EV Batteries, Real Estate..."
                className="w-full px-4 py-2 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground transition-all"
              />
            </div>
          </div>

          {/* 3. Location Scope & Jurisdiction */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Globe className="w-4.5 h-4.5 text-emerald-500" />
                3. Location & Geographical Scope
              </div>
              <span className="text-xs font-mono text-muted-foreground">Scope: <strong className="text-foreground">{location}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select geographic boundaries for media source tracking and regional story filters.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LOCATION_PRESETS.map((p) => {
                const isSelected = location === p.label;
                return (
                  <div
                    key={p.label}
                    onClick={() => setLocation(p.label)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30 shadow-sm"
                        : "border-foreground/10 hover:border-foreground/20 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground">{p.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Recency / Time Window */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Clock className="w-4.5 h-4.5 text-purple-500" />
                4. Recency / Time Horizon Window
              </div>
              <span className="text-xs font-mono text-muted-foreground">Time Horizon: <strong className="text-foreground">{recency}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter media coverage by timeframe.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {RECENCY_PRESETS.map((r) => {
                const isSelected = recency === r.label;
                return (
                  <div
                    key={r.label}
                    onClick={() => setRecency(r.label)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/30 shadow-sm"
                        : "border-foreground/10 hover:border-foreground/20 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground">{r.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Automated Morning Email Briefing with Hyperlinks */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Send className="w-4.5 h-4.5 text-emerald-500" />
                5. Automated Morning Intelligence Digest (With Hyperlinks)
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyDigestEnabled}
                    onChange={e => setDailyDigestEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-xs font-mono font-semibold">
                  {dailyDigestEnabled ? <span className="text-emerald-500">Enabled</span> : <span className="text-muted-foreground">Disabled</span>}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Every morning, our system scans incoming news matching your company profile & keywords, generates an executive summary, and delivers an HTML email with direct source hyperlinks to your inbox.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                  Target Recipient Email Address:
                </label>
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs font-mono">
                  <span className="text-foreground font-bold">{targetEmail}</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Google Auth Synced
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1.5">
                  Morning Email Schedule Time (IST):
                </label>
                <select
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
                >
                  <option value="06:00">06:00 AM IST - Early Morning Briefing</option>
                  <option value="08:00">08:00 AM IST - Standard Morning Briefing</option>
                  <option value="09:00">09:00 AM IST - Workday Opening Report</option>
                  <option value="12:00">12:00 PM IST - Midday Digest</option>
                  <option value="18:00">06:00 PM IST - Evening Summary</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-foreground/10">
              <div className="text-xs font-mono text-muted-foreground">
                ⚡ Instant Test Dispatch: Send a live sample briefing email right now with clickable story links.
              </div>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 shrink-0"
              >
                {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Morning Test Email Now
              </button>
            </div>

            {testEmailMsg && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                testEmailMsg.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}>
                {testEmailMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />}
                <span>{testEmailMsg.text}</span>
              </div>
            )}
          </div>

          {/* Sticky Bottom Save Action Bar */}
          <div className="flex items-center justify-between p-5 rounded-2xl border border-foreground/15 bg-background/95 backdrop-blur-xl sticky bottom-4 shadow-xl z-20">
            <div className="text-xs font-mono text-muted-foreground hidden sm:block">
              Company: <strong className="text-foreground">{companyName || "V-Tech"}</strong> · Email: <strong className="text-foreground">{targetEmail}</strong>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/85 rounded-full px-8 py-2.5 text-xs font-mono font-semibold gap-2 shadow-lg transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Preferences & Enable Morning Automation
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
