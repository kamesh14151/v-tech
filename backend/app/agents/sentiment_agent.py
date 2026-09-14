"""
Sentiment Agent — Parallel sub-agent running after Story Clustering.

Extracts sentiment classification, polarity score (-1.0 to +1.0), and confidence.
Runs concurrently with Topic, Impact, and Entity agents.
Pydantic-validated structured output.
"""
from __future__ import annotations
import time

from app.schemas.news import Story, SentimentAnalysis, AgentLog
from app.schemas.agent_outputs import SentimentOutput
from app.services.llm import llm


async def run(
    stories: list[Story],
    agent_logs: list[AgentLog],
) -> tuple[list[SentimentAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'sentiment_agent', 0, 0, t0, 'fallback')

    if not llm.client:
        out = [
            SentimentAnalysis(
                story_id=s.story_id,
                sentiment='neutral',
                polarity_score=0.0,
                confidence=0.7,
                reasoning='Default fallback: LLM unconfigured.',
            )
            for s in stories
        ]
        return out, _log(agent_logs, 'sentiment_agent', len(stories), len(out), t0, 'fallback')

    try:
        resp = llm.json_validated(
            'You are the Market & Public Sentiment Analysis Agent. '
            'For each story, evaluate the overall tone and market/public sentiment. '
            "sentiment: 'positive', 'negative', or 'neutral'. "
            'polarity_score: float from -1.0 (extremely negative/disastrous) to +1.0 (extremely bullish/positive). '
            'confidence: float from 0.0 to 1.0 reflecting how unambiguous the sentiment signals are. '
            'reasoning: 1 sentence explaining the sentiment rationale.',
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
                        'sentiment': {'type': 'string', 'enum': ['positive', 'negative', 'neutral']},
                        'polarity_score': {'type': 'number'},
                        'confidence': {'type': 'number'},
                        'reasoning': {'type': 'string'},
                    },
                    'required': ['index', 'sentiment', 'polarity_score', 'confidence', 'reasoning'],
                },
            },
            SentimentOutput,
        )
        validated = resp.result
        by_index = {x.index: x for x in validated.items}
        out: list[SentimentAnalysis] = []
        for i, s in enumerate(stories):
            x = by_index.get(i)
            if x:
                out.append(SentimentAnalysis(
                    story_id=s.story_id,
                    sentiment=x.sentiment,
                    polarity_score=x.polarity_score,
                    confidence=x.confidence,
                    reasoning=x.reasoning,
                ))
            else:
                out.append(SentimentAnalysis(
                    story_id=s.story_id,
                    sentiment='neutral',
                    polarity_score=0.0,
                    confidence=0.5,
                    reasoning='Unmatched in LLM response',
                ))

        return out, _log(agent_logs, 'sentiment_agent', len(stories), len(out), t0, 'ok',
                         input_tokens=resp.input_tokens, output_tokens=resp.output_tokens,
                         cost_usd=resp.cost_usd, model=resp.model)

    except Exception as exc:
        out = [
            SentimentAnalysis(
                story_id=s.story_id,
                sentiment='neutral',
                polarity_score=0.0,
                confidence=0.5,
                reasoning=f'Fallback: {exc}',
            )
            for s in stories
        ]
        return out, _log(agent_logs, 'sentiment_agent', len(stories), len(out), t0, 'error', error=str(exc))


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
