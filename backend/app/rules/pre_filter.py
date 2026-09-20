"""
Deterministic Rule Pre-Filter Service.
Applied at ingestion stage BEFORE any vector search or LLM calls.
Zero AI / LLM involvement — purely deterministic rules.
"""
from __future__ import annotations
import logging
from typing import Any, Sequence

from app.schemas.news import RawArticle

log = logging.getLogger(__name__)

# Geography signal maps
TN_SIGNALS = {
    "tamil nadu", "tamilnadu", "chennai", "coimbatore", "madurai",
    "tiruchirappalli", "trichy", "salem", "tirunelveli", "hosur",
    "kancheepuram", "vellore", "erode", "thanjavur", "dmk", "aiadmk",
    "stalin", "cm stalin", "tidco", "sipcot", "tidel",
}

INDIA_SIGNALS = {
    "india", "indian", "delhi", "new delhi", "mumbai", "bengaluru",
    "bangalore", "hyderabad", "kolkata", "pune", "ahmedabad", "rbi",
    "sebi", "isro", "niti aayog", "rupee", "lakh", "crore",
}

DEFAULT_EXCLUSIONS = {
    "horoscope", "astrology", "crossword", "sudoku", "lottery",
    "celebrity gossip", "fashion show", "box office collection",
}


def matches_geography(text: str, location: str) -> bool:
    """Check if article matches location constraint."""
    loc_lower = location.lower()
    text_lower = text.lower()

    if "tamil nadu" in loc_lower or "tn" in loc_lower:
        return any(sig in text_lower for sig in TN_SIGNALS)
    elif "india" in loc_lower:
        return any(sig in text_lower for sig in INDIA_SIGNALS | TN_SIGNALS)
    return True  # Global / all locations allowed


def matches_keywords(text: str, keywords: Sequence[str]) -> bool:
    """Check if text contains any mandatory target keywords."""
    if not keywords:
        return True
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords if kw.strip())


def is_excluded(text: str, exclusions: Sequence[str] = ()) -> bool:
    """Check if text contains unwanted/excluded topics."""
    text_lower = text.lower()
    all_exclusions = DEFAULT_EXCLUSIONS.union({ex.lower() for ex in exclusions if ex.strip()})
    return any(ex in text_lower for ex in all_exclusions)


def apply_rule_pre_filter(
    articles: Sequence[RawArticle],
    query: str = "",
    topic_domain: str = "",
    location: str = "Within India",
    recency: str = "Last 24 Hours",
    keywords: Sequence[str] = (),
    exclusions: Sequence[str] = (),
) -> tuple[list[RawArticle], dict[str, Any]]:
    """
    Apply deterministic rule pre-filter to raw articles.
    
    Returns:
        (passed_articles, funnel_stats)
    """
    total_in = len(articles)
    dropped_empty = 0
    dropped_exclusion = 0
    dropped_geo = 0
    dropped_keyword = 0

    # Build effective keyword list from query and topic_domain
    effective_kws = list(keywords)
    if query and query.strip():
        effective_kws.extend([w.strip() for w in query.split() if len(w.strip()) > 3])
    if topic_domain and topic_domain.strip():
        effective_kws.append(topic_domain.strip())

    passed: list[RawArticle] = []

    for a in articles:
        combined_text = f"{a.title} {a.description or ''}"

        # 1. Reject empty or micro-titles (< 15 characters)
        if len(a.title.strip()) < 15:
            dropped_empty += 1
            continue

        # 2. Reject explicit exclusions (horoscopes, gossip, etc.)
        if is_excluded(combined_text, exclusions):
            dropped_exclusion += 1
            continue

        # 3. Check geography boundaries (if restricted)
        if location and "all" not in location.lower() and "global" not in location.lower():
            if not matches_geography(combined_text, location):
                # Don't drop unconditionally if keyword strongly matches, but track signal
                if not matches_keywords(combined_text, effective_kws):
                    dropped_geo += 1
                    continue

        # 4. Check keyword match if query or domain specified
        if effective_kws:
            if not matches_keywords(combined_text, effective_kws):
                dropped_keyword += 1
                continue

        passed.append(a)

    # Fallback safety: If passed is empty but raw articles exist, don't fail with 404 - return top raw articles
    if not passed and articles:
        log.info("Pre-filter resulted in 0 articles. Falling back to raw articles for analysis.")
        passed = list(articles)

    stats = {
        "total_in": total_in,
        "total_passed": len(passed),
        "dropped_empty": dropped_empty,
        "dropped_exclusion": dropped_exclusion,
        "dropped_geo": dropped_geo,
        "dropped_keyword": dropped_keyword,
        "pass_rate_pct": round((len(passed) / total_in * 100), 1) if total_in > 0 else 0.0,
    }

    log.info("Pre-filter funnel: %d in → %d passed (%.1f%%)", total_in, len(passed), stats["pass_rate_pct"])
    return passed, stats
