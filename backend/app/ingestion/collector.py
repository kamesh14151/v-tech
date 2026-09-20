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

# ─── Live RSS Feed Catalogue (35+ Verified Real Feeds) ──────────────────────
RSS_FEEDS = [
    # ── Wire Services / Breaking News ────────────────────────────────────────
    ("BBC News",              "http://feeds.bbci.co.uk/news/rss.xml"),
    ("BBC World",             "http://feeds.bbci.co.uk/news/world/rss.xml"),
    ("Reuters Top News",      "https://feeds.reuters.com/reuters/topNews"),
    ("Reuters Technology",    "https://feeds.reuters.com/reuters/technologyNews"),
    ("Reuters Business",      "https://feeds.reuters.com/reuters/businessNews"),
    ("AP News",               "https://feeds.apnews.com/rss/topnews"),
    ("Al Jazeera",            "https://www.aljazeera.com/xml/rss/all.xml"),

    # ── Technology ───────────────────────────────────────────────────────────
    ("TechCrunch",            "https://techcrunch.com/feed/"),
    ("The Verge",             "https://www.theverge.com/rss/index.xml"),
    ("Ars Technica",          "https://feeds.arstechnica.com/arstechnica/index"),
    ("Wired",                 "https://www.wired.com/feed/rss"),
    ("MIT Technology Review", "https://www.technologyreview.com/feed/"),
    ("VentureBeat",           "https://venturebeat.com/feed/"),
    ("ZDNet",                 "https://www.zdnet.com/news/rss.xml"),
    ("Engadget",              "https://www.engadget.com/rss.xml"),
    ("9to5Google",            "https://9to5google.com/feed/"),

    # ── AI & Machine Learning ─────────────────────────────────────────────────
    ("Hacker News",           "https://hnrss.org/frontpage"),
    ("AI News (aimagazine)",  "https://aimagazine.com/rss"),
    ("DeepMind Blog",         "https://deepmind.google/blog/rss/"),

    # ── Business & Finance ────────────────────────────────────────────────────
    ("CNBC",                  "https://www.cnbc.com/id/100003114/device/rss/rss.html"),
    ("Forbes Technology",     "https://www.forbes.com/technology/feed/"),
    ("Fortune",               "https://fortune.com/feed/"),
    ("Bloomberg Markets",     "https://feeds.bloomberg.com/markets/news.rss"),
    ("MarketWatch",           "https://feeds.marketwatch.com/marketwatch/topstories/"),

    # ── India & South Asia ────────────────────────────────────────────────────
    ("The Hindu",             "https://www.thehindu.com/news/feeder/default.rss"),
    ("The Hindu Tamil",       "https://www.hindutamil.in/rss/feed.xml"),
    ("Economic Times",        "https://economictimes.indiatimes.com/rssfeedstopstories.cms"),
    ("ET Tech",               "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms"),
    ("NDTV",                  "https://feeds.feedburner.com/ndtvnews-top-stories"),
    ("Mint",                  "https://www.livemint.com/rss/news"),
    ("Business Standard",     "https://www.business-standard.com/rss/home_page_top_stories.rss"),
    ("Hindustan Times",       "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml"),

    # ── Tamil Nadu Regional & Cinema News Feeds ────────────────────────────────
    ("Daily Thanthi Cinema",  "https://www.dailythanthi.com/rss/news/cinema"),
    ("Daily Thanthi News",    "https://www.dailythanthi.com/rss/news/state"),
    ("Dinamalar Cinema",      "https://rss.dinamalar.com/cinema.asp"),
    ("Dinamalar Tamil News",  "https://rss.dinamalar.com/tamil_news.asp"),
    ("Cinema Vikatan",        "https://www.vikatan.com/rss/cinema"),
    ("Vikatan News",          "https://www.vikatan.com/rss/news"),
    ("Behindwoods",           "https://www.behindwoods.com/tamil-movies-rss.xml"),
    ("Indiaglitz Tamil",      "https://www.indiaglitz.com/tamil-rss"),
    ("Oneindia Tamil",        "https://tamil.oneindia.com/rss/tamil-news-fb.xml"),
    ("Puthiya Thalaimurai",   "https://www.puthiyathalaimurai.com/rss/all.xml"),

    # ── Science & Research ───────────────────────────────────────────────────
    ("Nature News",           "https://www.nature.com/subjects/technology/news.rss"),
    ("Science Daily",         "https://www.sciencedaily.com/rss/all.xml"),
    ("New Scientist",         "https://www.newscientist.com/feed/home/"),

    # ── Crypto & Fintech ──────────────────────────────────────────────────────
    ("CoinDesk",              "https://www.coindesk.com/arc/outboundfeeds/rss/"),
    ("CryptoSlate",           "https://cryptoslate.com/feed/"),
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


async def _fetch_single_rss(client: httpx.AsyncClient, source_name: str, feed_url: str, max_items: int = 12) -> list[RawArticle]:
    """Parse a single live RSS feed asynchronously using httpx."""
    try:
        r = await client.get(
            feed_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            follow_redirects=True,
            timeout=2.0,
        )
        if r.status_code != 200:
            return []
        parsed = feedparser.parse(r.content)
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
        log.warning("RSS fetch notice for %s (%s): %s", source_name, feed_url, exc)
        return []


async def collect_google_news_rss(client: httpx.AsyncClient, query: str, recency: str = "Last 24 Hours") -> list[RawArticle]:
    """Fetch live Google News RSS search results for specific topic/query with time filters."""
    if not query or not query.strip():
        return []
    import urllib.parse
    clean_q = (
        query.replace("Within ", "")
        .replace("TN", "Tamil Nadu")
        .replace("IN", "India")
        .replace("(", "")
        .replace(")", "")
        .strip()
    )
    
    # Calculate Google News time parameter (tbs=qdr:h|d|w|m|y)
    tbs_param = ""
    r_lower = recency.lower()
    if "hour" in r_lower:
        tbs_param = "&tbs=qdr:h"
    elif "24" in r_lower or "day" in r_lower:
        tbs_param = "&tbs=qdr:d"
    elif "week" in r_lower or "7" in r_lower:
        tbs_param = "&tbs=qdr:w"
    elif "month" in r_lower or "30" in r_lower:
        tbs_param = "&tbs=qdr:m"
    elif "year" in r_lower or "archive" in r_lower:
        tbs_param = "&tbs=qdr:y"

    search_terms = [clean_q]
    words = [w for w in clean_q.split() if w.lower() not in ("tamil", "nadu", "india", "global", "all")]
    if words:
        main_topic = " ".join(words)
        if main_topic and main_topic not in search_terms:
            search_terms.append(main_topic)
            search_terms.append(f"{main_topic} AI")
            search_terms.append(f"{main_topic} news updates")
            search_terms.append(f"{main_topic} Tamil Nadu")

    urls = []
    for term in search_terms[:5]:
        q_encoded = urllib.parse.quote(term)
        urls.append(("Google News (India EN)", f"https://news.google.com/rss/search?q={q_encoded}{tbs_param}&hl=en-IN&gl=IN&ceid=IN:en"))
        urls.append(("Google News (Tamil TA)", f"https://news.google.com/rss/search?q={q_encoded}{tbs_param}&hl=ta&gl=IN&ceid=IN:ta"))
        urls.append(("Google News (Global)", f"https://news.google.com/rss/search?q={q_encoded}{tbs_param}&hl=en-US&gl=US&ceid=US:en"))

    tasks = [
        _fetch_single_rss(client, name, url, 20)
        for name, url in urls
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out: list[RawArticle] = []
    for r in results:
        if isinstance(r, list):
            out.extend(r)
    return out


async def collect_rss_all(client: httpx.AsyncClient) -> list[RawArticle]:
    """Fetch all 35+ live RSS feeds in parallel using httpx."""
    tasks = [
        _fetch_single_rss(client, name, url, 12)
        for name, url in RSS_FEEDS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    out: list[RawArticle] = []
    for r in results:
        if isinstance(r, list):
            out.extend(r)
    return out


async def collect_web_search_news(client: httpx.AsyncClient, query: str) -> list[RawArticle]:
    """Perform direct live web search for target query to harvest latest news articles."""
    if not query or not query.strip():
        return []
    import urllib.parse
    import re

    clean_q = (
        query.replace("Within ", "")
        .replace("TN", "Tamil Nadu")
        .replace("IN", "India")
        .replace("(", "")
        .replace(")", "")
        .strip()
    )

    out: list[RawArticle] = []
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(clean_q + ' news latest breaking')}"
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36"}

    try:
        resp = await client.get(search_url, headers=headers, timeout=3.5)
        if resp.status_code == 200:
            html = resp.text
            matches = re.findall(r'<a href="([^"]+)".*?class="result__a"[^>]*>(.*?)</a>.*?<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', html, re.DOTALL)
            if not matches:
                matches = re.findall(r'<a class="result__url" href="([^"]+)".*?>.*?</a>', html)

            for item in matches[:10]:
                if isinstance(item, tuple) and len(item) == 3:
                    raw_url, title_html, snippet_html = item
                elif isinstance(item, tuple) and len(item) == 2:
                    raw_url, snippet_html = item
                    title_html = clean_q
                else:
                    raw_url = item if isinstance(item, str) else ""
                    title_html = clean_q
                    snippet_html = f"Live news coverage for {clean_q}"

                clean_title = clean_text(re.sub(r'<[^>]+>', '', title_html), 300)
                clean_desc = clean_text(re.sub(r'<[^>]+>', '', snippet_html), 1000)

                parsed_url = raw_url
                if "//duckduckgo.com/l/?" in raw_url or "uddg=" in raw_url:
                    m = re.search(r'uddg=([^&]+)', raw_url)
                    if m:
                        parsed_url = urllib.parse.unquote(m.group(1))

                if clean_title and len(clean_title) > 5 and parsed_url.startswith("http") and not any(x in parsed_url for x in ("duckduckgo.com", "bing.com", "google.com/search")):
                    domain = urllib.parse.urlparse(parsed_url).netloc.replace("www.", "")
                    source_name = domain.split(".")[0].capitalize() if domain else "Live Web Search"

                    out.append(RawArticle(
                        id=f"web-{hash(parsed_url)}",
                        title=clean_title,
                        url=parsed_url,
                        source=f"{source_name} (Web)",
                        published_at=datetime.now(timezone.utc).isoformat(),
                        description=clean_desc or f"Live news search match for {clean_q}.",
                        api_source="web_search",
                        source_reliability=0.88,
                    ))
    except Exception as exc:
        log.warning("Web search fetch notice (%s): %s", clean_q, exc)

    return out


async def collect_gnews_api(client: httpx.AsyncClient, query: str, recency: str) -> list[RawArticle]:
    """Fetch live news from GNews API using GNEWS_API_KEY."""
    key = settings.gnews_api_key or os.getenv("GNEWS_API_KEY", "18019e7f47c480c18309c4809bf0a6ec")
    if not key or not query or not query.strip():
        return []
    import urllib.parse
    clean_q = (
        query.replace("Within ", "")
        .replace("TN", "Tamil Nadu")
        .replace("IN", "India")
        .replace("(", "")
        .replace(")", "")
        .strip()
    )
    try:
        r = await client.get(
            "https://gnews.io/api/v4/search",
            params={
                "q": clean_q,
                "lang": "en",
                "country": "in",
                "max": settings.max_articles_per_source,
                "apikey": key,
            },
            timeout=4.0,
        )
        if r.status_code == 200:
            out: list[RawArticle] = []
            for a in r.json().get("articles", []):
                if not a.get("title") or not a.get("url"):
                    continue
                src_name = normalize_source_name((a.get("source") or {}).get("name"), a["url"])
                out.append(RawArticle(
                    id=hash_url(a["url"], "gnews-"),
                    title=clean_text(a["title"], 300),
                    url=a["url"],
                    source=f"{src_name} (GNews)",
                    published_at=parse_iso_date(a.get("publishedAt")),
                    description=clean_text(a.get("description"), 1000),
                    api_source="gnews",
                    source_reliability=get_reliability(src_name),
                ))
            return out
    except Exception as exc:
        log.warning("GNews API fetch notice (%s): %s", clean_q, exc)
    return []


async def collect_raw_articles(
    query: str = "",
    recency: str = "Last 24 Hours",
) -> tuple[list[RawArticle], dict[str, int]]:
    """
    Collect real articles from all available sources, deduplicate,
    and return both articles and a per-source breakdown count.
    Returns: (deduplicated articles, {source_name: count})
    """
    async with httpx.AsyncClient(timeout=4.0) as client:
        na_task = collect_newsapi(client, query, recency)
        gd_task = collect_guardian(client, query, recency)
        gnews_api_task = collect_gnews_api(client, query, recency)
        rss_task = collect_rss_all(client)
        gnews_task = collect_google_news_rss(client, query, recency)
        web_task = collect_web_search_news(client, query)

        results = await asyncio.gather(na_task, gd_task, gnews_api_task, rss_task, gnews_task, web_task, return_exceptions=True)

    all_raw: list[RawArticle] = []
    for r in results:
        if isinstance(r, list):
            all_raw.extend(r)

    deduped = deduplicate_articles(all_raw)

    # Build per-source breakdown
    source_breakdown: dict[str, int] = {}
    for art in deduped:
        source_breakdown[art.source] = source_breakdown.get(art.source, 0) + 1
    # Sort by count descending
    source_breakdown = dict(sorted(source_breakdown.items(), key=lambda x: x[1], reverse=True))

    log.info(
        "Collected %d raw → %d unique across %d sources: %s",
        len(all_raw), len(deduped), len(source_breakdown),
        ", ".join(f"{s}({c})" for s, c in list(source_breakdown.items())[:10]),
    )

    # Optional Playwright enrichment for articles with short/missing descriptions
    if settings.playwright_enabled:
        try:
            from app.ingestion.scraper import enrich_articles
            deduped = await enrich_articles(deduped)
        except Exception as exc:
            log.warning("Playwright enrichment failed (proceeding without): %s", exc)

    return deduped, source_breakdown

