"""
Source Reliability Registry.

Deterministic source scoring — no LLM involved.
Scores are used to multiply the AI importance score:
    final_score = ai_score * source_reliability * confidence

This prevents unknown blogs from triggering CRITICAL alerts.

Reads from PostgreSQL `source_reliability` table with 5-minute in-memory cache.
Falls back to static registry if DB is unavailable.
"""
from __future__ import annotations
import logging
import time
from typing import Any

import psycopg

from app.core.config import settings

log = logging.getLogger(__name__)

# ─── Static registry (fallback when DB is unavailable) ─────────────────────
_STATIC_REGISTRY: dict[str, float] = {
    # Tier 1 — Highest credibility (0.90–0.95)
    'reuters': 0.95,
    'the associated press': 0.95,
    'ap news': 0.95,
    'bloomberg': 0.93,
    'financial times': 0.93,
    'the guardian': 0.92,
    'bbc': 0.92,
    'bbc news': 0.92,
    'the new york times': 0.92,
    'wall street journal': 0.92,
    'wsj': 0.92,
    'official government': 0.95,
    'company blog': 0.90,

    # Tier 2 — High credibility (0.80–0.89)
    'techcrunch': 0.87,
    'the verge': 0.86,
    'wired': 0.86,
    'ars technica': 0.86,
    'mit technology review': 0.88,
    'fortune': 0.85,
    'forbes': 0.83,
    'business insider': 0.82,
    'cnbc': 0.84,
    'cnn': 0.83,
    'espn': 0.84,
    'cricinfo': 0.86,
    'cricbuzz': 0.85,
    'the economic times': 0.83,
    'mint': 0.83,
    'hindustan times': 0.82,
    'the hindu': 0.84,
    'ndtv': 0.82,
    'times of india': 0.81,
    'india today': 0.81,

    # Tier 3 — Medium credibility (0.65–0.79)
    'hackernews': 0.72,
    'hacker news': 0.72,
    'medium': 0.65,
    'substack': 0.65,
    'mashable': 0.72,
    'engadget': 0.73,
    'venturebeat': 0.75,
    'zdnet': 0.74,
    'cnet': 0.75,

    # Default tiers
    '_known_publication': 0.70,
    '_unknown': 0.35,
}

# ─── DB-backed cache ───────────────────────────────────────────────────────
_cached_registry: dict[str, float] | None = None
_cache_loaded_at: float = 0.0


def _load_from_db() -> dict[str, float] | None:
    """Load source reliability scores from PostgreSQL. Returns None on failure."""
    global _cached_registry, _cache_loaded_at

    # Check TTL
    ttl = settings.source_reliability_cache_ttl_seconds
    if _cached_registry is not None and (time.monotonic() - _cache_loaded_at) < ttl:
        return _cached_registry

    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            rows = conn.execute(
                'SELECT source_name, reliability_score FROM source_reliability'
            ).fetchall()
        if rows:
            registry = {row[0].lower().strip(): float(row[1]) for row in rows}
            _cached_registry = registry
            _cache_loaded_at = time.monotonic()
            log.debug('Loaded %d source reliability scores from DB', len(registry))
            return registry
    except Exception as exc:
        log.debug('source_reliability DB load failed (using static fallback): %s', exc)

    return None


def _get_registry() -> dict[str, float]:
    """Get the active registry: DB-backed if available, static fallback otherwise."""
    db_registry = _load_from_db()
    if db_registry:
        # Merge: DB values override static, static fills gaps
        merged = dict(_STATIC_REGISTRY)
        merged.update(db_registry)
        return merged
    return _STATIC_REGISTRY


def get_reliability(source_name: str) -> float:
    """Return reliability score for a source (0.0 – 1.0)."""
    if not source_name:
        return _STATIC_REGISTRY['_unknown']

    registry = _get_registry()
    key = source_name.lower().strip()

    if key in registry:
        return registry[key]

    # Fuzzy match on substrings for common patterns
    for k, v in registry.items():
        if k.startswith('_'):
            continue
        if k in key or key in k:
            return v

    return registry.get('_unknown', 0.35)


def score_articles(articles: list[Any]) -> list[Any]:
    """Attach source_reliability to each article in-place."""
    for a in articles:
        a.source_reliability = get_reliability(a.source)
    return articles


def invalidate_cache() -> None:
    """Force reload from DB on next call."""
    global _cached_registry, _cache_loaded_at
    _cached_registry = None
    _cache_loaded_at = 0.0
