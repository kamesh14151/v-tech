"""
Pydantic models for LLM-structured outputs.
Every LLM-calling agent validates its response against these models.
On validation failure, the LLM gateway retries up to 2x before falling back.
"""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field


# ─── Discovery Agent ──────────────────────────────────────────────────────────

class DiscoveryItem(BaseModel):
    """One article's relevance assessment from the Discovery Agent."""
    index: int
    relevance_score: float = Field(ge=0, le=100)
    relevance_reason: str
    confidence: float = Field(ge=0, le=1, default=0.8)


class DiscoveryOutput(BaseModel):
    """Full Discovery Agent response."""
    items: list[DiscoveryItem]


# ─── Validation Agent ─────────────────────────────────────────────────────────

class ValidationItem(BaseModel):
    """One article's validation result."""
    index: int
    classification: Literal['valid', 'false_positive', 'implicit_match']
    confidence: float = Field(ge=0, le=1)
    reason: str
    credibility_score: float = Field(ge=0, le=100)
    topics: list[str] = Field(default_factory=list)
    geography: str = ''


class ValidationOutput(BaseModel):
    items: list[ValidationItem]


# ─── Clustering Agent ─────────────────────────────────────────────────────────

class ClusterItem(BaseModel):
    """One cluster of articles covering the same event."""
    article_indices: list[int]
    narrative: str
    confidence: float = Field(ge=0, le=1, default=0.8)


class ClusterOutput(BaseModel):
    items: list[ClusterItem]


# ─── Topic Agent ──────────────────────────────────────────────────────────────

class TopicItem(BaseModel):
    """Topic classification for one story."""
    index: int
    topic_tags: list[str]
    primary_category: str
    confidence: float = Field(ge=0, le=1, default=0.8)


class TopicOutput(BaseModel):
    items: list[TopicItem]


# ─── Impact Agent ─────────────────────────────────────────────────────────────

class ImpactItem(BaseModel):
    """Impact signals for one story (0–10 scale)."""
    index: int
    business_impact: float = Field(ge=0, le=10)
    urgency: float = Field(ge=0, le=10)
    market_impact: float = Field(ge=0, le=10)
    novelty: float = Field(ge=0, le=10)
    confidence: float = Field(ge=0, le=1)
    sentiment: Literal['positive', 'negative', 'neutral'] = 'neutral'
    impact_signals: list[str] = Field(default_factory=list)


class ImpactOutput(BaseModel):
    items: list[ImpactItem]


# ─── Entity Agent ─────────────────────────────────────────────────────────────

class EntityItem(BaseModel):
    """Named entities extracted from one story."""
    index: int
    companies: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    geographies: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)


class EntityOutput(BaseModel):
    items: list[EntityItem]


# ─── Sentiment Agent ──────────────────────────────────────────────────────────

class SentimentItem(BaseModel):
    """Sentiment analysis for one story."""
    index: int
    sentiment: Literal['positive', 'negative', 'neutral']
    polarity_score: float = Field(ge=-1.0, le=1.0)
    confidence: float = Field(ge=0, le=1)
    reasoning: str


class SentimentOutput(BaseModel):
    items: list[SentimentItem]


# ─── Summary Agent ────────────────────────────────────────────────────────────

class SummaryItem(BaseModel):
    """Intelligence summary for one story."""
    index: int
    headline: str
    executive_summary: str
    key_facts: list[str]
    impact: str = ''
    what_to_watch: list[str] = Field(default_factory=list)
    recommended_action: str
    sources_used: list[str] = Field(default_factory=list)


class SummaryOutput(BaseModel):
    items: list[SummaryItem]
