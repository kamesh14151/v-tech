"use client";

import { useState, useEffect, useRef } from "react";
import {
  Activity, CheckCircle2, Loader2, AlertCircle, Clock,
  Zap, DollarSign, Hash, ArrowRight, Cpu, Layers, GitBranch,
  TrendingUp, Shield, Search, Filter, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentLog {
  agent_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  cost_usd: number;
  status: "ok" | "error" | "fallback";
  items_in: number;
  items_out: number;
  error?: string;
}

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: any;
  type: "sequential" | "parallel";
  parallelGroup?: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "pre_filter", label: "Rule Pre-Filter", description: "Keyword + geography filter", icon: Filter, type: "sequential" },
  { id: "discovery", label: "Semantic Discovery", description: "Two-stage: keyword → vector → LLM", icon: Search, type: "sequential" },
  { id: "validation", label: "Context Validation", description: "False-positive detection", icon: Shield, type: "sequential" },
  { id: "clustering", label: "Story Clustering", description: "Group related articles", icon: Layers, type: "sequential" },
  { id: "topic_agent", label: "Topic Agent", description: "Tag extraction", icon: Hash, type: "parallel", parallelGroup: "fan" },
  { id: "impact_agent", label: "Impact Agent", description: "Signal scoring (0–10)", icon: TrendingUp, type: "parallel", parallelGroup: "fan" },
  { id: "entity_agent", label: "Entity Agent", description: "NER: companies, people", icon: Cpu, type: "parallel", parallelGroup: "fan" },
  { id: "importance", label: "Importance + Rule Engine", description: "Hybrid scoring → CRITICAL/HIGH/MEDIUM/LOW", icon: BarChart3, type: "sequential" },
  { id: "summary", label: "Summary Agent", description: "Multi-source synthesis", icon: Activity, type: "sequential" },
];

function statusColor(status: "idle" | "running" | "done" | "error") {
  if (status === "done") return "border-emerald-500/30 bg-emerald-500/10 text-foreground";
  if (status === "running") return "border-violet-500/40 bg-violet-500/10 animate-pulse text-foreground";
  if (status === "error") return "border-red-500/30 bg-red-500/10 text-foreground";
  return "border-border bg-card/60 opacity-60 text-foreground";
}

function StatusIcon({ status }: { status: "idle" | "running" | "done" | "error" }) {
  if (status === "done") return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
  if (status === "running") return <Loader2 className="w-4 h-4 text-violet-500 dark:text-violet-400 animate-spin" />;
  if (status === "error") return <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />;
  return <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />;
}

