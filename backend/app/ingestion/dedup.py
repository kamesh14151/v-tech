"""
Deterministic deduplication utilities for ingested articles.
Strictly non-AI, plain Python.
"""
from __future__ import annotations
import hashlib
import re
from typing import Sequence
from app.schemas.news import RawArticle


def hash_url(url: str, prefix: str = "art-") -> str:
    """Generate deterministic SHA256 ID from normalized URL."""
    cleaned = url.strip().split("#")[0].split("?utm_")[0]
    return prefix + hashlib.sha256(cleaned.encode()).hexdigest()[:16]


def normalize_title(title: str) -> str:
    """Normalize title for fuzzy exact matching."""
    cleaned = title.lower()
    cleaned = re.sub(r"[^\w\s]", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def deduplicate_articles(articles: Sequence[RawArticle]) -> list[RawArticle]:
    """Deduplicate articles by exact URL hash and normalized title."""
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    unique: list[RawArticle] = []

    for a in articles:
        canon_url = a.url.strip().split("#")[0].split("?utm_")[0]
        norm_t = normalize_title(a.title)

        if canon_url in seen_urls:
            continue
        if norm_t and norm_t in seen_titles:
            continue

        seen_urls.add(canon_url)
        if norm_t:
            seen_titles.add(norm_t)
        unique.append(a)

    return unique
