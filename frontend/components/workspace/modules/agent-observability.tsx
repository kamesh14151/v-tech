"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity, Hash, DollarSign, Clock, Cpu, RefreshCw,
  Loader2, ChevronDown, ChevronRight, BarChart3, Zap,
  AlertCircle, CheckCircle2, TrendingDown, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentLog {
  agent_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
  status: string;
  items_in: number;
  items_out: number;
  error?: string;
}

interface RunRecord {
  run_id: string;
  query: string;
  status: string;
  created_at: string;
  total_tokens: number;
  total_cost_usd: number;
  total_latency_ms: number;
  agents_run: number;
}

interface RunDetail extends RunRecord {
  agent_logs: AgentLog[];
}

const AGENT_COLORS: Record<string, string> = {
  discovery: "text-sky-600 dark:text-sky-400",
  validation: "text-violet-600 dark:text-violet-400",
  clustering: "text-amber-600 dark:text-amber-400",
  topic_agent: "text-emerald-600 dark:text-emerald-400",
  impact_agent: "text-orange-600 dark:text-orange-400",
  entity_agent: "text-pink-600 dark:text-pink-400",
  importance: "text-red-600 dark:text-red-400",
  summary: "text-teal-600 dark:text-teal-400",
};

function Metric({ icon: Icon, label, value, sub, color = "text-foreground" }: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

function RunRow({ run, onClick, isSelected }: { run: RunRecord; onClick: () => void; isSelected: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
        isSelected
          ? "border-violet-500/30 bg-violet-500/10"
          : "border-border bg-card hover:border-foreground/20 hover:bg-muted/40"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{run.query}</p>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {new Date(run.created_at).toLocaleString()} · {run.agents_run} agents
        </p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 font-mono">
        <span className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-violet-500" />
          {run.total_tokens.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          ${run.total_cost_usd.toFixed(4)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {(run.total_latency_ms / 1000).toFixed(1)}s
        </span>
        {isSelected ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
    </button>
  );
}

function AgentLogRow({ log }: { log: AgentLog }) {
  const color = AGENT_COLORS[log.agent_name] || "text-muted-foreground";
  const total = log.input_tokens + log.output_tokens;
  const maxLatency = 5000;
  const barWidth = Math.min(100, (log.latency_ms / maxLatency) * 100);

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0">
        {log.status === "ok" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" /> :
         log.status === "error" ? <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" /> :
         <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />}
        <span className={`text-xs font-medium ${color} truncate`}>{log.agent_name}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${color.includes("emerald") ? "bg-emerald-500" : color.includes("violet") ? "bg-violet-500" : color.includes("sky") ? "bg-sky-500" : color.includes("amber") ? "bg-amber-500" : "bg-primary"}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono w-12 text-right">{(log.latency_ms / 1000).toFixed(2)}s</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 font-mono">
        <span className="w-16 text-right">{total > 0 ? total.toLocaleString() : "—"} tok</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold w-14 text-right">{log.cost_usd > 0 ? `$${log.cost_usd.toFixed(5)}` : "free"}</span>
        <span className="text-muted-foreground/60 w-8 text-right">{log.items_in}→{log.items_out}</span>
      </div>
    </div>
  );
}

export function AgentObservabilityView({
  analysisResult,
}: {
  analysisResult?: any;
}) {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Use current analysis result as the primary data source
  const currentLogs: AgentLog[] = analysisResult?.agent_logs || [];

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent-runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch {
      // silently fail — current analysis is always shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Compute summary stats from current analysis
  const totalTokens = currentLogs.reduce((s, l) => s + l.input_tokens + l.output_tokens, 0);
  const totalCost = currentLogs.reduce((s, l) => s + l.cost_usd, 0);
  const totalLatency = currentLogs.reduce((s, l) => s + l.latency_ms, 0);
  const parallelSavings = currentLogs.length > 0 ? (() => {
    const seq = currentLogs.reduce((s, l) => s + l.latency_ms, 0);
    const parallel = Math.max(
      currentLogs.find(l => l.agent_name === "topic_agent")?.latency_ms || 0,
      currentLogs.find(l => l.agent_name === "impact_agent")?.latency_ms || 0,
      currentLogs.find(l => l.agent_name === "entity_agent")?.latency_ms || 0,
    );
    const saved = (currentLogs.find(l => l.agent_name === "topic_agent")?.latency_ms || 0) +
      (currentLogs.find(l => l.agent_name === "impact_agent")?.latency_ms || 0) +
      (currentLogs.find(l => l.agent_name === "entity_agent")?.latency_ms || 0) - parallel;
    return saved;
  })() : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Agent Observability
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Token usage, latency, and cost per agent</p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRuns} className="text-muted-foreground hover:text-foreground gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Current run metrics */}
      {currentLogs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Current Run</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric icon={Hash} label="Total Tokens" value={totalTokens.toLocaleString()} color="text-violet-600 dark:text-violet-400" />
            <Metric icon={DollarSign} label="Total Cost" value={`$${totalCost.toFixed(5)}`} color="text-emerald-600 dark:text-emerald-400" />
            <Metric icon={Clock} label="Pipeline Time" value={`${(totalLatency / 1000).toFixed(1)}s`} color="text-amber-600 dark:text-amber-400" />
            {parallelSavings > 100 && (
              <Metric icon={Zap} label="Parallel Saving" value={`${(parallelSavings / 1000).toFixed(2)}s`} sub="vs. sequential" color="text-sky-600 dark:text-sky-400" />
            )}
          </div>

          {/* Per-agent breakdown */}
          <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-mono">
              <span className="w-36">Agent</span>
              <span className="flex-1">Latency</span>
              <span className="w-16 text-right">Tokens</span>
              <span className="w-14 text-right">Cost</span>
              <span className="w-8 text-right">Items</span>
            </div>
            {currentLogs.map((log, i) => (
              <AgentLogRow key={`${log.agent_name}-${i}`} log={log} />
            ))}
          </div>

          {/* Model breakdown */}
          {(() => {
            const models = [...new Set(currentLogs.map(l => l.model).filter(Boolean))];
            if (!models.length) return null;
            return (
              <div className="mt-3 rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-2">Models used</p>
                <div className="flex gap-2 flex-wrap">
                  {models.map(m => (
                    <span key={m} className="text-xs px-2 py-1 rounded-full bg-muted/60 border border-border text-foreground/80 font-mono">{m}</span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Historical runs */}
      {runs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Historical Runs</p>
          <div className="space-y-2">
            {runs.map(run => (
              <RunRow
                key={run.run_id}
                run={run}
                isSelected={selectedRunId === run.run_id}
                onClick={() => setSelectedRunId(selectedRunId === run.run_id ? null : run.run_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {currentLogs.length === 0 && runs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium text-sm">No agent runs recorded yet</p>
          <p className="text-muted-foreground/70 text-xs mt-1">Run an analysis to see per-agent token usage, latency, and cost</p>
        </div>
      )}
    </div>
  );
}
