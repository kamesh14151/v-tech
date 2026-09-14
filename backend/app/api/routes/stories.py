"""GET /v1/stories — Paginated list of persisted story clusters."""
from __future__ import annotations
import json

import psycopg
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter()


@router.get('/stories')
async def list_stories(
    priority: str | None = Query(None, description='Filter by priority: CRITICAL|HIGH|MEDIUM|LOW'),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            if priority:
                rows = conn.execute(
                    '''SELECT story_id, title, narrative, priority, importance_score, sources, article_ids,
                              first_published_at, url
                       FROM stories WHERE priority = %s
                       ORDER BY importance_score DESC LIMIT %s OFFSET %s''',
                    (priority.upper(), limit, offset),
                ).fetchall()
            else:
                rows = conn.execute(
                    '''SELECT story_id, title, narrative, priority, importance_score, sources, article_ids,
                              first_published_at, url
                       FROM stories ORDER BY importance_score DESC LIMIT %s OFFSET %s''',
                    (limit, offset),
                ).fetchall()
        stories = [
            {
                'story_id': r[0], 'title': r[1], 'narrative': r[2],
                'priority': r[3], 'importance_score': r[4],
                'sources': json.loads(r[5]) if isinstance(r[5], str) else r[5],
                'article_count': len(json.loads(r[6]) if isinstance(r[6], str) else r[6]),
                'first_published_at': r[7].isoformat() if hasattr(r[7], 'isoformat') else str(r[7]),
                'url': r[8],
            }
            for r in rows
        ]
        return {'stories': stories, 'count': len(stories)}
    except Exception as exc:
        return {'stories': [], 'count': 0, 'error': str(exc)}


@router.get('/stories/{story_id}')
async def get_story(story_id: str):
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            row = conn.execute(
                '''SELECT story_id, title, narrative, priority, importance_score, sources, article_ids,
                          first_published_at, url
                   FROM stories WHERE story_id = %s''',
                (story_id,),
            ).fetchone()
            if not row:
                return {'error': 'Story not found'}
            alert_row = conn.execute(
                'SELECT priority, reason, triggered_at FROM alerts WHERE story_id = %s',
                (story_id,),
            ).fetchone()
        return {
            'story_id': row[0], 'title': row[1], 'narrative': row[2],
            'priority': row[3], 'importance_score': row[4],
            'sources': json.loads(row[5]) if isinstance(row[5], str) else row[5],
            'article_ids': json.loads(row[6]) if isinstance(row[6], str) else row[6],
            'first_published_at': row[7].isoformat() if hasattr(row[7], 'isoformat') else str(row[7]),
            'url': row[8],
            'alert': {
                'priority': alert_row[0],
                'reason': alert_row[1],
                'triggered_at': alert_row[2].isoformat() if hasattr(alert_row[2], 'isoformat') else str(alert_row[2]),
            } if alert_row else None,
        }
    except Exception as exc:
        return {'error': str(exc)}
