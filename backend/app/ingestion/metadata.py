"""
Deterministic metadata extractor and parser.
Strictly non-AI, plain Python.
"""
from __future__ import annotations
import re
from datetime import datetime, timezone
from urllib.parse import urlparse


def normalize_source_name(raw_source: str | None, url: str) -> str:
    """Derive clean publisher name from raw source tag or URL domain."""
    if raw_source and raw_source.strip() and raw_source.strip().lower() not in {"unknown", "feed", "rss"}:
        return raw_source.strip()
    try:
        domain = urlparse(url).netloc
        domain = re.sub(r"^www\.", "", domain)
        return domain.capitalize() if domain else "Unknown"
    except Exception:
        return "Unknown"


def parse_iso_date(date_str: str | None) -> str:
    """Parse various RSS/API date formats into ISO 8601 UTC timestamp."""
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()
