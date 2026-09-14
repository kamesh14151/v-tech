"""
LangGraph NewsState — the single shared state object that flows
through every node in the pipeline.

Rule: every agent reads from state and returns ONLY the keys it updates.
No agent touches keys it doesn't own.
"""
from __future__ import annotations
import operator
from typing import Annotated, Any, TypedDict

from app.schemas.news import (
    RawArticle, RelevantArticle, ValidatedArticle,
    Story, ScoredStory, Summary,
    TopicAnalysis, ImpactAnalysis, EntityAnalysis, SentimentAnalysis,
    AgentLog, Alert,
)


class NewsState(TypedDict, total=False):
    # ── Input configuration ────────────────────────────────────────────────
    query: str
    topic_domain: str
    domain: str
    location: str
    recency: str
    keywords: list[str]
    geography: list[str]

    # ── Ingestion layer ────────────────────────────────────────────────────
    raw_articles: list[RawArticle]
    pre_filter_stats: dict[str, Any]

    # ── Discovery Agent ────────────────────────────────────────────────────
    relevant_articles: list[RelevantArticle]

    # ── Validation Agent ───────────────────────────────────────────────────
    validated_articles: list[ValidatedArticle]

    # ── Clustering Agent ───────────────────────────────────────────────────
    stories: list[Story]

    # ── Parallel sub-agents (fan-out after clustering) ─────────────────────
    topic_analyses: Annotated[list[TopicAnalysis], operator.add]
    impact_analyses: Annotated[list[ImpactAnalysis], operator.add]
    entity_analyses: Annotated[list[EntityAnalysis], operator.add]
    sentiment_analyses: Annotated[list[SentimentAnalysis], operator.add]

    # ── Importance Agent (merges parallel results) ─────────────────────────
    scored_stories: list[ScoredStory]
    priority: str

    # ── Summary Agent ──────────────────────────────────────────────────────
    summaries: list[Summary]

    # ── Alerts (from Rule Engine, embedded in Importance node) ─────────────
    alerts: list[Alert]

    # ── Agent observability ────────────────────────────────────────────────
    agent_logs: Annotated[list[AgentLog], operator.add]

    # ── Legacy trace (kept for backward compat) ────────────────────────────
    errors: Annotated[list[str], operator.add]
    trace: Annotated[list[dict[str, Any]], operator.add]

    # ── Run metadata ───────────────────────────────────────────────────────
    run_id: str
