"""
GET /v1/explain/{story_id} — Full agent trace explaining why a story
was classified with its priority level.

Answers: "Why did the system classify this as CRITICAL?"
"""
from __future__ import annotations
import json

import psycopg
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter()


@router.get('/explain/{story_id}')
async def explain_story(story_id: str):
    """
    Return the full agent trace for a story, including:
    - Story metadata (title, priority, scores)
    - All agent runs that processed this story
    - Rule engine scoring breakdown
    - Alert details if triggered
    """
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            # Get story
            story_row = conn.execute(
                '''SELECT story_id, title, narrative, priority, importance_score,
                          sources, article_ids, first_published_at, url,
                          topic_tags, entities, sentiment, source_reliability,
                          weighted_score, final_score
                   FROM stories WHERE story_id = %s''',
                (story_id,),
            ).fetchone()

            if not story_row:
                return {'error': 'Story not found', 'story_id': story_id}

            # Get AI analysis
            analysis_row = conn.execute(
                '''SELECT topic_tags, entities, impact_signals, sentiment,
                          confidence, model_used
                   FROM ai_analysis WHERE story_id = %s''',
                (story_id,),
            ).fetchone()

            # Get priority scores breakdown
            score_row = conn.execute(
                '''SELECT business_impact, urgency, market_impact, novelty,
                          confidence, weighted_score, final_score, priority_label
                   FROM priority_scores WHERE story_id = %s''',
                (story_id,),
            ).fetchone()

            # Get alerts
            alert_rows = conn.execute(
                '''SELECT alert_id, priority, title, reason, triggered_at,
                          delivered_at, channel
                   FROM alerts WHERE story_id = %s''',
                (story_id,),
            ).fetchall()

            # Get agent run logs for runs that processed this story
            agent_logs = conn.execute(
                '''SELECT agent_name, model, input_tokens, output_tokens,
                          latency_ms, cost_usd, confidence, status,
                          items_in, items_out, error, created_at
                   FROM agent_run_logs
                   WHERE story_id = %s
                   ORDER BY created_at ASC''',
                (story_id,),
            ).fetchall()

            # If no story-specific logs, get recent logs from the same run
            if not agent_logs:
                agent_logs = conn.execute(
                    '''SELECT agent_name, model, input_tokens, output_tokens,
                              latency_ms, cost_usd, confidence, status,
                              items_in, items_out, error, created_at
                       FROM agent_run_logs
                       ORDER BY created_at DESC
                       LIMIT 20''',
                ).fetchall()

            # Get notification delivery status
            notifications = conn.execute(
                '''SELECT n.channel, n.recipient, n.status, n.sent_at, n.error
                   FROM notifications n
                   JOIN alerts a ON n.alert_id = a.alert_id
                   WHERE a.story_id = %s''',
                (story_id,),
            ).fetchall()

        def _parse_jsonb(val):
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except Exception:
                    return val
            return val

        # Build explanation
        story = {
            'story_id': story_row[0],
            'title': story_row[1],
            'narrative': story_row[2],
            'priority': story_row[3],
            'importance_score': story_row[4],
            'sources': _parse_jsonb(story_row[5]),
            'article_count': len(_parse_jsonb(story_row[6]) if story_row[6] else []),
            'first_published_at': str(story_row[7]) if story_row[7] else None,
            'url': story_row[8],
            'topic_tags': _parse_jsonb(story_row[9]) if story_row[9] else [],
            'entities': _parse_jsonb(story_row[10]) if story_row[10] else {},
            'sentiment': story_row[11],
            'source_reliability': story_row[12],
            'weighted_score': story_row[13],
            'final_score': story_row[14],
        }

        scoring = None
        if score_row:
            scoring = {
                'business_impact': score_row[0],
                'urgency': score_row[1],
                'market_impact': score_row[2],
                'novelty': score_row[3],
                'confidence': score_row[4],
                'weighted_score': score_row[5],
                'final_score': score_row[6],
                'priority_label': score_row[7],
                'formula': (
                    f'weighted = {score_row[0]}×0.30 + {score_row[1]}×0.25 + '
                    f'{score_row[2]}×0.20 + {score_row[3]}×0.15 + '
                    f'{score_row[4]*10:.1f}×0.10 = {score_row[5]}'
                ),
                'thresholds': {
                    'CRITICAL': f'>= {settings.rule_engine_critical_threshold}',
                    'HIGH': f'>= {settings.rule_engine_high_threshold}',
                    'MEDIUM': f'>= {settings.rule_engine_medium_threshold}',
                    'LOW': f'< {settings.rule_engine_medium_threshold}',
                },
            }

        alerts_list = [
            {
                'alert_id': r[0],
                'priority': r[1],
                'title': r[2],
                'reason': r[3],
                'triggered_at': str(r[4]) if r[4] else None,
                'delivered_at': str(r[5]) if r[5] else None,
                'channel': r[6],
            }
            for r in alert_rows
        ]

        agent_trace = [
            {
                'agent_name': r[0],
                'model': r[1],
                'input_tokens': r[2],
                'output_tokens': r[3],
                'latency_ms': r[4],
                'cost_usd': r[5],
                'confidence': r[6],
                'status': r[7],
                'items_in': r[8],
                'items_out': r[9],
                'error': r[10],
                'created_at': str(r[11]) if r[11] else None,
            }
            for r in agent_logs
        ]

        notification_history = [
            {
                'channel': r[0],
                'recipient': r[1],
                'status': r[2],
                'sent_at': str(r[3]) if r[3] else None,
                'error': r[4],
            }
            for r in notifications
        ]

        return {
            'story': story,
            'scoring_breakdown': scoring,
            'alerts': alerts_list,
            'agent_trace': agent_trace,
            'notification_history': notification_history,
            'total_tokens': sum(r.get('input_tokens', 0) + r.get('output_tokens', 0) for r in agent_trace),
            'total_cost_usd': round(sum(r.get('cost_usd', 0) for r in agent_trace), 6),
            'total_latency_ms': round(sum(r.get('latency_ms', 0) for r in agent_trace), 1),
        }

    except Exception as exc:
        return {'error': str(exc), 'story_id': story_id}
