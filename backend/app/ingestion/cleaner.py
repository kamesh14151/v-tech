"""
Deterministic text and article cleaning utilities.
Strictly non-AI, plain Python.
"""
from __future__ import annotations
import html
import re


TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")
BOILERPLATE_PATTERNS = [
    re.compile(r"^read more at\b.*$", re.IGNORECASE),
    re.compile(r"^subscribe to our newsletter\b.*$", re.IGNORECASE),
    re.compile(r"copyright \d{4}.*all rights reserved", re.IGNORECASE),
]


def strip_html(raw_text: str | None) -> str:
    """Strip HTML tags and unescape HTML entities."""
    if not raw_text:
        return ""
    text = TAG_RE.sub(" ", raw_text)
    text = html.unescape(text)
    return WHITESPACE_RE.sub(" ", text).strip()


def clean_text(text: str | None, max_chars: int = 1500) -> str:
    """Clean text by stripping HTML, removing boilerplate, and trimming length."""
    if not text:
        return ""
    cleaned = strip_html(text)
    for pattern in BOILERPLATE_PATTERNS:
        cleaned = pattern.sub("", cleaned).strip()
    if len(cleaned) > max_chars:
        cleaned = cleaned[:max_chars].rstrip() + "..."
    return cleaned
