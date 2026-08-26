"use client";

import { useState } from "react";
import { Users, Mail, Search, Send, CheckCircle2, Filter, ExternalLink, Sparkles, Building2, UserCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const journalists = [
  {
    id: "journo-1",
    name: "Sarah Jenkins",
    outlet: "TechCrunch Enterprise",
    role: "Senior Enterprise Tech Editor",
    beat: "Enterprise AI, Robotics & Cloud",
    verified: true,
    recentArticle: "Enterprise Robotics Sector Surges as Acme AI Unveils Platform",
    location: "San Francisco, CA",
    pitchStatus: "Coverage Secured (Tier 1)",
    email: "s.jenkins@techcrunch.com",
  },
  {
    id: "journo-2",
    name: "Alex Rivera",
    outlet: "VentureBeat AI",
    role: "AI & Industrial Tech Reporter",
    beat: "Robotics, Machine Learning & IoT",
    verified: true,
    recentArticle: "Industrial Robotics Market Vendor Ranking Q3",
    location: "New York, NY",
    pitchStatus: "Coverage Gap Detected — Pitch Drafted",
    email: "alex.rivera@venturebeat.com",
  },
  {
    id: "journo-3",
    name: "David Vance",
    outlet: "Forbes Tech",
    role: "Senior Contributor",
    beat: "Factory Automation & Hardware",
    verified: true,
    recentArticle: "Semiconductor Lead Times & Sensor Disruptions",
    location: "Boston, MA",
    pitchStatus: "Pitch Opened (2h ago)",
    email: "dvance@forbes.com",
  },
];

export function MediaOutreachCrmView({ onNavigate }: { onNavigate?: (mod: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"database" | "pitches" | "distribution">("database");
  const [selectedJourno, setSelectedJourno] = useState<typeof journalists[0] | null>(null);
  const [pitchMessage, setPitchMessage] = useState(
    "Hi Sarah, following up on your recent Enterprise Robotics coverage. We would love to offer exclusive Q3 downtime benchmarks from Acme's CEO Jane Doe..."
  );
  const [pitchSentSuccess, setPitchSentSuccess] = useState(false);

  const handleSendPitch = () => {
    setPitchSentSuccess(true);
    setTimeout(() => {
      setPitchSentSuccess(false);
      setSelectedJourno(null);
    }, 2500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
            <span>CisionOne & Muck Rack Module</span>
            <span>•</span>
            <span className="text-foreground">Media Outreach & Journalist CRM</span>
          </div>
          <h1 className="text-3xl font-display tracking-tight">Journalist Database & Outreach CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access 600,000+ verified global journalists, track PR pitches, and resolve coverage gaps directly with media contacts.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs border border-foreground/10 p-1 rounded-full bg-background">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              activeTab === "database" ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Media Database
          </button>
          <button
            onClick={() => setActiveTab("pitches")}
            className={`px-4 py-1.5 rounded-full transition-colors ${
              activeTab === "pitches" ? "bg-foreground text-background font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Pitches (12)
          </button>
        </div>
      </div>

      {pitchSentSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4" /> Personalized PR Pitch sent to {selectedJourno?.name} ({selectedJourno?.outlet})
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-6 rounded-2xl border border-foreground/10 bg-background/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96 font-mono text-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by journalist name, beat, or outlet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground"
          />
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span className="text-emerald-500 font-bold">640,000+ Verified Contacts</span>
          <span>•</span>
          <span>Updated Daily by CisionOne Stream</span>
        </div>
      </div>

      {/* Journalist Database Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {journalists.map((j) => (
          <div
            key={j.id}
            className="p-6 rounded-2xl border border-foreground/10 bg-card hover:border-foreground/30 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-foreground">{j.name}</h3>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-xs font-mono text-muted-foreground">{j.outlet} • {j.role}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-foreground/10 text-foreground">
                {j.location}
              </span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="text-muted-foreground text-[10px] uppercase">Beat Focus</div>
              <div className="font-semibold text-foreground">{j.beat}</div>
            </div>

            <div className="p-3 rounded-xl border border-foreground/10 bg-background/50 font-mono text-[11px] space-y-1">
              <span className="text-muted-foreground">Recent Story:</span>
              <p className="text-foreground italic">{j.recentArticle}</p>
            </div>

            <div className="pt-2 border-t border-foreground/10 flex items-center justify-between font-mono text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">{j.pitchStatus}</span>
              <Button
                size="sm"
                onClick={() => setSelectedJourno(j)}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Send Pitch
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Send Pitch Modal */}
      {selectedJourno && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-2xl border border-foreground/10 bg-background shadow-2xl space-y-6">
            <div>
              <h3 className="font-display text-xl font-semibold">Send Personalized PR Pitch</h3>
              <p className="text-xs font-mono text-muted-foreground">
                To: {selectedJourno.name} ({selectedJourno.email}) — {selectedJourno.outlet}
              </p>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <label className="block font-mono text-muted-foreground">Pitch Content</label>
              <textarea
                rows={5}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="w-full px-4 py-3 text-sm font-sans rounded-xl border border-foreground/10 bg-background focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 font-mono text-xs">
              <Button variant="outline" onClick={() => setSelectedJourno(null)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleSendPitch} className="bg-foreground text-background rounded-full px-6">
                Deliver Pitch Now <Send className="w-3.5 h-3.5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
