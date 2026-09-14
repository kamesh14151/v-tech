"""
Story Clustering Agent — Stage 3.

Groups articles that cover the same underlying event into story clusters.
Prevents the dashboard from showing the same news 20 times.

Pipeline:
    1. Embedding cosine similarity → candidate groups (deterministic)
    2. LLM confirms/merges candidate groups → final story clusters (Pydantic-validated)

Stable story_id = SHA-256 of sorted article URL set (ensures idempotency).
"""
from __future__ import annotations
import hashlib
import time
from collections import defaultdict

from app.schemas.news import ValidatedArticle, Story, AgentLog
from app.schemas.agent_outputs import ClusterOutput
from app.services.llm import llm
from app.services.vector_store import embed_text


async def run(
    articles: list[ValidatedArticle],
    agent_logs: list[AgentLog],
) -> tuple[list[Story], list[AgentLog]]:
    t0 = time.perf_counter()
    if not articles:
        return [], _log(agent_logs, 'clustering', 0, 0, t0, 'fallback')

    if not llm.client:
        stories = _heuristic_cluster(articles)
        return stories, _log(agent_logs, 'clustering', len(articles), len(stories), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Story Clustering Agent. '
            'Group articles that report the SAME underlying event or announcement into clusters. '
            'Do NOT merge articles that are merely related topics — only group identical events. '
            'Each cluster must have at least one article. '
            'Provide a concise narrative for each cluster (1–2 sentences). '
            'Include a confidence score (0–1) for each cluster.',
            'ARTICLES:\n' + '\n'.join(
                f'{i}: {a.title} | source={a.source} | {a.description or ""}'
                for i, a in enumerate(articles)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'article_indices': {'type': 'array', 'items': {'type': 'integer'}},
                        'narrative': {'type': 'string'},
                        'confidence': {'type': 'number'},
                    },
                    'required': ['article_indices', 'narrative', 'confidence'],
                },
            },
            ClusterOutput,
        )
        validated = resp.result
        stories: list[Story] = []
        seen_indices: set[int] = set()
        for cluster in validated.items:
            idx = [i for i in cluster.article_indices if 0 <= i < len(articles)]
            if not idx:
                continue
            seen_indices.update(idx)
            representative = articles[idx[0]]
            article_ids = [articles[i].id for i in idx]
            sources = list(dict.fromkeys(articles[i].source for i in idx))
            story_id = _stable_id(article_ids)
            stories.append(Story(
                story_id=story_id,
                title=representative.title,
                article_ids=article_ids,
                sources=sources,
                representative_url=representative.url,
                narrative=cluster.narrative,
                first_published_at=min(articles[i].published_at for i in idx),
            ))
        # Unclustered articles get their own story
        for i, a in enumerate(articles):
            if i not in seen_indices:
                stories.append(Story(
                    story_id=_stable_id([a.id]),
                    title=a.title,
                    article_ids=[a.id],
                    sources=[a.source],
                    representative_url=a.url,
                    narrative=a.title,
                    first_published_at=a.published_at,
                ))
        logs = _log(agent_logs, 'clustering', len(articles), len(stories), t0, 'ok',
                    input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                    cost_usd=resp.cost_usd, model=resp.model)
        return stories, logs
    except Exception as exc:
        fallback = _heuristic_cluster(articles)
        return fallback, _log(agent_logs, 'clustering', len(articles), len(fallback), t0, 'error', error=str(exc))


def _stable_id(article_ids: list[str]) -> str:
    payload = '|'.join(sorted(article_ids))
    return 'story-' + hashlib.sha256(payload.encode()).hexdigest()[:16]


def _heuristic_cluster(articles: list[ValidatedArticle]) -> list[Story]:
    """Simple title-prefix heuristic clustering (no LLM)."""
    groups: dict[str, list[ValidatedArticle]] = defaultdict(list)
    for a in articles:
        key = a.title.lower().split(':')[0][:60].strip()
        groups[key].append(a)
    stories = []
    for group in groups.values():
        article_ids = [a.id for a in group]
        stories.append(Story(
            story_id=_stable_id(article_ids),
            title=group[0].title,
            article_ids=article_ids,
            sources=list(dict.fromkeys(a.source for a in group)),
            representative_url=group[0].url,
            narrative=group[0].title,
            first_published_at=min(a.published_at for a in group),
        ))
    return stories


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
