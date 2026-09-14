"""
Context Validation Agent — Stage 2.

Takes discovered articles and validates them against the user's target domain.
Produces ValidationResult (relevant/false_positive/implicit_match) + credibility_score.
Source credibility is factored into confidence.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import RelevantArticle, ValidatedArticle, AgentLog
from app.schemas.agent_outputs import ValidationOutput
from app.services.llm import llm


async def run(
    articles: list[RelevantArticle],
    query: str,
    agent_logs: list[AgentLog],
) -> tuple[list[ValidatedArticle], list[AgentLog]]:
    t0 = time.perf_counter()
    if not articles:
        return [], _log(agent_logs, 'validation', 0, 0, t0, 'fallback')

    if not llm.client:
        out = [
            ValidatedArticle(
                **a.model_dump(),
                validation_status='valid',
                validation_confidence=0.75,
                validation_reason='Fallback: retained after discovery.',
                credibility_score=70.0,
                topics=[],
                geography='',
            )
            for a in articles
        ]
        return out, _log(agent_logs, 'validation', len(articles), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Context Validation Agent. '
            'Detect false positives (articles only superficially related) and weak context. '
            'Return a credibility_score (0–100) based on source reputation and content depth. '
            'Extract topics as short keyword phrases. '
            'Never claim external verification you did not perform.',
            f'TARGET TOPIC: {query}\nARTICLES:\n' + '\n'.join(
                f'{i}: {a.title} | {a.description or ""} | source={a.source}'
                for i, a in enumerate(articles)
            ),
            {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'index': {'type': 'integer'},
                        'classification': {'type': 'string', 'enum': ['valid', 'false_positive', 'implicit_match']},
                        'confidence': {'type': 'number'},
                        'reason': {'type': 'string'},
                        'credibility_score': {'type': 'number'},
                        'topics': {'type': 'array', 'items': {'type': 'string'}},
                        'geography': {'type': 'string'},
                    },
                    'required': ['index', 'classification', 'confidence', 'reason', 'credibility_score'],
                },
            },
            ValidationOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out: list[ValidatedArticle] = []
        for i, a in enumerate(articles):
            x = by_index.get(i)
            if not x or x.classification == 'false_positive':
                continue
            # Factor source reliability into confidence
            base_conf = x.confidence
            adj_conf = base_conf * ((a.source_reliability + 1.0) / 2.0)  # gentle adjustment
            out.append(ValidatedArticle(
                **a.model_dump(),
                validation_status=x.classification,
                validation_confidence=round(adj_conf, 3),
                validation_reason=x.reason,
                credibility_score=x.credibility_score,
                topics=x.topics,
                geography=x.geography,
            ))
        logs = _log(agent_logs, 'validation', len(articles), len(out), t0, 'ok',
                    input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                    cost_usd=resp.cost_usd, model=resp.model)
        return out, logs
    except Exception as exc:
        fallback = [
            ValidatedArticle(
                **a.model_dump(),
                validation_status='valid',
                validation_confidence=0.6,
                validation_reason='LLM error fallback.',
                credibility_score=60.0,
                topics=[],
                geography='',
            )
            for a in articles
        ]
        return fallback, _log(agent_logs, 'validation', len(articles), len(fallback), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
