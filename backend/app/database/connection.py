"""
PostgreSQL connection management using psycopg v3.
Provides async connection context for FastAPI lifespan and repositories.
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import psycopg
from psycopg.rows import dict_row

from app.core.config import settings

log = logging.getLogger(__name__)


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[psycopg.AsyncConnection, None]:
    """Provide an asynchronous database connection yielding dict rows."""
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not configured.")
    
    conn = await psycopg.AsyncConnection.connect(
        settings.database_url,
        row_factory=dict_row,
    )
    try:
        yield conn
    finally:
        await conn.close()


async def check_db_health() -> bool:
    """Verify database connectivity."""
    try:
        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                res = await cur.fetchone()
                return bool(res and res[0] == 1)
    except Exception as exc:
        log.warning("Database health check failed: %s", exc)
        return False
