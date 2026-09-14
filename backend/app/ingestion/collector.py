"""
Real multi-source news collector (RSS feeds, NewsAPI, The Guardian).
Strictly deterministic network requests and parsing. Zero mock data.
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any
import feedparser
import httpx

from app.core.config import settings
from app.schemas.news import RawArticle
from app.services.source_reliability import get_reliability
from app.ingestion.cleaner import clean_text
from app.ingestion.dedup import hash_url, deduplicate_articles
from app.ingestion.metadata import normalize_source_name, parse_iso_date

log = logging.getLogger(__name__)

# ─── Live RSS Feed Catalogue (15 Verified Real Feeds) ───────────────────────
RSS_FEEDS = [
    # General / Wire
    ("BBC News", "http://feeds.bbci.co.uk/news/rss.xml"),
    ("Reuters Top News", "https://feeds.reuters.com/reuters/topNews"),
    ("Reuters Technology", "https://feeds.reuters.com/reuters/technologyNews"),
    ("Reuters Business", "https://feeds.reuters.com/reuters/businessNews"),
    # Technology
    ("TechCrunch", "https://techcrunch.com/feed/"),
    ("The Verge", "https://www.theverge.com/rss/index.xml"),
    ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
    ("Wired", "https://www.wired.com/feed/rss"),
    # Business & Finance
    ("CNBC", "https://www.cnbc.com/id/100003114/device/rss/rss.html"),
    ("Forbes Technology", "https://www.forbes.com/technology/feed/"),
    # India & Regional
    ("The Hindu", "https://www.thehindu.com/news/feeder/default.rss"),
    ("Economic Times", "https://economictimes.indiatimes.com/rssfeedstopstories.cms"),
    ("NDTV", "https://feeds.feedburner.com/ndtvnews-top-stories"),
    # Science & AI
    ("MIT Technology Review", "https://www.technologyreview.com/feed/"),
    ("Hacker News", "https://hnrss.org/frontpage"),
]


def _from_date(recency: str) -> str:
    days = 1 if "24" in recency else 7 if "7" in recency else 30 if "1 Month" in recency else 90 if "3 Month" in recency else 30
    return (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()


async def collect_newsapi(client: httpx.AsyncClient, query: str, recency: str) -> list[RawArticle]:
    """Fetch real articles from NewsAPI if configured."""
    if not settings.newsapi_key:
        return []
    try:
        r = await client.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "from": _from_date(recency),
                "pageSize": settings.max_articles_per_source,
                "sortBy": "publishedAt",
                "language": "en",
            },
            headers={"X-Api-Key": settings.newsapi_key},
            timeout=10.0,
        )
        r.raise_for_status()
        out: list[RawArticle] = []
        for a in r.json().get("articles", []):
            if not a.get("title") or a.get("title") == "[Removed]" or not a.get("url"):
                continue
            source_name = normalize_source_name((a.get("source") or {}).get("name"), a["url"])
            out.append(RawArticle(
                id=hash_url(a["url"], "na-"),
                title=clean_text(a["title"], 300),
                url=a["url"],
                source=source_name,
                published_at=parse_iso_date(a.get("publishedAt")),
                description=clean_text(a.get("description"), 1000),
                author=a.get("author"),
                api_source="newsapi",
                source_reliability=get_reliability(source_name),
            ))
        return out
    except Exception as exc:
        log.warning("NewsAPI collection error: %s", exc)
        return []


async def collect_guardian(client: httpx.AsyncClient, query: str, recency: str) -> list[RawArticle]:
    """Fetch real articles from The Guardian API if configured."""
    if not settings.guardian_api_key:
        return []
    try:
        r = await client.get(
            "https://content.guardianapis.com/search",
            params={
                "q": query,
                "from-date": _from_date(recency),
                "page-size": settings.max_articles_per_source,
                "show-fields": "headline,trailText,byline",
                "api-key": settings.guardian_api_key,
            },
            timeout=10.0,
        )
        r.raise_for_status()
        out: list[RawArticle] = []
        for a in r.json().get("response", {}).get("results", []):
            fields = a.get("fields") or {}
            out.append(RawArticle(
                id=hash_url(a.get("webUrl", ""), "gd-"),
                title=clean_text(fields.get("headline") or a.get("webTitle", ""), 300),
                url=a.get("webUrl", ""),
                source="The Guardian",
                published_at=parse_iso_date(a.get("webPublicationDate")),
                description=clean_text(fields.get("trailText"), 1000),
                author=fields.get("byline"),
                api_source="guardian",
                source_reliability=get_reliability("The Guardian"),
            ))
        return out
    except Exception as exc:
        log.warning("Guardian collection error: %s", exc)
        return []


def _fetch_rss_sync(source_name: str, feed_url: str, max_items: int = 15) -> list[RawArticle]:
    """Parse a single live RSS feed synchronously."""
    try:
        parsed = feedparser.parse(
            feed_url,
            agent="Mozilla/5.0 (NewsIntelBot/2.0; +https://antigravity.internal)",
            request_headers={"Accept": "application/rss+xml, application/xml, text/xml"},
        )
        out: list[RawArticle] = []
        for entry in parsed.entries[:max_items]:
            title = getattr(entry, "title", "")
            link = getattr(entry, "link", "")
            if not title or not link:
                continue

            summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            pub_date = parse_iso_date(getattr(entry, "published", None) or getattr(entry, "updated", None))
            src = normalize_source_name(source_name, link)

            out.append(RawArticle(
                id=hash_url(link, "rss-"),
                title=clean_text(title, 300),
                url=link,
                source=src,
                published_at=pub_date,
                description=clean_text(summary, 1000),
                author=getattr(entry, "author", None),
                api_source="rss",
                source_reliability=get_reliability(src),
            ))
        return out
    except Exception as exc:
        log.warning("RSS fetch error for %s (%s): %s", source_name, feed_url, exc)
        return []


async def collect_rss_all() -> list[RawArticle]:
    """Fetch all 15 live RSS feeds in parallel."""
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(None, _fetch_rss_sync, name, url, 12)
        for name, url in RSS_FEEDS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out: list[RawArticle] = []
    for r in results:
        if isinstance(r, list):
            out.extend(r)
    return out


async def collect_raw_articles(
    query: str = "",
    recency: str = "Last 24 Hours",
) -> list[RawArticle]:
    """
    Collect real articles from all available sources, deduplicate,
    and optionally enrich with Playwright scraping.
    Returns deduplicated list of RawArticle objects.
    """
    async with httpx.AsyncClient(timeout=12.0) as client:
        na_task = collect_newsapi(client, query, recency)
        gd_task = collect_guardian(client, query, recency)
        rss_task = collect_rss_all()

        results = await asyncio.gather(na_task, gd_task, rss_task, return_exceptions=True)

    all_raw: list[RawArticle] = []
    for r in results:
        if isinstance(r, list):
            all_raw.extend(r)

    deduped = deduplicate_articles(all_raw)
    log.info("Collected %d raw articles (%d unique after dedup)", len(all_raw), len(deduped))

    # Optional Playwright enrichment for articles with short/missing descriptions
    if settings.playwright_enabled:
        try:
            from app.ingestion.scraper import enrich_articles
            deduped = await enrich_articles(deduped)
        except Exception as exc:
            log.warning("Playwright enrichment failed (proceeding without): %s", exc)

    return deduped
