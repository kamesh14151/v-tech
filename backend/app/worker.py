"""
ARQ Background Worker — Async Redis-backed task queue.

Runs analysis pipelines as background jobs:
  - One-off analysis triggered via API
  - Scheduled recurring analysis (cron-based)

Usage:
    arq app.worker.WorkerSettings

This is NOT a web server — it's a standalone worker process.
"""
from __future__ import annotations
import json
import logging
import uuid
from datetime import datetime, timezone

import psycopg
from arq import cron
from arq.connections import RedisSettings

from app.core.config import settings
from app.notifications.digest import send_daily_digests

log = logging.getLogger(__name__)


async def run_analysis_task(ctx: dict, query: str, location: str = 'Global (All)',
                             recency: str = 'Last 24 Hours', keywords: list[str] | None = None):
    """
    Execute a full analysis pipeline as a background job.
    This is the same logic as POST /v1/analyze but runs asynchronously.
    """
    from app.ingestion.collector import collect_raw_articles
    from app.rules.pre_filter import apply_rule_pre_filter
    from app.services.source_reliability import score_articles
    from app.graph.workflow import graph
    from app.notifications.dispatcher import dispatch_alerts

    job_id = ctx.get('job_id', str(uuid.uuid4()))
    run_id = str(uuid.uuid4())
    keywords = keywords or []

    log.info('BG job %s: starting analysis for query=%r', job_id, query)

    # Track job status
    _update_job_status(job_id, 'analysis', query, 'running')

    try:
        # Collect
        raw_articles, source_breakdown = await collect_raw_articles(query=query, recency=recency)
        score_articles(raw_articles)

        # Pre-filter
        filtered_articles, pre_filter_stats = apply_rule_pre_filter(
            raw_articles, query=query, location=location, recency=recency, keywords=keywords,
        )
        filtered_articles = filtered_articles[:settings.max_articles]

        if not filtered_articles:
            _update_job_status(job_id, 'analysis', query, 'completed',
                               result={'error': 'No articles found', 'articles_checked': len(raw_articles)})
            return {'status': 'no_articles', 'articles_checked': len(raw_articles)}

        # Run pipeline
        state = await graph.ainvoke({
            'query': query,
            'topic_domain': query,
            'location': location,
            'recency': recency,
            'keywords': keywords,
            'raw_articles': filtered_articles,
            'pre_filter_stats': pre_filter_stats,
            'agent_logs': [],
            'trace': [],
            'run_id': run_id,
        })

        scored = state.get('scored_stories', [])
        alerts_raw = state.get('alerts', [])

        # Persist stories to DB
        _persist_results(run_id, query, state)

        # Dispatch notifications
        if alerts_raw:
            try:
                dispatch_stats = await dispatch_alerts(
                    alerts_raw,
                    recipient_email=settings.notification_email_to or None,
                )
                log.info('BG job %s: dispatched %s', job_id, dispatch_stats)
            except Exception as exc:
                log.warning('BG job %s: notification dispatch failed: %s', job_id, exc)

        result = {
            'run_id': run_id,
            'total_articles': len(filtered_articles),
            'stories': len(scored),
            'alerts': len(alerts_raw),
            'priority_breakdown': {
                'CRITICAL': sum(1 for s in scored if s.priority == 'CRITICAL'),
                'HIGH': sum(1 for s in scored if s.priority == 'HIGH'),
                'MEDIUM': sum(1 for s in scored if s.priority == 'MEDIUM'),
                'LOW': sum(1 for s in scored if s.priority == 'LOW'),
            },
        }

        _update_job_status(job_id, 'analysis', query, 'completed', result=result)
        log.info('BG job %s: completed — %d stories, %d alerts', job_id, len(scored), len(alerts_raw))
        return result

    except Exception as exc:
        log.error('BG job %s: failed — %s', job_id, exc)
        _update_job_status(job_id, 'analysis', query, 'failed', error=str(exc))
        raise


async def scheduled_analysis(ctx: dict):
    """
    Cron-scheduled analysis — runs configured queries on a schedule.
    Configure via: SCHEDULED_ANALYSIS_CRON and DEFAULT_ANALYSIS_QUERIES env vars.
    """
    queries = [q.strip() for q in settings.default_analysis_queries.split(',') if q.strip()]
    if not queries:
        log.info('Scheduled analysis skipped: no DEFAULT_ANALYSIS_QUERIES configured')
        return

    log.info('Scheduled analysis: running %d queries', len(queries))
    results = []
    for query in queries:
        try:
            result = await run_analysis_task(ctx, query=query)
            results.append({'query': query, 'status': 'ok', **result})
        except Exception as exc:
            results.append({'query': query, 'status': 'failed', 'error': str(exc)})

    return results


