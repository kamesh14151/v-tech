"""
Summary Agent — Stage 5 (final LLM agent).

Synthesizes a concise intelligence report from each story cluster.
Only summarizes HIGH and CRITICAL stories by default to minimize token cost.
Multi-source synthesis: the agent sees ALL article titles/narratives from the cluster.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import ScoredStory, Summary, AgentLog
from app.schemas.agent_outputs import SummaryOutput
from app.services.llm import llm


async def run(
    stories: list[ScoredStory],
    agent_logs: list[AgentLog],
    max_stories: int = 10,
) -> tuple[list[Summary], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'summary', 0, 0, t0, 'fallback')

    # Prioritize HIGH/CRITICAL, then fill with MEDIUM up to max_stories
    priority_order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    sorted_stories = sorted(stories, key=lambda s: priority_order.index(s.priority))
    target = sorted_stories[:max_stories]

    if not llm.client:
        out = [
            Summary(
                story_id=s.story_id,
                headline=s.title,
                executive_summary=s.narrative,
                key_facts=[
                    f'Coverage from {len(s.sources)} source(s): {", ".join(s.sources[:3])}.',
                    f'Importance: {s.importance_score:.0f}/100 | Priority: {s.priority}.',
                    f'Sentiment: {s.sentiment.capitalize()}.',
                ],
                recommended_action='Monitor for further developments.',
                impact='',
                what_to_watch=[],
                sources_used=s.sources,
            )
            for s in target
        ]
        return out, _log(agent_logs, 'summary', len(stories), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Intelligence Summary Agent. '
            'Produce concise, grounded executive intelligence summaries synthesizing MULTIPLE sources. '
            'Never invent facts, quotes, or citations not present in the input. '
            'For each story: '
            '- headline: a punchy, accurate 1-line headline '
            '- executive_summary: 2-3 sentences synthesizing across sources '
            '- key_facts: 3-5 bullet-point facts drawn directly from the evidence '
            '- impact: 1-2 sentences on business/market/strategic impact '
            '- what_to_watch: 2-3 forward-looking signals to monitor '
            '- recommended_action: one clear, actionable recommendation '
            '- sources_used: list of source names you drew from',
            'STORIES TO SUMMARIZE:\n' + '\n\n'.join(
                f'STORY {i} [priority={s.priority} score={s.importance_score:.0f}]:\n'
                f'Title: {s.title}\n'
                f'Narrative: {s.narrative}\n'
                f'Sources: {", ".join(s.sources)}\n'
                f'Topics: {", ".join(s.topic_tags)}\n'
                f'Sentiment: {s.sentiment}'
                for i, s in enumerate(target)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'index': {'type': 'integer'},
                        'headline': {'type': 'string'},
                        'executive_summary': {'type': 'string'},
                        'key_facts': {'type': 'array', 'items': {'type': 'string'}},
                        'impact': {'type': 'string'},
                        'what_to_watch': {'type': 'array', 'items': {'type': 'string'}},
                        'recommended_action': {'type': 'string'},
                        'sources_used': {'type': 'array', 'items': {'type': 'string'}},
                    },
                    'required': ['index', 'headline', 'executive_summary', 'key_facts', 'recommended_action'],
                },
            },
            SummaryOutput,
        )
        validated = resp.result
        out: list[Summary] = []
        for x in validated.items:
            idx = x.index
            if 0 <= idx < len(target):
                s = target[idx]
                out.append(Summary(
                    story_id=s.story_id,
                    headline=x.headline,
                    executive_summary=x.executive_summary,
                    key_facts=x.key_facts,
                    recommended_action=x.recommended_action,
                    impact=x.impact,
                    what_to_watch=x.what_to_watch,
                    sources_used=x.sources_used or s.sources,
                ))
        return out, _log(agent_logs, 'summary', len(stories), len(out), t0, 'ok',
                         input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                         cost_usd=resp.cost_usd, model=resp.model)
    except Exception as exc:
        out = [
            Summary(
                story_id=s.story_id,
                headline=s.title,
                executive_summary=s.narrative,
                key_facts=[f'Priority: {s.priority}', f'Sources: {", ".join(s.sources[:3])}'],
                recommended_action='Monitor this story.',
                sources_used=s.sources,
            )
            for s in target
        ]
        return out, _log(agent_logs, 'summary', len(stories), len(out), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
