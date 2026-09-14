"""
Playwright + BeautifulSoup full-page scraper.

Optional enrichment source that scrapes full article content from URLs
where the RSS/API description is truncated or missing.

Enabled via PLAYWRIGHT_ENABLED=true in settings.
Falls back gracefully if Playwright is not installed or fails.

This is strictly deterministic — no AI/LLM involvement.
"""
from __future__ import annotations
import logging
import asyncio
from typing import Any

from bs4 import BeautifulSoup

from app.core.config import settings

log = logging.getLogger(__name__)


async def scrape_article_content(url: str, timeout_ms: int | None = None) -> dict[str, str]:
    """
    Scrape full article content from a URL using Playwright.

    Returns:
        {
            'title': str,
            'content': str,       # cleaned full-text content
            'author': str,
            'published_at': str,
            'description': str,   # meta description
        }
    """
    timeout = timeout_ms or settings.playwright_timeout_ms

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log.debug('Playwright not installed — scraping disabled')
        return {}

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ),
                viewport={'width': 1280, 'height': 720},
            )
            page = await context.new_page()

            # Block unnecessary resources for speed
            await page.route(
                '**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,eot,mp4,webm,mp3}',
                lambda route: route.abort(),
            )

            await page.goto(url, timeout=timeout, wait_until='domcontentloaded')

            # Wait a bit for dynamic content to load
            await asyncio.sleep(1)

            html = await page.content()
            await browser.close()

        return _extract_article(html, url)

    except Exception as exc:
        log.debug('Playwright scrape failed for %s: %s', url, exc)
        return {}


def _extract_article(html: str, url: str) -> dict[str, str]:
    """Extract article content from HTML using BeautifulSoup heuristics."""
    soup = BeautifulSoup(html, 'html.parser')

    # Remove script, style, nav, footer, header elements
    for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe']):
        tag.decompose()

    # Title extraction
    title = ''
    og_title = soup.find('meta', property='og:title')
    if og_title and og_title.get('content'):
        title = og_title['content']
    elif soup.find('h1'):
        title = soup.find('h1').get_text(strip=True)
    elif soup.title:
        title = soup.title.get_text(strip=True)

    # Author extraction
    author = ''
    author_meta = soup.find('meta', attrs={'name': 'author'})
    if author_meta and author_meta.get('content'):
        author = author_meta['content']
    else:
        # Common author patterns
        for selector in ['.author', '.byline', '[rel="author"]', '.article-author']:
            el = soup.select_one(selector)
            if el:
                author = el.get_text(strip=True)
                break

    # Published date
    published_at = ''
    for attr in ['article:published_time', 'datePublished', 'date']:
        meta = soup.find('meta', property=attr) or soup.find('meta', attrs={'name': attr})
        if meta and meta.get('content'):
            published_at = meta['content']
            break
    if not published_at:
        time_el = soup.find('time')
        if time_el and time_el.get('datetime'):
            published_at = time_el['datetime']

    # Description
    description = ''
    og_desc = soup.find('meta', property='og:description')
    if og_desc and og_desc.get('content'):
        description = og_desc['content']
    else:
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc['content']

    # Content extraction (try common article containers)
    content = ''
    article_selectors = [
        'article',
        '[role="main"]',
        '.article-body',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.story-body',
        '#article-body',
        '.content-body',
        'main',
    ]
    for selector in article_selectors:
        el = soup.select_one(selector)
        if el:
            # Get paragraphs within article container
            paragraphs = el.find_all('p')
            if paragraphs:
                content = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 20)
                if len(content) > 200:
                    break

    # Fallback: get all paragraphs
    if len(content) < 200:
        all_paragraphs = soup.find_all('p')
        content = '\n\n'.join(
            p.get_text(strip=True)
            for p in all_paragraphs
            if len(p.get_text(strip=True)) > 30
        )

    # Truncate to reasonable length
    if len(content) > 10000:
        content = content[:10000].rstrip() + '...'

    return {
        'title': title.strip(),
        'content': content.strip(),
        'author': author.strip(),
        'published_at': published_at.strip(),
        'description': description.strip(),
    }


async def enrich_articles(articles: list[Any], max_pages: int | None = None) -> list[Any]:
    """
    Enrich articles with full content via Playwright scraping.
    Only scrapes articles with missing/short descriptions.
    Modifies articles in-place.
    """
    if not settings.playwright_enabled:
        return articles

    max_pages = max_pages or settings.playwright_max_pages
    candidates = [a for a in articles if not a.description or len(a.description) < 100]
    to_scrape = candidates[:max_pages]

    if not to_scrape:
        return articles

    log.info('Playwright: enriching %d/%d articles with short descriptions', len(to_scrape), len(articles))

    tasks = [scrape_article_content(a.url) for a in to_scrape]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    enriched_count = 0
    for article, result in zip(to_scrape, results):
        if isinstance(result, dict) and result.get('content'):
            if not article.description or len(result['content']) > len(article.description or ''):
                article.description = result['content'][:1500]
                enriched_count += 1
            if result.get('author') and not article.author:
                article.author = result['author']

    log.info('Playwright: enriched %d articles with full content', enriched_count)
    return articles
