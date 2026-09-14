"""
Topic Agent — Parallel sub-agent running after Story Clustering.

Extracts topic tags and primary category for each story cluster.
Runs in parallel with Impact Agent, Entity Agent, and Sentiment Agent.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import Story, TopicAnalysis, AgentLog
from app.schemas.agent_outputs import TopicOutput
from app.services.llm import llm


async def run(
    stories: list[Story],
    agent_logs: list[AgentLog],
) -> tuple[list[TopicAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'topic_agent', 0, 0, t0, 'fallback')

    if not llm.client:
        out = [
            TopicAnalysis(story_id=s.story_id, topic_tags=[], primary_category='General')
            for s in stories
        ]
        return out, _log(agent_logs, 'topic_agent', len(stories), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Topic Classification Agent. '
            'For each story, extract up to 5 short topic tags (2–4 words each) and identify the primary category. '
            'Tags should be specific and useful for filtering (e.g. "Enterprise AI", "Regulatory", "M&A", "Product Launch"). '
            'Primary category should be one of: Technology, Finance, Politics, Sports, Healthcare, Science, Business, Entertainment, General. '
            'Include a confidence score (0–1).',
            'STORIES:\n' + '\n'.join(
                f'{i}: {s.title} | {s.narrative}'
                for i, s in enumerate(stories)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'index': {'type': 'integer'},
                        'topic_tags': {'type': 'array', 'items': {'type': 'string'}},
                        'primary_category': {'type': 'string'},
                        'confidence': {'type': 'number'},
                    },
                    'required': ['index', 'topic_tags', 'primary_category', 'confidence'],
                },
            },
            TopicOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out: list[TopicAnalysis] = []
        for i, s in enumerate(stories):
            x = by_index.get(i)
            if x:
                out.append(TopicAnalysis(
                    story_id=s.story_id,
                    topic_tags=x.topic_tags,
                    primary_category=x.primary_category,
                ))
            else:
                out.append(TopicAnalysis(story_id=s.story_id, topic_tags=[], primary_category='General'))
        return out, _log(agent_logs, 'topic_agent', len(stories), len(out), t0, 'ok',
                         input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                         cost_usd=resp.cost_usd, model=resp.model)
    except Exception as exc:
        out = [TopicAnalysis(story_id=s.story_id, topic_tags=[], primary_category='General') for s in stories]
        return out, _log(agent_logs, 'topic_agent', len(stories), len(out), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
