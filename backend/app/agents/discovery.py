"""
Semantic Discovery Agent — Stage 1 of the LangGraph pipeline.

Two-stage retrieval strategy:
    Stage 1: Keyword pre-filter (deterministic, O(n))
    Stage 2: pgvector embedding similarity search
    Stage 3: LLM semantic validation of top candidates (Pydantic-validated output)

This order keeps LLM token costs minimal:
    N articles → keyword filter → K candidates → vector search → M candidates → LLM validates M
"""
from __future__ import annotations
import re
import time
from datetime import datetime, timezone

from app.schemas.news import RawArticle, RelevantArticle, AgentLog
from app.schemas.agent_outputs import DiscoveryOutput
from app.services.llm import llm
from app.services.vector_store import embed_and_store, similarity_search


async def run(
    articles: list[RawArticle],
    query: str,
    agent_logs: list[AgentLog],
) -> tuple[list[RelevantArticle], list[AgentLog]]:
    """
    Discover semantically relevant articles from the raw corpus.

    Returns (relevant_articles, updated_agent_logs).
    """
    t0 = time.perf_counter()
    if not articles:
        return [], _log(agent_logs, 'discovery', 0, 0, t0, 'fallback')

    # ── Stage 1: Keyword pre-filter ───────────────────────────────────────
    terms = [t for t in re.findall(r'[a-z0-9]+', query.lower()) if len(t) > 2]
    scored: list[tuple[RawArticle, int]] = []
    for a in articles:
        text = f'{a.title} {a.description or ""}'.lower()
        hits = sum(t in text for t in terms)
        if hits or not terms:
            scored.append((a, hits))
    scored.sort(key=lambda x: x[1], reverse=True)
    stage1 = [a for a, _ in scored[:50]]  # cap at 50 for vector search

    # ── Stage 2: pgvector embedding similarity ────────────────────────────
    # Store embeddings for all stage-1 candidates then search
    try:
        embed_and_store(stage1)
        top_ids = set(similarity_search(query, k=30))
        if top_ids:
            stage2 = [a for a in stage1 if a.id in top_ids]
        else:
            stage2 = stage1[:30]  # fallback: take top keyword-scored
    except Exception:
        stage2 = stage1[:30]

    if not stage2:
        return [], _log(agent_logs, 'discovery', len(articles), 0, t0, 'fallback')

    # ── Stage 3: LLM semantic validation (Pydantic-validated) ────────────
    if not llm.client:
        # Deterministic fallback
        out = [
            RelevantArticle(**a.model_dump(), relevance_score=70.0, relevance_reason='Deterministic fallback.', confidence=0.7)
            for a in stage2
        ]
        return out, _log(agent_logs, 'discovery', len(articles), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Semantic Discovery Agent. Select only articles genuinely relevant to the target topic. '
            'For each relevant article, assign a relevance_score (0–100), short relevance_reason, and confidence (0–1). '
            'Exclude articles that only tangentially mention the topic. Never invent facts.',
            f'TOPIC: {query}\nARTICLES:\n' + '\n'.join(
                f'{i}: {a.title} | {a.description or ""}' for i, a in enumerate(stage2)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'index': {'type': 'integer'},
                        'relevance_score': {'type': 'number'},
                        'relevance_reason': {'type': 'string'},
                        'confidence': {'type': 'number'},
                    },
                    'required': ['index', 'relevance_score', 'relevance_reason', 'confidence'],
                },
            },
            DiscoveryOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out = []
        for i, a in enumerate(stage2):
            x = by_index.get(i)
            if not x:
                continue
            if x.relevance_score < 50:
                continue
            out.append(RelevantArticle(
                **a.model_dump(),
                relevance_score=x.relevance_score,
                relevance_reason=x.relevance_reason,
                confidence=x.confidence,
            ))
        logs = _log(agent_logs, 'discovery', len(articles), len(out), t0, 'ok',
                    input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                    cost_usd=resp.cost_usd, model=resp.model)
        return out, logs
    except Exception as exc:
        fallback = [
            RelevantArticle(**a.model_dump(), relevance_score=65.0, relevance_reason='LLM error fallback.', confidence=0.6)
            for a in stage2
        ]
        return fallback, _log(agent_logs, 'discovery', len(articles), len(fallback), t0, 'error', error=str(exc))


def _log(
    existing: list[AgentLog],
    name: str,
    items_in: int,
    items_out: int,
    t0: float,
    status: str,
    *,
    input_tokens: int = 0,
    output_tokens: int = 0,
    cost_usd: float = 0.0,
    model: str = '',
    error: str | None = None,
) -> list[AgentLog]:
    latency_ms = (time.perf_counter() - t0) * 1000
    log_entry = AgentLog(
        agent_name=name,
        model=model or llm.model_name(),
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=round(latency_ms, 1),
        cost_usd=cost_usd,
        confidence=1.0,
        status=status,
        items_in=items_in,
        items_out=items_out,
        error=error,
    )
    return (existing or []) + [log_entry]
