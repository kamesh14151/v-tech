"""
POST /v1/analyze — Main analysis endpoint.

Upgraded to return:
    - priority_breakdown (CRITICAL/HIGH/MEDIUM/LOW counts)
    - agent_logs (full observability per agent)
    - alerts (CRITICAL/HIGH stories)
    - stories (full clustered story objects)
    - pre_filter_stats (ingestion funnel metrics)
    - Automatic notification dispatch for CRITICAL/HIGH alerts
"""
from __future__ import annotations
import json
import logging
import uuid
from datetime import datetime, timezone

import psycopg
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.graph.workflow import graph
from app.ingestion.collector import collect_raw_articles
from app.rules.pre_filter import apply_rule_pre_filter
from app.services.source_reliability import score_articles
from app.notifications.dispatcher import dispatch_alerts
from app.schemas.news import Alert

router = APIRouter()
log = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
    query: str = Field(min_length=1, max_length=300)
    topic_domain: str = ''
    location: str = 'Global (All)'
    recency: str = 'Last 24 Hours'
    keywords: list[str] = Field(default_factory=list)


@router.post('/analyze')
async def analyze(req: AnalyzeRequest):
    run_id = str(uuid.uuid4())

    # ── Collect raw articles from all sources ──────────────────────────
    q = req.query
    if req.location and req.location not in ('Global (All)', 'Global'):
        q = f'{q} {req.location.replace("Within ", "").replace("(", "").replace(")", "").strip()}'

    raw_articles, source_breakdown = await collect_raw_articles(query=q, recency=req.recency)

    # ── Score source reliability ──────────────────────────────────────
    score_articles(raw_articles)

    # ── Deterministic rule pre-filter ──────────────────────────────────
    filtered_articles, pre_filter_stats = apply_rule_pre_filter(
        raw_articles,
        query=req.query,
        topic_domain=req.topic_domain,
        location=req.location,
        recency=req.recency,
        keywords=req.keywords,
    )

    # Cap at max_articles
    filtered_articles = filtered_articles[:settings.max_articles]

    if not filtered_articles:
        raise HTTPException(404, 'No articles found for the requested scope.')

    # ── Run LangGraph pipeline ────────────────────────────────────────
    state = await graph.ainvoke({
        'query': req.query,
        'topic_domain': req.topic_domain or req.query,
        'location': req.location,
        'recency': req.recency,
        'keywords': req.keywords,
        'raw_articles': filtered_articles,
        'pre_filter_stats': pre_filter_stats,
        'agent_logs': [],
        'trace': [],
        'run_id': run_id,
    })

    scored = state.get('scored_stories', [])
    summaries = state.get('summaries', [])
    alerts_raw = state.get('alerts', [])
    agent_logs = state.get('agent_logs', [])

    # ── Build response fields ─────────────────────────────────────────
    priority_breakdown = {
        'CRITICAL': sum(1 for s in scored if s.priority == 'CRITICAL'),
        'HIGH': sum(1 for s in scored if s.priority == 'HIGH'),
        'MEDIUM': sum(1 for s in scored if s.priority == 'MEDIUM'),
        'LOW': sum(1 for s in scored if s.priority == 'LOW'),
    }

    sentiment = {
        'positive': sum(1 for s in scored if s.sentiment == 'positive'),
        'negative': sum(1 for s in scored if s.sentiment == 'negative'),
        'neutral': sum(1 for s in scored if s.sentiment == 'neutral'),
    }

    top_stories = [
        {
            'title': s.title,
            'source': s.sources[0] if s.sources else 'Unknown',
            'url': s.representative_url,
            'relevanceScore': round(s.importance_score),
            'publishedAt': s.first_published_at,
            'priority': s.priority,
            'topicTags': s.topic_tags,
        }
        for s in scored[:10]
    ]

    themes = [
        {'name': s.title, 'count': len(s.article_ids), 'description': s.narrative, 'priority': s.priority}
        for s in scored[:6]
    ]

    risks = [
        {
            'severity': s.impact_level,
            'title': s.title,
            'source': s.sources[0] if s.sources else 'Unknown',
            'reason': '; '.join(s.impact_signals[:3]),
            'priority': s.priority,
        }
        for s in scored if s.impact_level in ('high', 'critical')
    ]

    executive = summaries[0].executive_summary if summaries else 'No executive summary was generated.'
    actions = [s.recommended_action for s in summaries[:5]]

    stories_payload = [
        {
            'story_id': s.story_id,
            'title': s.title,
            'narrative': s.narrative,
            'priority': s.priority,
            'importance_score': round(s.importance_score, 1),
            'final_score': round(s.final_score, 3),
            'weighted_score': round(s.weighted_score, 3),
            'sources': s.sources,
            'article_ids': s.article_ids,
            'first_published_at': s.first_published_at,
            'topic_tags': s.topic_tags,
            'entities': s.entities,
            'sentiment': s.sentiment,
            'should_alert': s.should_alert,
            'source_reliability': round(s.source_reliability, 3),
            'url': s.representative_url,
        }
        for s in scored
    ]

    alerts_payload = [
        {
            'alert_id': a.alert_id,
            'story_id': a.story_id,
            'priority': a.priority,
            'title': a.title,
            'reason': a.reason,
            'importance_score': round(a.importance_score, 3),
            'sources': a.sources,
            'url': a.url,
            'triggered_at': a.triggered_at,
        }
        for a in (alerts_raw or [])
    ]

    agent_logs_payload = [
        {
            'agent_name': l.agent_name,
            'model': l.model,
            'input_tokens': l.input_tokens,
            'output_tokens': l.output_tokens,
            'latency_ms': l.latency_ms,
            'cost_usd': l.cost_usd,
            'status': l.status,
            'items_in': l.items_in,
            'items_out': l.items_out,
            'error': l.error,
        }
        for l in (agent_logs or [])
    ]

    md = (
        f'# Optimus Intelligence Report: {req.query}\n\n'
        f'## Executive Summary\n\n{executive}\n\n'
        '## Priority Breakdown\n\n'
        + '\n'.join(f'- **{k}**: {v}' for k, v in priority_breakdown.items()) + '\n\n'
        '## Key Stories\n\n'
        + '\n'.join(f'- [{s.title}]({s.representative_url}) — {s.priority} ({s.importance_score:.0f}/100)' for s in scored[:5])
    )

    discovered_count = len(raw_articles)
    relevant_count = len(state.get('relevant_articles', []))
    noise_filtered = round(max(0, min(100, (1 - relevant_count / discovered_count) * 100)), 1) if discovered_count else None

    response_data = {
        'query': req.query,
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'runId': run_id,
        'totalArticles': len(filtered_articles),
        'sources': sorted({a.source for a in filtered_articles}),
        'topicDomain': req.topic_domain or req.query,
        'location': req.location,
        'recency': req.recency,
        'topStories': top_stories,
        'themes': themes,
        'risks': risks,
        'sentiment': sentiment,
        'executiveSummary': executive,
        'recommendedActions': actions,
        'markdown': md,
        'agent_trace': agent_logs_payload,  # legacy compat
        'agent_logs': agent_logs_payload,
        'priority_breakdown': priority_breakdown,
        'stories': stories_payload,
        'alerts': alerts_payload,
        'pre_filter_stats': pre_filter_stats,
        'discoveredArticles': discovered_count,
        'relevantArticles': relevant_count,
        'noiseFilteredPercent': noise_filtered,
        'sourceBreakdown': source_breakdown,
        'sourcesCount': len(source_breakdown),
    }

    # ── Persist to database ───────────────────────────────────────────
    try:
        with psycopg.connect(settings.database_url.replace('+psycopg', '')) as conn:
            # Create saved_reports table if not exists
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
            # Master run record
            conn.execute(
                'INSERT INTO agent_runs (request_id, query, status, trace) VALUES (%s, %s, %s, %s)',
                (uuid.UUID(run_id), req.query, 'completed', json.dumps(agent_logs_payload)),
            )
            # Save report data for history & quick reloads
            conn.execute(
                """INSERT INTO saved_reports (query, topic_domain, location, recency, report_data, created_at)
                   VALUES (%s, %s, %s, %s, %s, NOW())""",
                (req.query, req.topic_domain or req.query, req.location, req.recency, json.dumps(response_data)),
            )
            # Per-agent observability logs
            for log_entry in agent_logs_payload:
                conn.execute(
                    '''INSERT INTO agent_run_logs
                       (run_id, agent_name, model, input_tokens, output_tokens, latency_ms, cost_usd, confidence)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT DO NOTHING''',
                    (
                        run_id, log_entry['agent_name'], log_entry['model'],
                        log_entry['input_tokens'], log_entry['output_tokens'],
                        log_entry['latency_ms'], log_entry['cost_usd'], 1.0,
                    ),
                )
            # Stories
            for story_data in stories_payload:
                conn.execute(
                    '''INSERT INTO stories
                       (story_id, title, narrative, priority, importance_score, sources, article_ids,
                        first_published_at, url)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (story_id) DO UPDATE SET
                           importance_score = EXCLUDED.importance_score,
                           priority = EXCLUDED.priority''',
                    (
                        story_data['story_id'], story_data['title'], story_data['narrative'],
                        story_data['priority'], story_data['importance_score'],
                        json.dumps(story_data['sources']), json.dumps(story_data['article_ids']),
                        story_data['first_published_at'], story_data['url'],
                    ),
                )
            # Alerts
            for alert in alerts_payload:
                conn.execute(
                    '''INSERT INTO alerts
                       (alert_id, story_id, priority, title, reason, triggered_at)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       ON CONFLICT (alert_id) DO NOTHING''',
                    (
                        alert['alert_id'], alert['story_id'], alert['priority'],
                        alert['title'], alert['reason'], alert['triggered_at'],
                    ),
                )
            conn.commit()
    except Exception as exc:
        log.warning('DB persistence failed (analysis still returned): %s', exc)

    # ── Dispatch notifications for CRITICAL/HIGH alerts ───────────────
    if alerts_raw:
        try:
            dispatch_stats = await dispatch_alerts(
                alerts_raw,
                recipient_email=settings.notification_email_to or None,
            )
            log.info('Notification dispatch: %s', dispatch_stats)
        except Exception as exc:
            log.warning('Notification dispatch failed: %s', exc)

    return response_data
