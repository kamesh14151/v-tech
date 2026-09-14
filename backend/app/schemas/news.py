from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


# ─── Base Article Models ────────────────────────────────────────────────────

class RawArticle(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    title: str
    url: str
    source: str
    published_at: str
    description: str | None = None
    author: str | None = None
    api_source: str | None = None
    source_reliability: float = Field(default=0.7, ge=0, le=1)


class RelevantArticle(RawArticle):
    relevance_score: float = Field(ge=0, le=100)
    relevance_reason: str
    confidence: float = Field(default=0.8, ge=0, le=1)


class ValidatedArticle(RelevantArticle):
    validation_status: Literal['valid', 'false_positive', 'implicit_match']
    validation_confidence: float = Field(ge=0, le=1)
    validation_reason: str
    credibility_score: float = Field(ge=0, le=100)
    topics: list[str] = Field(default_factory=list)
    geography: str = ''


# ─── Story Cluster Models ───────────────────────────────────────────────────

class Story(BaseModel):
    story_id: str
    title: str
    article_ids: list[str]
    sources: list[str]
    representative_url: str
    narrative: str
    first_published_at: str


class ScoredStory(Story):
    importance_score: float = Field(ge=0, le=100)
    impact_level: Literal['low', 'medium', 'high', 'critical']
    urgency: Literal['low', 'medium', 'high', 'critical']
    impact_signals: list[str]
    sentiment: Literal['positive', 'negative', 'neutral']
    # Extended fields from parallel agents
    topic_tags: list[str] = Field(default_factory=list)
    entities: dict = Field(default_factory=dict)  # {companies, people, geographies}
    source_reliability: float = Field(default=0.7, ge=0, le=1)
    weighted_score: float = Field(default=0.0, ge=0, le=10)
    final_score: float = Field(default=0.0, ge=0, le=10)
    priority: Literal['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] = 'MEDIUM'
    should_alert: bool = False


# ─── Summary Model ──────────────────────────────────────────────────────────

class Summary(BaseModel):
    story_id: str
    headline: str
    executive_summary: str
    key_facts: list[str]
    recommended_action: str
    impact: str = ''
    what_to_watch: list[str] = Field(default_factory=list)
    sources_used: list[str] = Field(default_factory=list)


# ─── Parallel Sub-Agent Output Models ──────────────────────────────────────

class TopicAnalysis(BaseModel):
    story_id: str
    topic_tags: list[str]
    primary_category: str = ''


class ImpactAnalysis(BaseModel):
    story_id: str
    business_impact: float = Field(ge=0, le=10)
    urgency: float = Field(ge=0, le=10)
    market_impact: float = Field(ge=0, le=10)
    novelty: float = Field(ge=0, le=10)
    confidence: float = Field(ge=0, le=1)
    sentiment: Literal['positive', 'negative', 'neutral'] = 'neutral'
    impact_signals: list[str] = Field(default_factory=list)


class EntityAnalysis(BaseModel):
    story_id: str
    companies: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    geographies: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)


class SentimentAnalysis(BaseModel):
    story_id: str
    sentiment: Literal['positive', 'negative', 'neutral'] = 'neutral'
    polarity_score: float = Field(default=0.0, ge=-1.0, le=1.0)
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    reasoning: str = ''


# ─── Observability ──────────────────────────────────────────────────────────

class AgentLog(BaseModel):
    agent_name: str
    model: str = ''
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    confidence: float = 1.0
    status: Literal['ok', 'error', 'fallback'] = 'ok'
    items_in: int = 0
    items_out: int = 0
    error: str | None = None


# ─── Alert Model ────────────────────────────────────────────────────────────

class Alert(BaseModel):
    alert_id: str
    story_id: str
    priority: Literal['CRITICAL', 'HIGH']
    title: str
    reason: str
    importance_score: float
    sources: list[str]
    url: str
    triggered_at: str


# ─── API Response Models ────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    query: str
    generated_at: str
    total_articles: int
    sources: list[str]
    topic_domain: str
    location: str
    recency: str
    top_stories: list[dict]
    themes: list[dict]
    risks: list[dict]
    sentiment: dict
    executive_summary: str
    recommended_actions: list[str]
    markdown: str
    agent_trace: list[dict]
    # Extended
    priority_breakdown: dict
    agent_logs: list[dict]
    alerts: list[dict]
    stories: list[dict]
    discovered_articles: int
    relevant_articles: int
    noise_filtered_percent: float | None