def _persist_results(run_id: str, query: str, state: dict):
    """Persist pipeline results to database (sync — worker context)."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            agent_logs = state.get('agent_logs', [])
            agent_logs_payload = [
                {
                    'agent_name': l.agent_name, 'model': l.model,
                    'input_tokens': l.input_tokens, 'output_tokens': l.output_tokens,
                    'latency_ms': l.latency_ms, 'cost_usd': l.cost_usd,
                }
                for l in agent_logs
            ]
            conn.execute(
                'INSERT INTO agent_runs (request_id, query, status, trace) VALUES (%s, %s, %s, %s)',
                (uuid.UUID(run_id), query, 'completed', json.dumps(agent_logs_payload)),
            )
            for s in state.get('scored_stories', []):
                conn.execute(
                    '''INSERT INTO stories
                       (story_id, title, narrative, priority, importance_score, sources, article_ids,
                        first_published_at, url)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (story_id) DO UPDATE SET
                           importance_score = EXCLUDED.importance_score,
                           priority = EXCLUDED.priority''',
                    (s.story_id, s.title, s.narrative, s.priority, s.importance_score,
                     json.dumps(s.sources), json.dumps(s.article_ids),
                     s.first_published_at, s.representative_url),
                )
            conn.commit()
    except Exception as exc:
        log.warning('BG job DB persistence failed: %s', exc)


def _update_job_status(job_id: str, job_type: str, query: str, status: str,
                        result: dict | None = None, error: str | None = None):
    """Track background job status in the database."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            conn.execute(
                '''INSERT INTO background_jobs (job_id, job_type, query, status, result, error, started_at)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW())
                   ON CONFLICT (job_id) DO UPDATE SET
                       status = EXCLUDED.status,
                       result = COALESCE(EXCLUDED.result, background_jobs.result),
                       error = EXCLUDED.error,
                       completed_at = CASE WHEN EXCLUDED.status IN ('completed', 'failed') THEN NOW() ELSE NULL END''',
                (job_id, job_type, query, status,
                 json.dumps(result) if result else None, error),
            )
            conn.commit()
    except Exception as exc:
        log.debug('Job status tracking failed: %s', exc)


# ─── ARQ Worker Settings ────────────────────────────────────────────────────

def _parse_redis_settings() -> RedisSettings:
    """Parse redis URL into ARQ RedisSettings, supporting rediss:// (TLS) for Upstash."""
    redis_url = settings.arq_redis_url or settings.redis_url
    from urllib.parse import urlparse
    parsed = urlparse(redis_url)
    use_ssl = parsed.scheme == 'rediss'
    return RedisSettings(
        host=parsed.hostname or 'localhost',
        port=parsed.port or 6379,
        database=int(parsed.path.lstrip('/') or '0'),
        password=parsed.password,
        ssl=use_ssl,
    )


def _build_cron_jobs():
    """Build list of cron jobs from settings."""
    jobs = []

    # Daily digest — every day at 08:00 UTC
    jobs.append(cron(send_daily_digests, hour={8}, minute={0}))

    # Optional: configurable scheduled analysis
    if settings.scheduled_analysis_cron:
        parts = settings.scheduled_analysis_cron.split()
        if len(parts) == 5:
            jobs.append(cron(
                scheduled_analysis,
                minute=_parse_cron_field(parts[0]),
                hour=_parse_cron_field(parts[1]),
                day=_parse_cron_field(parts[2]),
                month=_parse_cron_field(parts[3]),
                weekday=_parse_cron_field(parts[4]),
            ))
    return jobs


def _parse_cron_field(field: str):
    """Convert cron field string to ARQ cron format."""
    if field == '*':
        return None  # ARQ treats None as "any"
    if field.startswith('*/'):
        step = int(field[2:])
        return {i for i in range(0, 60, step)}
    if ',' in field:
        return {int(v) for v in field.split(',')}
    return {int(field)}


class WorkerSettings:
    """ARQ worker settings — used by `arq app.worker.WorkerSettings`."""
    functions  = [run_analysis_task, send_daily_digests]
    cron_jobs  = _build_cron_jobs()
    redis_settings = _parse_redis_settings()
    max_jobs   = 5
    job_timeout = 600  # 10 min — digest can take longer
    health_check_interval = 60
