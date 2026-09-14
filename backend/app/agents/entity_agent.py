"""
Entity Agent — Parallel sub-agent running after Story Clustering.

Extracts named entities (companies, people, geographies, technologies)
from each story cluster. These entities are stored for search/filter.

Runs in parallel with Topic Agent, Impact Agent, and Sentiment Agent.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import Story, EntityAnalysis, AgentLog
from app.schemas.agent_outputs import EntityOutput
from app.services.llm import llm


async def run(
    stories: list[Story],
    agent_logs: list[AgentLog],
) -> tuple[list[EntityAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'entity_agent', 0, 0, t0, 'fallback')

    if not llm.client:
        out = [EntityAnalysis(story_id=s.story_id) for s in stories]
        return out, _log(agent_logs, 'entity_agent', len(stories), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Named Entity Extraction Agent. '
            'For each story, extract: '
            '- companies: company names mentioned (e.g. "OpenAI", "Microsoft") '
            '- people: person names (e.g. "Sam Altman", "Sundar Pichai") '
            '- geographies: countries, cities, regions (e.g. "India", "San Francisco") '
            '- technologies: specific technologies mentioned (e.g. "GPT-4", "LangGraph") '
            'Keep each entity list to at most 5 items. Use proper names, not pronouns.',
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
                        'companies': {'type': 'array', 'items': {'type': 'string'}},
                        'people': {'type': 'array', 'items': {'type': 'string'}},
                        'geographies': {'type': 'array', 'items': {'type': 'string'}},
                        'technologies': {'type': 'array', 'items': {'type': 'string'}},
                    },
                    'required': ['index'],
                },
            },
            EntityOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out: list[EntityAnalysis] = []
        for i, s in enumerate(stories):
            x = by_index.get(i)
            if x:
                out.append(EntityAnalysis(
                    story_id=s.story_id,
                    companies=x.companies,
                    people=x.people,
                    geographies=x.geographies,
                    technologies=x.technologies,
                ))
            else:
                out.append(EntityAnalysis(story_id=s.story_id))
        return out, _log(agent_logs, 'entity_agent', len(stories), len(out), t0, 'ok',
                         input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                         cost_usd=resp.cost_usd, model=resp.model)
    except Exception as exc:
        out = [EntityAnalysis(story_id=s.story_id) for s in stories]
        return out, _log(agent_logs, 'entity_agent', len(stories), len(out), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
