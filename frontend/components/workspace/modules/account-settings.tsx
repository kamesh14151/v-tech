"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Sliders, Globe, ShieldCheck, Check, Loader2, Sparkles,
  Building2, Save, Trophy, Cpu, Landmark, Car, Film, Stethoscope,
  Clock, CheckCircle2, AlertCircle, Mail, Send
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
    name: "Cinema & Entertainment",
    desc: "Kollywood, Bollywood, OTT releases, box office revenue, and studio acquisitions",
    icon: Film,
    color: "text-pink-500",
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
  onSavePreferences?: (prefs: { topic_domain: string; location: string; recency: string; target_email?: string }) => void;
}) {
  const { data: session } = useSession();
  const [topicDomain, setTopicDomain] = useState("Fintech & Banking");
  const [location, setLocation] = useState("Within Tamil Nadu (TN)");
  const [recency, setRecency] = useState("Last 24 Hours");
  const [targetEmail, setTargetEmail] = useState(session?.user?.email || "");
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState("08:00");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isGmailLinked = targetEmail.includes("@gmail.com");

  useEffect(() => {
    fetch("/api/preferences")
      .then(res => res.json())
      .then(data => {
        if (data.preferences) {
          setTopicDomain(data.preferences.topic_domain || "Fintech & Banking");
          setLocation(data.preferences.location || "Within Tamil Nadu (TN)");
          setRecency(data.preferences.recency || "Last 24 Hours");
          setTargetEmail(data.preferences.target_email || session?.user?.email || "");
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
        setTestEmailMsg({ type: "success", text: `Test daily digest successfully sent to ${targetEmail}!` });
      } else if (data.gmailComposeUrl) {
        window.open(data.gmailComposeUrl, "_blank");
        setTestEmailMsg({ type: "success", text: "Opened Gmail Compose window to send test digest." });
      } else {
        setTestEmailMsg({ type: "error", text: data.error || data.detail || "Could not send test email." });
      }
    } catch (err: any) {
      setTestEmailMsg({ type: "error", text: err.message || "Failed to trigger test email." });
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
          onSavePreferences({ topic_domain: effectiveDomain, location, recency, target_email: targetEmail });
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>Configurable Intelligence Engine</span>
          <span>•</span>
          <span className="text-foreground font-semibold">Account Discovery Preferences</span>
        </div>
        <h1 className="text-2xl font-display tracking-tight">Domain, Scope & Gmail Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your default Topic Domain, Location Scope, Time Recency Window, and Verified Delivery Gmail.
        </p>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-xs font-mono">
              <span className="font-bold">Preferences Saved Successfully!</span> Morning intelligence reports will be delivered to <strong className="underline">{targetEmail}</strong> for <strong className="underline">{customDomainInput || topicDomain}</strong> in <strong className="underline">{location}</strong> ({recency}).
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
          {/* 1. Verified Gmail Delivery Section */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Mail className="w-4 h-4 text-emerald-500" />
                1. Morning Report Delivery Email
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/workspace" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-mono font-semibold hover:bg-red-500/20 transition-colors"
                >
                  <span className="font-bold">G</span> Authenticate / Update via Gmail
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated morning intelligence digests and Word (.docx) reports will be dispatched to this verified address.
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                required
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="flex-1 px-4 py-2.5 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* 2. Topic Domain Section */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Trophy className="w-4 h-4 text-amber-500" />
                2. Industry / Topic Domain
              </div>
              <span className="text-xs font-mono text-muted-foreground">Selected: <strong className="text-foreground">{customDomainInput || topicDomain}</strong></span>
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
                Or Custom Topic Domain:
              </label>
              <input
                type="text"
                value={customDomainInput}
                onChange={e => setCustomDomainInput(e.target.value)}
                placeholder="e.g. Semiconductors, Space Tech, EV Batteries, Real Estate..."
                className="w-full px-4 py-2 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          {/* 3. Location Scope Section */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Globe className="w-4 h-4 text-emerald-500" />
                3. Location & Jurisdiction Scope
              </div>
              <span className="text-xs font-mono text-muted-foreground">Selected: <strong className="text-foreground">{location}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select jurisdiction boundaries for regional media tracking.
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

          {/* 4. Recency / Time Window Section */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Clock className="w-4 h-4 text-blue-500" />
                4. Recency / Time Horizon Window
              </div>
              <span className="text-xs font-mono text-muted-foreground">Selected: <strong className="text-foreground">{recency}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter coverage by timeframe.
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
                        ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30 shadow-sm"
                        : "border-foreground/10 hover:border-foreground/20 bg-background/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground">{r.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Daily Email Digest Automation Section */}
          <div className="p-6 rounded-2xl border border-foreground/15 bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                <Send className="w-4 h-4 text-emerald-500" />
                5. Automated Daily Email Digest
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
              Automatically compiles & sends a customized intelligence briefing for your configured topic to <strong>{targetEmail}</strong> every morning.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">
                  Daily Delivery Schedule (UTC):
                </label>
                <select
                  value={deliveryTime}
                  onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full px-4 py-2 text-xs font-mono rounded-xl border border-foreground/15 bg-background focus:outline-none focus:border-foreground"
                >
                  <option value="06:00">06:00 AM UTC (11:30 AM IST)</option>
                  <option value="08:00">08:00 AM UTC (01:30 PM IST) - Standard</option>
                  <option value="12:00">12:00 PM UTC (05:30 PM IST)</option>
                  <option value="18:00">06:00 PM UTC (11:30 PM IST)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Test Digest Email Now
                </button>
              </div>
            </div>

            {testEmailMsg && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                testEmailMsg.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}>
                {testEmailMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testEmailMsg.text}</span>
              </div>
            )}
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-between p-5 rounded-2xl border border-foreground/15 bg-foreground/3">
            <div className="text-xs font-mono text-muted-foreground">
              Delivery to: <strong className="text-foreground">{targetEmail}</strong> · Scope: <strong className="text-foreground">{location}</strong>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-foreground text-background hover:bg-foreground/85 rounded-full px-6 text-xs font-mono font-semibold gap-2 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save All Preferences
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
