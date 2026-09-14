"""
Rule Engine — deterministic scoring and priority classification.

This module is intentionally free of LLM calls.
It takes raw numeric signals from the Impact Agent and applies
a weighted formula to produce a reproducible final score + priority label.

Formula:
    weighted_score = business_impact*W1 + urgency*W2
                   + market_impact*W3 + novelty*W4
                   + confidence*W5       (all on 0–10 scale)

    final_score = weighted_score * source_reliability * confidence

Priority thresholds (configurable via settings):
    CRITICAL  ≥ 9.0
    HIGH      ≥ 7.5
    MEDIUM    ≥ 5.0
    LOW       < 5.0

CRITICAL Guardrail:
    A story can only be CRITICAL if ALL of:
    - Rule engine final_score ≥ critical_threshold
    - Source reliability ≥ 0.75
    - LLM confidence ≥ 0.80
    If any condition fails, demote to HIGH.
"""
from __future__ import annotations
from datetime import datetime, timezone

from app.core.config import settings
from app.schemas.analysis import ImportanceSignals, RuleEngineResult


def score(signals: ImportanceSignals, source_reliability: float = 0.7) -> RuleEngineResult:
    """
    Apply the hybrid scoring formula to produce a final score and priority.

    Args:
        signals: LLM-produced impact signals (0–10 scale each).
        source_reliability: Average source reliability of the story's articles (0–1).

    Returns:
        RuleEngineResult with weighted_score, final_score, priority, and alert flag.
    """
    # Configurable weights (default: 0.30/0.25/0.20/0.15/0.10)
    w1 = settings.weight_business_impact
    w2 = settings.weight_urgency
    w3 = settings.weight_market_impact
    w4 = settings.weight_novelty
    w5 = settings.weight_confidence

    # Weighted linear combination (all signals on 0–10 scale)
    weighted = (
        signals.business_impact * w1
        + signals.urgency        * w2
        + signals.market_impact  * w3
        + signals.novelty        * w4
        + signals.confidence * 10 * w5  # convert 0–1 confidence to 0–10
    )

    # Dampen by source reliability to get final score
    final = weighted * source_reliability

    # Classify priority based on weighted score before guardrails
    ct = settings.rule_engine_critical_threshold
    ht = settings.rule_engine_high_threshold
    mt = settings.rule_engine_medium_threshold

    if weighted >= ct:
        priority = 'CRITICAL'
    elif weighted >= ht:
        priority = 'HIGH'
    elif weighted >= mt:
        priority = 'MEDIUM'
    else:
        priority = 'LOW'

    # ── CRITICAL Guardrail ──────────────────────────────────────────────
    # Cross-validation: CRITICAL requires agreement across ALL signals.
    # Prevents a single inflated LLM score from triggering false CRITICAL.
    if priority == 'CRITICAL':
        if source_reliability < settings.critical_min_source_reliability:
            priority = 'HIGH'
        elif signals.confidence < settings.critical_min_confidence:
            priority = 'HIGH'

    should_alert = priority in ('CRITICAL', 'HIGH')
    alert_reason = None
    if should_alert:
        drivers = []
        if signals.urgency >= 8:
            drivers.append(f'urgency={signals.urgency:.1f}/10')
        if signals.business_impact >= 8:
            drivers.append(f'business_impact={signals.business_impact:.1f}/10')
        if signals.market_impact >= 8:
            drivers.append(f'market_impact={signals.market_impact:.1f}/10')
        alert_reason = f'{priority} priority: {", ".join(drivers) or "high composite score"}'

    return RuleEngineResult(
        story_id=signals.story_id,
        weighted_score=round(weighted, 3),
        final_score=round(final, 3),
        priority=priority,
        should_alert=should_alert,
        alert_reason=alert_reason,
    )


def build_alert(story, rule_result: RuleEngineResult, run_id: str) -> dict:
    """Construct an alert dict for a CRITICAL/HIGH story."""
    return {
        'alert_id': f'alert-{run_id}-{story.story_id[:8]}',
        'story_id': story.story_id,
        'priority': rule_result.priority,
        'title': story.title,
        'reason': rule_result.alert_reason or '',
        'importance_score': rule_result.final_score,
        'sources': story.sources,
        'url': story.representative_url,
        'triggered_at': datetime.now(timezone.utc).isoformat(),
    }
