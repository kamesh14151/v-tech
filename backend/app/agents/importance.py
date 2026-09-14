"""
Importance Analysis Agent — merges outputs from the three parallel sub-agents
(Topic, Impact, Entity) and applies the deterministic Rule Engine to produce
the final ScoredStory with priority label (CRITICAL/HIGH/MEDIUM/LOW).

This agent does NOT call the LLM directly — it merges and scores deterministically.
"""
from __future__ import annotations
import time
import uuid
from datetime import datetime, timezone

from app.schemas.news import (
    Story, ScoredStory, TopicAnalysis, ImpactAnalysis, EntityAnalysis, SentimentAnalysis,
    AgentLog, Alert,
)
from app.schemas.analysis import ImportanceSignals
from app.services import rule_engine
from app.services.source_reliability import get_reliability


async def run(
    stories: list[Story],
    topic_analyses: list[TopicAnalysis],
    impact_analyses: list[ImpactAnalysis],
    entity_analyses: list[EntityAnalysis],
    agent_logs: list[AgentLog],
    sentiment_analyses: list[SentimentAnalysis] | None = None,
    run_id: str = '',
) -> tuple[list[ScoredStory], list[Alert], list[AgentLog]]:
    t0 = time.perf_counter()
    if not stories:
        return [], [], _log(agent_logs, 'importance', 0, 0, t0, 'ok')

    # Build lookup maps by story_id
    topics_by_id = {t.story_id: t for t in (topic_analyses or [])}
    impact_by_id = {i.story_id: i for i in (impact_analyses or [])}
    entity_by_id = {e.story_id: e for e in (entity_analyses or [])}
    sentiment_by_id = {s.story_id: s for s in (sentiment_analyses or [])}

    scored: list[ScoredStory] = []
    alerts: list[Alert] = []
    run_id = run_id or str(uuid.uuid4())[:8]

    for story in stories:
        topic = topics_by_id.get(story.story_id)
        impact = impact_by_id.get(story.story_id)
        entity = entity_by_id.get(story.story_id)

        # Compute average source reliability for the story
        avg_reliability = sum(get_reliability(s) for s in story.sources) / max(len(story.sources), 1)

        # Build ImportanceSignals from Impact Agent (or defaults)
        if impact:
            signals = ImportanceSignals(
                story_id=story.story_id,
                business_impact=impact.business_impact,
                urgency=impact.urgency,
                market_impact=impact.market_impact,
                novelty=impact.novelty,
                confidence=impact.confidence,
            )
        else:
            # Heuristic fallback: more sources = more important
            base = min(10.0, 3.0 + len(story.article_ids) * 0.5)
            signals = ImportanceSignals(
                story_id=story.story_id,
                business_impact=base, urgency=base * 0.8,
                market_impact=base * 0.7, novelty=base * 0.9,
                confidence=0.5,
            )

        # Apply Rule Engine (deterministic)
        rule_result = rule_engine.score(signals, avg_reliability)

        # Derive legacy impact_level / urgency fields from final_score
        fs = rule_result.final_score
        impact_level = 'critical' if fs >= 9 else 'high' if fs >= 7.5 else 'medium' if fs >= 5 else 'low'
        urgency_level = impact_level  # mirror for now

        # Derive sentiment from dedicated Sentiment Agent (preferred) or Impact Agent (fallback)
        sent_analysis = sentiment_by_id.get(story.story_id)
        if sent_analysis:
            story_sentiment = sent_analysis.sentiment
        elif impact:
            story_sentiment = impact.sentiment
        else:
            story_sentiment = 'neutral'

        scored_story = ScoredStory(
            **story.model_dump(),
            importance_score=min(100.0, rule_result.final_score * 10),
            impact_level=impact_level,
            urgency=urgency_level,
            impact_signals=impact.impact_signals if impact else [],
            sentiment=story_sentiment,
            topic_tags=topic.topic_tags if topic else [],
            entities={
                'companies': entity.companies if entity else [],
                'people': entity.people if entity else [],
                'geographies': entity.geographies if entity else [],
                'technologies': entity.technologies if entity else [],
            },
            source_reliability=round(avg_reliability, 3),
            weighted_score=rule_result.weighted_score,
            final_score=rule_result.final_score,
            priority=rule_result.priority,
            should_alert=rule_result.should_alert,
        )
        scored.append(scored_story)

        # Generate alert for CRITICAL / HIGH stories
        if rule_result.should_alert:
            alert_dict = rule_engine.build_alert(story, rule_result, run_id)
            alerts.append(Alert(**alert_dict))

    # Sort by final_score descending
    scored.sort(key=lambda s: s.final_score, reverse=True)

    return scored, alerts, _log(agent_logs, 'importance', len(stories), len(scored), t0, 'ok')


def _log(existing, name, items_in, items_out, t0, status, *,
         input_tokens=0, output_tokens=0, cost_usd=0.0, model='', error=None):
    return (existing or []) + [AgentLog(
        agent_name=name, model='rule_engine',
        input_tokens=0, output_tokens=0,
        latency_ms=round((time.perf_counter() - t0) * 1000, 1),
        cost_usd=0.0, status=status,
        items_in=items_in, items_out=items_out, error=error,
    )]
