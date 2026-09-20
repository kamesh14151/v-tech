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


import re

KNOWN_GEOS = {"India", "Tamil Nadu", "Chennai", "Bangalore", "Karnataka", "Mumbai", "Delhi", "US", "USA", "UK", "Global"}
KNOWN_TECHS = {"AI", "EV", "UPI", "SaaS", "LLM", "Cloud", "Biotech", "5G", "API", "Battery"}

def _extract_entities_fast(text: str) -> EntityAnalysis:
    caps = re.findall(r'\b[A-Z][a-zA-Z0-9\.]+\b', text)
    unique_caps = [c for c in set(caps) if len(c) > 2 and c not in {"The", "And", "For", "With", "This", "That"}]

    geos = [c for c in unique_caps if c in KNOWN_GEOS]
    techs = [c for c in unique_caps if c in KNOWN_TECHS]
    companies_or_people = [c for c in unique_caps if c not in KNOWN_GEOS and c not in KNOWN_TECHS]

    return EntityAnalysis(
        story_id='',
        companies=companies_or_people[:5],
        people=[],
        geographies=geos[:3] or ["Global"],
        technologies=techs[:3],
    )


async def run(
    stories: list[Story],
    agent_logs: list[AgentLog],
) -> tuple[list[EntityAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'entity_agent', 0, 0, t0, 'fallback')

    out: list[EntityAnalysis] = []
    for s in stories:
        combined = f"{s.title} {s.narrative}"
        ent = _extract_entities_fast(combined)
        ent.story_id = s.story_id
        out.append(ent)

    return out, _log(agent_logs, 'entity_agent', len(stories), len(out), t0, 'ok', model='fast-ner-parser')


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