export function PipelineMonitorView({ analysisResult }: { analysisResult?: any }) {
  const [nodeStates, setNodeStates] = useState<Record<string, "idle" | "running" | "done" | "error">>({});
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Build node states from agent_logs
  useEffect(() => {
    if (analysisResult?.agent_logs) {
      setAgentLogs(analysisResult.agent_logs);
      const states: Record<string, "idle" | "running" | "done" | "error"> = {};
      for (const log of analysisResult.agent_logs as AgentLog[]) {
        states[log.agent_name] = (log.status === "ok" || log.status === "fallback" || (log.items_out && log.items_out > 0)) ? "done" : "error";
      }
      // pre_filter doesn't have an agent_log — if we have results, mark it done
      if (analysisResult.pre_filter_stats) states["pre_filter"] = "done";
      setNodeStates(states);
    }
  }, [analysisResult]);

  const logByAgent = Object.fromEntries(agentLogs.map(l => [l.agent_name, l]));

  const totalTokens = agentLogs.reduce((s, l) => s + l.input_tokens + l.output_tokens, 0);
  const totalCost = agentLogs.reduce((s, l) => s + l.cost_usd, 0);
  const totalLatency = agentLogs.reduce((s, l) => s + l.latency_ms, 0);
  const parallelAgentLatency = Math.max(
    logByAgent["topic_agent"]?.latency_ms || 0,
    logByAgent["impact_agent"]?.latency_ms || 0,
    logByAgent["entity_agent"]?.latency_ms || 0,
  );

  const pf = analysisResult?.pre_filter_stats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            Pipeline Monitor
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">LangGraph stateful execution trace</p>
        </div>
        {agentLogs.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
              {totalTokens.toLocaleString()} tokens
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              ${totalCost.toFixed(4)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              {(totalLatency / 1000).toFixed(1)}s total
            </span>
          </div>
        )}
      </div>

      {/* Pre-filter stats */}
      {pf && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Ingestion Funnel</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "Collected", value: pf.total_collected, color: "text-foreground" },
              { label: "Deduped", value: pf.after_dedup, color: "text-sky-600 dark:text-sky-400" },
              { label: "Rule-filtered", value: pf.after_rule_filter, color: "text-violet-600 dark:text-violet-400" },
              { label: "Final", value: pf.final, color: "text-emerald-600 dark:text-emerald-400" },
            ].map((item, i, arr) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="text-center">
                  <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/30" />}
              </div>
            ))}
            {pf.sources_used?.length > 0 && (
              <div className="ml-auto text-xs text-muted-foreground">
                Sources: {pf.sources_used.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline graph */}
      <div className="space-y-2">
        {/* Sequential nodes */}
        {PIPELINE_STEPS.filter(s => s.type === "sequential" && !["importance", "summary"].includes(s.id)).map((step, i) => {
          const state = nodeStates[step.id] || "idle";
          const log = logByAgent[step.id];
          return (
            <div key={step.id} className="space-y-1">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${statusColor(state)}`}>
                <StatusIcon status={state} />
                <step.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {log && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 font-mono">
                    {(log.items_in > 0 || log.items_out > 0) && (
                      <span>{log.items_in} → {log.items_out}</span>
                    )}
                    {log.latency_ms > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />{(log.latency_ms / 1000).toFixed(2)}s
                      </span>
                    )}
                    {(log.input_tokens + log.output_tokens) > 0 && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-violet-500" />{(log.input_tokens + log.output_tokens).toLocaleString()}
                      </span>
                    )}
                    {log.cost_usd > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${log.cost_usd.toFixed(4)}</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-xs font-sans font-semibold ${
                      (log.status === "ok" || log.status === "fallback" || log.items_out > 0)
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>{(log.status === "ok" || log.status === "fallback" || log.items_out > 0) ? "completed" : "error"}</span>
                  </div>
                )}
              </div>
              {/* Connector */}
              {i < PIPELINE_STEPS.filter(s => s.type === "sequential" && !["importance", "summary"].includes(s.id)).length - 1 && (
                <div className="w-px h-3 bg-border ml-6" />
              )}
            </div>
          );
        })}

        {/* Fan-out connector */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute left-6 w-px h-full bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-full border border-border z-10 font-mono">
            <Zap className="w-3 h-3 text-violet-500 dark:text-violet-400" />
            Parallel execution
          </div>
        </div>

        {/* Parallel nodes */}
        <div className="grid grid-cols-3 gap-2">
          {PIPELINE_STEPS.filter(s => s.parallelGroup === "fan").map(step => {
            const state = nodeStates[step.id] || "idle";
            const log = logByAgent[step.id];
            return (
              <div key={step.id} className={`flex flex-col gap-2 px-3 py-3 rounded-xl border transition-all ${statusColor(state)}`}>
                <div className="flex items-center gap-2">
                  <StatusIcon status={state} />
                  <step.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {log && (
                  <div className="text-xs text-muted-foreground space-y-0.5 font-mono">
                    {log.latency_ms > 0 && <div>{(log.latency_ms / 1000).toFixed(2)}s</div>}
                    {(log.input_tokens + log.output_tokens) > 0 && (
                      <div>{(log.input_tokens + log.output_tokens).toLocaleString()} tok</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Fan-in connector */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute left-6 w-px h-full bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-full border border-border z-10 font-mono">
            Fan-in → merge
          </div>
        </div>

        {/* Final sequential nodes */}
        {PIPELINE_STEPS.filter(s => s.type === "sequential" && ["importance", "summary"].includes(s.id)).map((step, i) => {
          const state = nodeStates[step.id] || "idle";
          const log = logByAgent[step.id];
          return (
            <div key={step.id} className="space-y-1">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${statusColor(state)}`}>
                <StatusIcon status={state} />
                <step.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{step.label}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {log && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 font-mono">
                    {(log.items_in > 0 || log.items_out > 0) && (
                      <span>{log.items_in} → {log.items_out}</span>
                    )}
                    {log.latency_ms > 0 && <span>{(log.latency_ms / 1000).toFixed(2)}s</span>}
                    {log.cost_usd > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${log.cost_usd.toFixed(4)}</span>}
                  </div>
                )}
              </div>
              {i < 1 && <div className="w-px h-3 bg-border ml-6" />}
            </div>
          );
        })}
      </div>

      {/* Parallel savings banner */}
      {parallelAgentLatency > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Parallel Execution Benefit</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Topic + Impact + Entity ran simultaneously in {(parallelAgentLatency / 1000).toFixed(2)}s
                instead of ~{((
                  (logByAgent["topic_agent"]?.latency_ms || 0) +
                  (logByAgent["impact_agent"]?.latency_ms || 0) +
                  (logByAgent["entity_agent"]?.latency_ms || 0)
                ) / 1000).toFixed(2)}s sequentially.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {agentLogs.length === 0 && !pf && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium text-sm">Run an analysis to see the pipeline trace</p>
          <p className="text-muted-foreground/70 text-xs mt-1">All 8 agent nodes will appear here with timing, token, and cost metrics</p>
        </div>
      )}
    </div>
  );
}
