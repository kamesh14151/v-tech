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


# High-speed deterministic sentiment keywords
POSITIVE_WORDS = {
    'profit', 'surge', 'growth', 'gain', 'success', 'record', 'bullish', 'up', 'launch',
    'win', 'approved', 'breakthrough', 'expansion', 'positive', 'lead', 'high', 'rally',
    'boost', 'hero', 'triumph', 'deal', 'partner', 'award', 'best', 'innovative',
}

NEGATIVE_WORDS = {
    'loss', 'drop', 'crash', 'decline', 'penalty', 'lawsuit', 'fraud', 'investigation',
    'fail', 'down', 'fire', 'crisis', 'allegation', 'risk', 'warning', 'concern',
    'scam', 'default', 'ban', 'sanction', 'threat', 'strike', 'charge', 'accident',
}


def _analyze_text_sentiment(text: str) -> tuple[str, float, float, str]:
    words = set(text.lower().split())
    pos_hits = len(words & POSITIVE_WORDS)
    neg_hits = len(words & NEGATIVE_WORDS)

    if pos_hits > neg_hits:
        score = min(1.0, 0.25 + (pos_hits - neg_hits) * 0.2)
        return 'positive', round(score, 2), 0.85, f"Identified {pos_hits} positive signals ({', '.join(list(words & POSITIVE_WORDS)[:3])})"
    elif neg_hits > pos_hits:
        score = max(-1.0, -0.25 - (neg_hits - pos_hits) * 0.2)
        return 'negative', round(score, 2), 0.85, f"Identified {neg_hits} risk/negative signals ({', '.join(list(words & NEGATIVE_WORDS)[:3])})"
    else:
        return 'neutral', 0.0, 0.75, "Balanced or objective reporting tone."


async def run(
    stories: list[Story],
    agent_logs: list[AgentLog],
) -> tuple[list[SentimentAnalysis], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], _log(agent_logs, 'sentiment_agent', 0, 0, t0, 'fallback')

    out: list[SentimentAnalysis] = []
    for s in stories:
        combined = f"{s.title} {s.narrative}"
        sentiment, polarity, conf, reason = _analyze_text_sentiment(combined)
        out.append(SentimentAnalysis(
            story_id=s.story_id,
            sentiment=sentiment,
            polarity_score=polarity,
            confidence=conf,
            reasoning=reason,
        ))

    return out, _log(agent_logs, 'sentiment_agent', len(stories), len(out), t0, 'ok', model='lexicon-nlp-engine')


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model=model or llm.model_name(),
        input_tokens=input_tokens, output_tokens=output_tokens,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=cost_usd, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
