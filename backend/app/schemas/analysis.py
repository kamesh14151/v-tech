"""
Supplementary Pydantic schemas used by the Rule Engine,
parallel sub-agents, and agent observability layer.
"""
from __future__ import annotations
from pydantic import BaseModel, Field


class ImportanceSignals(BaseModel):
    """Raw numeric signals produced by the Impact Agent (0–10 scale)."""
    story_id: str
    business_impact: float = Field(ge=0, le=10)
    urgency: float = Field(ge=0, le=10)
    market_impact: float = Field(ge=0, le=10)
    novelty: float = Field(ge=0, le=10)
    confidence: float = Field(ge=0, le=1)


class RuleEngineResult(BaseModel):
    """Output of the deterministic Rule Engine after hybrid scoring."""
    story_id: str
    weighted_score: float = Field(ge=0, le=10)
    final_score: float = Field(ge=0, le=10)
    priority: str  # CRITICAL | HIGH | MEDIUM | LOW
    should_alert: bool
    alert_reason: str | None = None


class PreFilterStats(BaseModel):
    """Statistics from the deterministic pre-filter stage."""
    total_collected: int
    after_dedup: int
    after_rule_filter: int
    sources_used: list[str]
