"""
API Routes for Report History and Saved Reports.

Endpoints:
  GET /v1/reports/latest   — Fetch most recently generated report
  GET /v1/reports/history  — Fetch list of historical reports
  GET /v1/reports/{id}     — Fetch a specific saved report by ID
"""
from __future__ import annotations
import json
import logging
import psycopg
from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings

router = APIRouter()
log = logging.getLogger(__name__)


def _db_url() -> str:
    return settings.database_url.replace('+psycopg', '')


def _ensure_saved_reports_table():
    try:
        with psycopg.connect(_db_url()) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS saved_reports (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER,
                    user_email VARCHAR(255),
                    query VARCHAR(300),
                    topic_domain VARCHAR(150),
                    location VARCHAR(100),
                    recency VARCHAR(50),
                    report_data JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_saved_reports_email ON saved_reports(user_email);
                CREATE INDEX IF NOT EXISTS idx_saved_reports_created ON saved_reports(created_at DESC);
                """
            )
            conn.commit()
    except Exception as e:
        log.warning("Table creation notice: %s", e)


@router.get('/reports/latest')
async def get_latest_report(user_email: str = Query(default='')):
    _ensure_saved_reports_table()
    try:
        with psycopg.connect(_db_url()) as conn:
            if user_email and user_email.strip():
                row = conn.execute(
                    """
                    SELECT id, query, topic_domain, location, recency, report_data, created_at
                    FROM saved_reports
                    WHERE user_email = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (user_email.strip(),),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT id, query, topic_domain, location, recency, report_data, created_at
                    FROM saved_reports
                    ORDER BY created_at DESC
                    LIMIT 1
                    """
                ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="No saved report found.")

            report_data = row[5]
            if isinstance(report_data, str):
                report_data = json.loads(report_data)
            report_data['reportId'] = row[0]
            report_data['createdAt'] = row[6].isoformat() if row[6] else None
            return report_data
    except HTTPException:
        raise
    except Exception as e:
        log.error("Failed to get latest report: %s", e)
        raise HTTPException(status_code=500, detail="Database query error")


@router.get('/reports/history')
async def get_report_history(user_email: str = Query(default=''), limit: int = Query(default=20, le=100)):
    _ensure_saved_reports_table()
    try:
        with psycopg.connect(_db_url()) as conn:
            if user_email and user_email.strip():
                rows = conn.execute(
                    """
                    SELECT id, query, topic_domain, location, recency, created_at,
                           report_data->>'totalArticles' as total_articles,
                           report_data->>'executiveSummary' as summary
                    FROM saved_reports
                    WHERE user_email = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (user_email.strip(), limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT id, query, topic_domain, location, recency, created_at,
                           report_data->>'totalArticles' as total_articles,
                           report_data->>'executiveSummary' as summary
                    FROM saved_reports
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                ).fetchall()

            history = [
                {
                    "id": r[0],
                    "query": r[1],
                    "topic_domain": r[2],
                    "location": r[3],
                    "recency": r[4],
                    "created_at": r[5].isoformat() if r[5] else None,
                    "total_articles": int(r[6]) if r[6] else 0,
                    "summary": (r[7][:120] + "...") if r[7] else "",
                }
                for r in rows
            ]
            return {"history": history}
    except Exception as e:
        log.error("Failed to get report history: %s", e)
        raise HTTPException(status_code=500, detail="Database query error")


@router.get('/reports/{report_id}')
async def get_report_by_id(report_id: int):
    _ensure_saved_reports_table()
    try:
        with psycopg.connect(_db_url()) as conn:
            row = conn.execute(
                """
                SELECT id, query, topic_domain, location, recency, report_data, created_at
                FROM saved_reports
                WHERE id = %s
                """,
                (report_id,),
            ).fetchone()

            if not row:
                raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")

            report_data = row[5]
            if isinstance(report_data, str):
                report_data = json.loads(report_data)
            report_data['reportId'] = row[0]
            report_data['createdAt'] = row[6].isoformat() if row[6] else None
            return report_data
    except HTTPException:
        raise
    except Exception as e:
        log.error("Failed to fetch report %s: %s", report_id, e)
        raise HTTPException(status_code=500, detail="Database query error")
