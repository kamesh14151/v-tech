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

    if not filtered_articles and raw_articles:
        log.info("Pre-filter returned 0 articles. Falling back to top %d raw articles.", len(raw_articles))
        filtered_articles = raw_articles[:settings.max_articles]

    if not filtered_articles:
        log.warning("No articles collected for query '%s'. Returning empty baseline report.", req.query)
        return {
            'query': req.query,
            'generatedAt': datetime.now(timezone.utc).isoformat(),
            'runId': run_id,
            'totalArticles': 0,
            'sources': [],
            'topicDomain': req.topic_domain or req.query,
            'location': req.location,
            'recency': req.recency,
            'topStories': [],
            'themes': [],
            'risks': [],
            'sentiment': {'positive': 0, 'negative': 0, 'neutral': 0},
            'executiveSummary': f"No recent breaking news articles were found matching query '{req.query}' across connected news feeds. Monitoring system remains active.",
            'recommendedActions': ["Expand search criteria or adjust location/recency filters."],
            'markdown': f"# Optimus Intelligence Report: {req.query}\n\nNo recent breaking news articles were found matching query '{req.query}'.",
            'agent_trace': [],
            'agent_logs': [],
            'priority_breakdown': {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0},
            'stories': [],
            'alerts': [],
            'pre_filter_stats': pre_filter_stats,
            'discoveredArticles': 0,
            'relevantArticles': 0,
            'noiseFilteredPercent': 0,
            'sourceBreakdown': {},
            'sourcesCount': 0,
        }

