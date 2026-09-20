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
    "stalin", "cm stalin", "tidco", "sipcot", "tidel", "kollywood",
    "vijay", "ajith", "rajinikanth", "kamal", "suriya", "dhanush",
    "sivakarthikeyan", "trisha", "nayanthara", "anirudh", "ar rahman",
    "vetrimaran", "lokesh", "kanguva", "coolie", "goat", "viduthalai",
}

INDIA_SIGNALS = {
    "india", "indian", "delhi", "new delhi", "mumbai", "bengaluru",
    "bangalore", "hyderabad", "kolkata", "pune", "ahmedabad", "rbi",
    "sebi", "isro", "niti aayog", "rupee", "lakh", "crore",
}

DEFAULT_EXCLUSIONS = {
    "horoscope", "astrology", "crossword", "sudoku", "lottery",
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


DOMAIN_SYNONYMS = {
    "cinema": {"movie", "movies", "film", "films", "actor", "actress", "director", "kollywood", "bollywood", "hollywood", "cinema", "entertainment", "ott", "series", "trailer", "song", "release", "theatre", "box office", "starrer", "hero", "heroine", "cast", "review"},
    "entertainment": {"movie", "movies", "film", "films", "actor", "actress", "director", "kollywood", "bollywood", "hollywood", "cinema", "entertainment", "ott", "series", "trailer", "song", "release", "theatre", "box office", "starrer", "hero", "heroine", "cast", "review"},
    "sports": {"cricket", "sports", "match", "ipl", "bcci", "t20", "test", "odi", "stadium", "trophy", "cup", "champion", "team", "player", "captain", "score", "wicket", "run", "football"},
    "cricket": {"cricket", "sports", "match", "ipl", "bcci", "t20", "test", "odi", "stadium", "trophy", "cup", "champion", "team", "player", "captain", "score", "wicket", "run"},
    "tech": {"tech", "technology", "it", "software", "ai", "artificial intelligence", "app", "digital", "startup", "cloud", "cyber", "data", "mobile", "gadget"},
    "banking": {"bank", "banking", "fintech", "finance", "financial", "payment", "upi", "rbi", "stock", "market", "share", "investment", "tax", "economy"},
}


def matches_keywords(text: str, keywords: Sequence[str]) -> bool:
    """Check if text contains any mandatory target keywords or domain synonyms."""
    if not keywords:
        return True
    text_lower = text.lower()
    
    # Check explicit keywords
    for kw in keywords:
        kw_clean = kw.lower().strip()
        if not kw_clean:
            continue
        if kw_clean in text_lower:
            return True
        # Check domain synonyms
        if kw_clean in DOMAIN_SYNONYMS:
            if any(syn in text_lower for syn in DOMAIN_SYNONYMS[kw_clean]):
                return True

    return False


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
        effective_kws.extend([w.strip().lower() for w in query.split() if len(w.strip()) > 2])
    if topic_domain and topic_domain.strip():
        effective_kws.extend([w.strip().lower() for w in topic_domain.split() if len(w.strip()) > 2])

    passed: list[RawArticle] = []

    sports_query = any(sp in f"{query} {topic_domain}".lower() for sp in {"cricket", "sports", "ipl", "bcci", "ashes", "football", "match", "t20", "odi", "stadium"})
    sports_terms = {"cricket", "ashes", "test coach", "bcci", "ipl", "t20", "odi", "wicket", "batsman", "bowler", "stadium", "fifa", "premier league", "champions league", "fleming"}

    target_query_words = [
        w.lower().strip()
        for w in query.split()
        if len(w.strip()) > 1 and w.lower() not in ("within", "india", "global", "all", "tamil", "nadu", "national", "tech", "companies", "cinema", "entertainment", "sports", "banking", "fintech")
    ]

    for a in articles:
        combined_text = f"{a.title} {a.description or ''}"

        # 1. Reject empty or micro-titles (< 15 characters)
        if len(a.title.strip()) < 15:
            dropped_empty += 1
            continue

        # 1.5 Reject sports news if query/topic is not a sports search
        if not sports_query and any(sp in combined_text.lower() for sp in sports_terms):
            dropped_exclusion += 1
            continue

        # 1.6 Reject articles that do not contain the target topic query word when specified
        if target_query_words and not any(t_word in combined_text.lower() for t_word in target_query_words):
            dropped_keyword += 1
            continue

        # 2. Reject explicit exclusions (horoscopes, gossip, etc.)
        if is_excluded(combined_text, exclusions):
            dropped_exclusion += 1
            continue

        # 3. Check geography boundaries (if restricted)
        if location and "all" not in location.lower() and "global" not in location.lower():
            if not matches_geography(combined_text, location):
                # Don't drop unconditionally if keyword strongly matches
                if not matches_keywords(combined_text, effective_kws):
                    dropped_geo += 1
                    continue

        # 4. Check keyword match if query or domain specified
        if effective_kws:
            if not matches_keywords(combined_text, effective_kws):
                dropped_keyword += 1
                continue

        passed.append(a)

    # Fallback safety: If passed is fewer than 15 articles but raw articles exist, supplement ONLY with relevant articles
    if len(passed) < 15 and articles:
        log.info("Pre-filter returned %d articles. Supplementing with matching raw articles.", len(passed))
        existing_ids = {a.id for a in passed}
        for a in articles:
            if a.id not in existing_ids and len(a.title.strip()) >= 15:
                combined_text = f"{a.title} {a.description or ''}"
                if not sports_query and any(sp in combined_text.lower() for sp in sports_terms):
                    continue
                if target_query_words and not any(t_word in combined_text.lower() for t_word in target_query_words):
                    continue
                # Ensure supplemental article is relevant to effective keywords if specified
                if effective_kws and not matches_keywords(combined_text, effective_kws):
                    continue
                passed.append(a)
                if len(passed) >= 35:
                    break

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
