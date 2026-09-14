"""
Impact Agent — Parallel sub-agent running after Story Clustering.

Produces ImportanceSignals (business_impact, urgency, market_impact, novelty, confidence)
on a 0–10 scale for each story cluster. These signals are consumed by the Rule Engine.

Runs in parallel with Topic Agent, Entity Agent, and Sentiment Agent.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import Story, ImpactAnalysis, AgentLog
from app.schemas.agent_outputs import ImpactOutput
from app.services.llm import llm


async def run(
    stories: list[Story],
    query: str,
    agent_logs: list[AgentLog],
) -> tuple[list[ImpactAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'impact_agent', 0, 0, t0, 'fallback')

    if not llm.client:
        out = [
            ImpactAnalysis(
                story_id=s.story_id,
                business_impact=5.0 + min(len(s.article_ids), 5) * 0.5,
                urgency=5.0,
                market_impact=5.0,
                novelty=6.0 if len(s.sources) > 1 else 4.0,
                confidence=0.6,
                sentiment='neutral',
                impact_signals=['Multi-source coverage'] if len(s.sources) > 1 else ['Single source'],
            )
            for s in stories
        ]
        return out, _log(agent_logs, 'impact_agent', len(stories), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Impact Analysis Agent. '
            'Score each story on FOUR dimensions (0–10 scale, be conservative and evidence-based): '
            '- business_impact: potential effect on businesses/markets '
            '- urgency: time-sensitivity (10 = breaking, requires immediate attention) '
            '- market_impact: effect on stock prices, industry valuations, trade '
            '- novelty: how new/surprising is this (10 = completely unexpected) '
            'Also provide: confidence (0–1), sentiment (positive/negative/neutral), '
            'and impact_signals (list of short strings explaining your scores). '
            'Do NOT inflate scores — a routine earnings report is not a 9.',
            f'MONITORING DOMAIN: {query}\nSTORIES:\n' + '\n'.join(
                f'{i}: {s.title} | sources={s.sources} | coverage={len(s.article_ids)} articles | {s.narrative}'
                for i, s in enumerate(stories)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'index': {'type': 'integer'},
                        'business_impact': {'type': 'number'},
                        'urgency': {'type': 'number'},
                        'market_impact': {'type': 'number'},
                        'novelty': {'type': 'number'},
                        'confidence': {'type': 'number'},
                        'sentiment': {'type': 'string', 'enum': ['positive', 'negative', 'neutral']},
                        'impact_signals': {'type': 'array', 'items': {'type': 'string'}},
                    },
                    'required': ['index', 'business_impact', 'urgency', 'market_impact', 'novelty', 'confidence'],
                },
            },
            ImpactOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out: list[ImpactAnalysis] = []
        for i, s in enumerate(stories):
            x = by_index.get(i)
            if x:
                out.append(ImpactAnalysis(
                    story_id=s.story_id,
                    business_impact=x.business_impact,
                    urgency=x.urgency,
                    market_impact=x.market_impact,
                    novelty=x.novelty,
                    confidence=x.confidence,
                    sentiment=x.sentiment,
                    impact_signals=x.impact_signals,
                ))
            else:
                out.append(ImpactAnalysis(
                    story_id=s.story_id, business_impact=4.0, urgency=4.0,
                    market_impact=4.0, novelty=4.0, confidence=0.5,
                    sentiment='neutral', impact_signals=[],
                ))
        return out, _log(agent_logs, 'impact_agent', len(stories), len(out), t0, 'ok',
                         input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                         cost_usd=resp.cost_usd, model=resp.model)
    except Exception as exc:
        out = [
            ImpactAnalysis(story_id=s.story_id, business_impact=4.0, urgency=4.0,
                           market_impact=4.0, novelty=4.0, confidence=0.5, sentiment='neutral')
            for s in stories
        ]
        return out, _log(agent_logs, 'impact_agent', len(stories), len(out), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