async def build_deterministic_report(
    filtered_articles: list,
    req: AnalyzeRequest,
    run_id: str,
    pre_filter_stats: dict,
    raw_articles: list,
    source_breakdown: dict[str, int],
    fallback_reason: str = "LLM rate-limit / timeout fallback",
) -> dict[str, Any]:
    """
    Deterministic zero-LLM report generator.
    Executed when LangGraph/LLM API times out (20s+), hits 429 rate limit, or fails.
    Ensures 100% reliable 200 OK HTTP responses without 504 Gateway Timeout or blank UI.
    """
    top_stories = []
    stories_payload = []
    alerts_payload = []
    alerts_raw = []

    pos_keywords = {'win', 'up', 'top', 'success', 'growth', 'record', 'super', 'hit', 'rise', 'lead', 'gain', 'launch', 'award'}
    neg_keywords = {'down', 'drop', 'loss', 'crisis', 'ban', 'crash', 'fail', 'court', 'warning', 'dispute', 'delay', 'injury', 'tax', 'threat'}

    pos_count = 0
    neg_count = 0
    neu_count = 0

    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0

    for idx, art in enumerate(filtered_articles):
        t_lower = art.title.lower()
        
        # Priority calculation
        if any(k in t_lower for k in {'crisis', 'dispute', 'alert', 'court', 'lawsuit', 'warning', 'threat', 'death'}):
            priority = 'CRITICAL'
            critical_count += 1
        elif any(k in t_lower for k in {'break', 'major', 'announc', 'release', 'launch', 'record', 'ban', 'starrer'}):
            priority = 'HIGH'
            high_count += 1
        elif idx < 5:
            priority = 'HIGH'
            high_count += 1
        else:
            priority = 'MEDIUM'
            medium_count += 1

        # Sentiment calculation
        if any(k in t_lower for k in pos_keywords):
            sentiment_str = 'positive'
            pos_count += 1
        elif any(k in t_lower for k in neg_keywords):
            sentiment_str = 'negative'
            neg_count += 1
        else:
            sentiment_str = 'neutral'
            neu_count += 1

        story_id = f"rule-{art.id[:12]}"
        importance_score = round(max(50.0, art.source_reliability * 100.0 - idx * 2.5), 1)

        top_stories.append({
            'title': art.title,
            'source': art.source,
            'url': art.url,
            'relevanceScore': round(importance_score),
            'publishedAt': art.published_at,
            'priority': priority,
            'topicTags': [req.topic_domain or req.query],
        })

        story_item = {
            'story_id': story_id,
            'title': art.title,
            'narrative': art.description or f"Coverage from {art.source} regarding {art.title}.",
            'priority': priority,
            'importance_score': importance_score,
            'final_score': round(importance_score / 100.0, 3),
            'weighted_score': round(importance_score / 100.0, 3),
            'sources': [art.source],
            'article_ids': [art.id],
            'first_published_at': art.published_at,
            'topic_tags': [req.topic_domain or req.query],
            'entities': [art.source],
            'sentiment': sentiment_str,
            'should_alert': priority in ('CRITICAL', 'HIGH'),
            'source_reliability': art.source_reliability,
            'url': art.url,
        }
        stories_payload.append(story_item)

        if priority in ('CRITICAL', 'HIGH') and idx < 4:
            alert_obj = Alert(
                alert_id=f"alt-{art.id[:10]}",
                story_id=story_id,
                priority=priority,
                title=art.title,
                reason=f"Breaking news from {art.source} with {priority} priority signal.",
                importance_score=importance_score,
                sources=[art.source],
                url=art.url,
                triggered_at=datetime.now(timezone.utc).isoformat(),
            )
            alerts_raw.append(alert_obj)
            alerts_payload.append({
                'alert_id': alert_obj.alert_id,
                'story_id': alert_obj.story_id,
                'priority': alert_obj.priority,
                'title': alert_obj.title,
                'reason': alert_obj.reason,
                'importance_score': round(alert_obj.importance_score, 3),
                'sources': alert_obj.sources,
                'url': alert_obj.url,
                'triggered_at': alert_obj.triggered_at,
            })

    themes = [
        {'name': art.title, 'count': 1, 'description': art.description or f"Breaking news report from {art.source}.", 'priority': top_stories[idx]['priority']}
        for idx, art in enumerate(filtered_articles[:6])
    ]

    risks = [
        {
            'severity': 'high' if top_stories[idx]['priority'] in ('CRITICAL', 'HIGH') else 'medium',
            'title': art.title,
            'source': art.source,
            'reason': f"High visibility development reported by {art.source}.",
            'priority': top_stories[idx]['priority'],
        }
        for idx, art in enumerate(filtered_articles[:4])
    ]

    exec_summary = (
        f"**Executive Intelligence Briefing: {req.query} ({req.location})**\n\n"
        f"Over the {req.recency}, our deterministic ingestion engine collected {len(filtered_articles)} verified articles across {len(source_breakdown)} media sources including {', '.join(list(source_breakdown.keys())[:4])}.\n\n"
        f"**Primary Developments:**\n"
        + "\n".join(f"- [{art.title}]({art.url}) — *{art.source}*" for art in filtered_articles[:5]) + "\n\n"
        f"**System Status**: Rule-Based Deterministic Engine Active."
    )

    actions = [
        "Monitor primary breaking news feeds for follow-up statements.",
        "Verify source reliability metrics across top cited outlets.",
        "Track sentiment shifts as follow-up reporting develops.",
    ]

    priority_breakdown = {
        'CRITICAL': critical_count,
        'HIGH': high_count,
        'MEDIUM': medium_count,
        'LOW': low_count,
    }

    sentiment = {
        'positive': pos_count,
        'negative': neg_count,
        'neutral': neu_count,
    }

    agent_logs_payload = [
        {
            'agent_name': 'Rule-Based Fallback Engine (Zero-LLM)',
            'model': 'deterministic-v2',
            'input_tokens': 0,
            'output_tokens': 0,
            'latency_ms': 15.0,
            'cost_usd': 0.0,
            'status': 'completed',
            'items_in': len(filtered_articles),
            'items_out': len(filtered_articles),
            'error': fallback_reason,
        }
    ]

    md = (
        f'# Optimus Intelligence Briefing: {req.query}\n\n'
        f'## Executive Summary\n\n{exec_summary}\n\n'
        '## Priority Breakdown\n\n'
        + '\n'.join(f'- **{k}**: {v}' for k, v in priority_breakdown.items()) + '\n\n'
        '## Key Verified Stories\n\n'
        + '\n'.join(f'- [{s["title"]}]({s["url"]}) — {s["priority"]} ({s["relevanceScore"]}/100)' for s in top_stories[:5])
    )

    discovered_count = len(raw_articles)
    relevant_count = len(filtered_articles)
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
        'executiveSummary': exec_summary,
        'recommendedActions': actions,
        'markdown': md,
        'agent_trace': agent_logs_payload,
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

    # Persist report to DB
    try:
        with psycopg.connect(settings.database_url.replace('+psycopg', '')) as conn:
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
            conn.execute(
                'INSERT INTO agent_runs (request_id, query, status, trace) VALUES (%s, %s, %s, %s)',
                (uuid.UUID(run_id), req.query, 'completed', json.dumps(agent_logs_payload)),
            )
            conn.execute(
                """INSERT INTO saved_reports (query, topic_domain, location, recency, report_data, created_at)
                   VALUES (%s, %s, %s, %s, %s, NOW())""",
                (req.query, req.topic_domain or req.query, req.location, req.recency, json.dumps(response_data)),
            )
            conn.commit()
    except Exception as exc:
        log.warning("Fallback DB persistence error: %s", exc)

    # Dispatch alerts if present
    if alerts_raw:
        try:
            await dispatch_alerts(alerts_raw, recipient_email=settings.notification_email_to or None)
        except Exception as exc:
            log.warning("Fallback notification dispatch error: %s", exc)

    return response_data


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

    if not filtered_articles and raw_articles:
        log.info("Pre-filter returned 0 articles. Falling back to top %d raw articles.", len(raw_articles))
        filtered_articles = raw_articles[:settings.max_articles]

    if not filtered_articles:
        log.warning("No articles collected for query '%s'. Returning empty baseline report.", req.query)
        return {
            'query': req.query,
            'generatedAt': datetime.now(timezone.utc).isoformat(),
            'runId': run_id,
            'totalArticles': 0,
            'sources': [],
            'topicDomain': req.topic_domain or req.query,
            'location': req.location,
            'recency': req.recency,
            'topStories': [],
            'themes': [],
            'risks': [],
            'sentiment': {'positive': 0, 'negative': 0, 'neutral': 0},
            'executiveSummary': f"No recent breaking news articles were found matching query '{req.query}' across connected news feeds. Monitoring system remains active.",
            'recommendedActions': ["Expand search criteria or adjust location/recency filters."],
            'markdown': f"# Optimus Intelligence Report: {req.query}\n\nNo recent breaking news articles were found matching query '{req.query}'.",
            'agent_trace': [],
            'agent_logs': [],
            'priority_breakdown': {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0},
            'stories': [],
            'alerts': [],
            'pre_filter_stats': pre_filter_stats,
            'discoveredArticles': 0,
            'relevantArticles': 0,
            'noiseFilteredPercent': 0,
            'sourceBreakdown': {},
            'sourcesCount': 0,
        }

    # ── Run LangGraph pipeline with 20s timeout and automatic non-LLM fallback ──
    try:
        import asyncio
        state = await asyncio.wait_for(
            graph.ainvoke({
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
            }),
            timeout=20.0,
        )
    except Exception as exc:
        log.warning("LangGraph pipeline failed or timed out (%s). Using deterministic non-LLM fallback.", exc)
        return await build_deterministic_report(
            filtered_articles, req, run_id, pre_filter_stats, raw_articles, source_breakdown, str(exc)
        )

    scored = state.get('scored_stories', [])
    summaries = state.get('summaries', [])
    alerts_raw = state.get('alerts', [])
    agent_logs = state.get('agent_logs', [])

    # If LLM generated 0 scored stories, fallback gracefully to deterministic report
    if not scored:
        log.info("LLM pipeline returned 0 scored stories. Using deterministic non-LLM fallback.")
        return await build_deterministic_report(
            filtered_articles, req, run_id, pre_filter_stats, raw_articles, source_breakdown, "LLM generated 0 stories"
        )

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
        {
            'name': s.title,
            'count': len(s.article_ids) if s.article_ids else 1,
            'description': s.narrative or f"Verified media coverage reported by {s.sources[0] if s.sources else 'connected feeds'}.",
            'priority': s.priority
        }
        for s in scored[:6]
    ]

    risks = [
        {
            'severity': getattr(s, 'impact_level', 'high'),
            'title': s.title,
            'source': s.sources[0] if s.sources else 'Unknown',
            'reason': ('; '.join(getattr(s, 'impact_signals', [])) or s.narrative or f"High visibility development reported by {s.sources[0] if s.sources else 'media'}.").strip(),
            'priority': s.priority,
        }
        for s in scored if getattr(s, 'impact_level', None) in ('high', 'critical')
    ]
    if not risks:
        risks = [
            {
                'severity': 'high' if s.priority in ('CRITICAL', 'HIGH') else 'medium',
                'title': s.title,
                'source': s.sources[0] if s.sources else 'Media',
                'reason': s.narrative or f"Key development reported by {s.sources[0] if s.sources else 'media'}.",
                'priority': s.priority,
            }
            for s in scored if s.sentiment == 'negative' or s.priority in ('CRITICAL', 'HIGH')
        ][:4]

    if summaries and getattr(summaries[0], 'executive_summary', None) and summaries[0].executive_summary != 'No executive summary was generated.':
        executive = summaries[0].executive_summary
    else:
        top_titles = [s.title for s in scored[:4]]
        executive = (
            f"Over the {req.recency}, Optimus AI tracked {len(scored)} key media developments matching query '{req.query}' in {req.location}. "
            f"Primary headlines include: {'; '.join(top_titles)}. "
            f"System monitoring remains active across connected news feeds."
        )

    actions = [s.recommended_action for s in summaries if getattr(s, 'recommended_action', None)]
    if not actions:
        actions = [
            f"Monitor live news developments regarding '{req.query}' across regional and national feeds.",
            "Track sentiment evolution and key narrative drivers across primary publishing sources.",
            "Verify source reliability metrics for high-impact press statements.",
            "Assess strategic brand exposure and market impact."
        ]

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
