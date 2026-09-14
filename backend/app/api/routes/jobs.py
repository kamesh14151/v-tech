"""
POST /v1/jobs/analyze — Submit an analysis as a background job.
GET  /v1/jobs — List recent background jobs.
GET  /v1/jobs/{job_id} — Get status of a specific job.
"""
from __future__ import annotations
import json
import uuid

import psycopg
from arq.connections import create_pool as arq_create_pool
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter()


class BackgroundAnalyzeRequest(BaseModel):
    query: str = Field(min_length=1, max_length=300)
    location: str = 'Global (All)'
    recency: str = 'Last 24 Hours'
    keywords: list[str] = Field(default_factory=list)


@router.post('/jobs/analyze')
async def submit_analysis_job(req: BackgroundAnalyzeRequest):
    """Submit an analysis pipeline run as a background job."""
    from app.worker import _parse_redis_settings

    try:
        pool = await arq_create_pool(_parse_redis_settings())
        job = await pool.enqueue_job(
            'run_analysis_task',
            req.query,
            req.location,
            req.recency,
            req.keywords,
        )
        await pool.close()

        return {
            'job_id': job.job_id,
            'status': 'queued',
            'query': req.query,
            'message': 'Analysis job submitted. Poll GET /v1/jobs/{job_id} for status.',
        }
    except Exception as exc:
        raise HTTPException(500, f'Failed to submit job: {exc}')


@router.get('/jobs')
async def list_jobs(
    status: str | None = Query(None, description='Filter: queued|running|completed|failed'),
    limit: int = Query(20, ge=1, le=100),
):
    """List recent background jobs."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            if status:
                rows = conn.execute(
                    '''SELECT job_id, job_type, query, status, result, error, started_at, completed_at, created_at
                       FROM background_jobs WHERE status = %s
                       ORDER BY created_at DESC LIMIT %s''',
                    (status, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    '''SELECT job_id, job_type, query, status, result, error, started_at, completed_at, created_at
                       FROM background_jobs
                       ORDER BY created_at DESC LIMIT %s''',
                    (limit,),
                ).fetchall()
        jobs = [
            {
                'job_id': r[0], 'job_type': r[1], 'query': r[2],
                'status': r[3],
                'result': json.loads(r[4]) if isinstance(r[4], str) else r[4],
                'error': r[5],
                'started_at': str(r[6]) if r[6] else None,
                'completed_at': str(r[7]) if r[7] else None,
                'created_at': str(r[8]) if r[8] else None,
            }
            for r in rows
        ]
        return {'jobs': jobs, 'count': len(jobs)}
    except Exception as exc:
        return {'jobs': [], 'count': 0, 'error': str(exc)}


@router.get('/jobs/{job_id}')
async def get_job(job_id: str):
    """Get status of a specific background job."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            row = conn.execute(
                '''SELECT job_id, job_type, query, status, result, error, started_at, completed_at, created_at
                   FROM background_jobs WHERE job_id = %s''',
                (job_id,),
            ).fetchone()
        if not row:
            raise HTTPException(404, 'Job not found')
        return {
            'job_id': row[0], 'job_type': row[1], 'query': row[2],
            'status': row[3],
            'result': json.loads(row[4]) if isinstance(row[4], str) else row[4],
            'error': row[5],
            'started_at': str(row[6]) if row[6] else None,
            'completed_at': str(row[7]) if row[7] else None,
            'created_at': str(row[8]) if row[8] else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        return {'error': str(exc)}
