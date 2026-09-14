"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers, AlertTriangle, TrendingUp, Minus, Circle,
  ChevronDown, ChevronRight, ExternalLink, RefreshCw,
  Loader2, Tag, Building2, User, MapPin, Cpu,
  BarChart3, ShieldAlert, Globe, Clock, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Story {
  story_id: string;
  title: string;
  narrative: string;
  priority: Priority;
  importance_score: number;
  final_score: number;
  sources: string[];
  article_ids: string[];
  first_published_at: string;
  topic_tags: string[];
  entities: {
    companies: string[];
    people: string[];
    geographies: string[];
    technologies: string[];
  };
  sentiment: "positive" | "negative" | "neutral";
  source_reliability: number;
  should_alert: boolean;
  url: string;
}

const PRIORITY_CONFIG: Record<Priority, {
  label: string; bg: string; border: string; text: string; dot: string; icon: any;
}> = {
  CRITICAL: { label: "CRITICAL", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", icon: AlertTriangle },
  HIGH:     { label: "HIGH",     bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", icon: TrendingUp },
  MEDIUM:   { label: "MEDIUM",   bg: "bg-blue-500/10",  border: "border-blue-500/30",  text: "text-blue-600 dark:text-blue-400",  dot: "bg-blue-500",  icon: Minus },
  LOW:      { label: "LOW",      bg: "bg-muted/60",       border: "border-border",     text: "text-muted-foreground",  dot: "bg-muted-foreground/40",  icon: Circle },
};

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function EntityChip({ icon: Icon, items, color }: { icon: any; items: string[]; color: string }) {
  if (!items?.length) return null;
  return (
    <div className="flex items-start gap-1.5 flex-wrap">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
      {items.slice(0, 4).map(e => (
        <span key={e} className="text-xs px-1.5 py-0.5 rounded bg-muted/60 border border-border text-foreground/90 font-mono">{e}</span>
      ))}
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PRIORITY_CONFIG[story.priority];

  return (
    <div className={`rounded-xl border transition-all duration-300 ${cfg.border} ${
      story.priority === "CRITICAL" ? "bg-red-500/5" :
      story.priority === "HIGH" ? "bg-amber-500/5" :
      "bg-card"
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/40 transition-colors rounded-xl"
      >
        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <PriorityBadge priority={story.priority} />
            {story.should_alert && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/15 border border-red-500/20 text-red-600 dark:text-red-400 font-semibold">
                <ShieldAlert className="w-3 h-3" /> Alert
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border font-semibold ${
              story.sentiment === "positive" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
              story.sentiment === "negative" ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" :
              "bg-muted/60 border-border text-muted-foreground"
            }`}>{story.sentiment}</span>
          </div>
          <p className="text-sm font-medium text-foreground leading-snug">{story.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{story.narrative}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-mono">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />{story.article_ids.length} articles
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />{story.sources.slice(0, 2).join(", ")}{story.sources.length > 2 ? ` +${story.sources.length - 2}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(story.first_published_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <div className={`text-lg font-bold ${cfg.text}`}>{story.importance_score.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground/60">/ 100</div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border mt-1 pt-4 space-y-4">
          {/* Topic tags */}
          {story.topic_tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
              {story.topic_tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 font-mono">{tag}</span>
              ))}
            </div>
          )}

          {/* Entities */}
          <div className="space-y-1.5">
            <EntityChip icon={Building2} items={story.entities?.companies} color="text-sky-500 dark:text-sky-400" />
            <EntityChip icon={User} items={story.entities?.people} color="text-emerald-500 dark:text-emerald-400" />
            <EntityChip icon={MapPin} items={story.entities?.geographies} color="text-amber-500 dark:text-amber-400" />
            <EntityChip icon={Cpu} items={story.entities?.technologies} color="text-violet-500 dark:text-violet-400" />
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 border border-border p-3 text-center">
              <div className="text-lg font-bold text-foreground">{story.importance_score.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Importance</div>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border p-3 text-center">
              <div className="text-lg font-bold text-foreground">{story.final_score.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Final Score</div>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border p-3 text-center">
              <div className="text-lg font-bold text-foreground">{(story.source_reliability * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Src Reliability</div>
            </div>
          </div>

          {/* Sources */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Sources ({story.sources.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {story.sources.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground/80 font-mono">{s}</span>
              ))}
            </div>
          </div>

          {/* Link */}
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Read representative article
          </a>
        </div>
      )}
    </div>
  );
}

export function StoriesDashboardView({
  analysisResult,
  onRefresh,
}: {
  analysisResult?: any;
  onRefresh?: () => void;
}) {
  const [filter, setFilter] = useState<Priority | "ALL">("ALL");
  const stories: Story[] = analysisResult?.stories || [];

  const filtered = filter === "ALL" ? stories : stories.filter(s => s.priority === filter);
  const breakdown = {
    CRITICAL: stories.filter(s => s.priority === "CRITICAL").length,
    HIGH: stories.filter(s => s.priority === "HIGH").length,
    MEDIUM: stories.filter(s => s.priority === "MEDIUM").length,
    LOW: stories.filter(s => s.priority === "LOW").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            Stories Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Clustered stories with priority classification</p>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-muted-foreground hover:text-foreground gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Priority breakdown pills */}
      {stories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === "ALL"
                ? "bg-foreground text-background border-foreground font-semibold"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            All ({stories.length})
          </button>
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map(p => {
            const cfg = PRIORITY_CONFIG[p];
            const count = breakdown[p];
            if (!count) return null;
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  filter === p
                    ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {p} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Story cards */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(story => (
            <StoryCard key={story.story_id} story={story} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium text-sm">
            {stories.length === 0
              ? "Run an analysis to see clustered stories"
              : `No ${filter} priority stories found`}
          </p>
          <p className="text-muted-foreground/70 text-xs mt-1">
            Stories are grouped by the clustering agent to prevent duplicate coverage
          </p>
        </div>
      )}
    </div>
  );
}
