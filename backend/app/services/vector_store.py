"""
Vector Store — pgvector HNSW integration.

Provides:
    embed_and_store(articles) → upsert embeddings into article_embeddings table
    similarity_search(query_text, k) → return top-k article IDs by cosine similarity
    embed_text(text) → just get the vector for a query

Used by the Discovery Agent for two-stage retrieval:
    keyword_filter → vector_similarity → LLM_validation
"""
from __future__ import annotations
import logging
from typing import TYPE_CHECKING

import psycopg

from app.core.config import settings
from app.services.llm import llm

if TYPE_CHECKING:
    from app.schemas.news import RawArticle

log = logging.getLogger(__name__)


def _conn():
    """Open a psycopg connection to PostgreSQL."""
    url = settings.database_url.replace('+psycopg', '')
    return psycopg.connect(url)


def embed_text(text: str) -> list[float]:
    """Generate an embedding vector for arbitrary text."""
    try:
        return llm.embed(text[:4000])  # stay within token limits
    except Exception as exc:
        log.warning('Embedding failed: %s', exc)
        return []


def embed_and_store(articles: list) -> None:
    """
    Generate embeddings for articles and upsert into article_embeddings.
    Skips articles that already have an embedding stored.
    """
    if not articles:
        return
    try:
        with _conn() as conn:
            for article in articles:
                text = f'{article.title}. {article.description or ""}'
                vec = embed_text(text)
                if not vec:
                    continue
                vec_str = '[' + ','.join(str(v) for v in vec) + ']'
                conn.execute(
                    """
                    INSERT INTO article_embeddings (article_id, embedding)
                    VALUES (%s, %s::vector)
                    ON CONFLICT (article_id) DO NOTHING
                    """,
                    (article.id, vec_str),
                )
            conn.commit()
    except Exception as exc:
        log.warning('embed_and_store failed: %s', exc)


def similarity_search(query_text: str, k: int = 30) -> list[str]:
    """
    Find the top-k article IDs whose embeddings are closest to query_text.
    Uses cosine distance (<=> operator) with the HNSW index.

    Returns a list of article_id strings, ordered by similarity (most similar first).
    """
    query_vec = embed_text(query_text)
    if not query_vec:
        return []
    try:
        vec_str = '[' + ','.join(str(v) for v in query_vec) + ']'
        with _conn() as conn:
            rows = conn.execute(
                """
                SELECT article_id
                FROM article_embeddings
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (vec_str, k),
            ).fetchall()
        return [r[0] for r in rows]
    except Exception as exc:
        log.warning('similarity_search failed: %s', exc)
        return []
