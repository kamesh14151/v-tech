"""
GET  /v1/digest-preferences          — Get current user's digest preferences
PUT  /v1/digest-preferences          — Save / update preferences
POST /v1/digest-preferences/test     — Trigger a test digest email right now
"""
from __future__ import annotations
import logging

import psycopg
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field, EmailStr

from app.core.config import settings

router = APIRouter()
log = logging.getLogger(__name__)


def _db_url() -> str:
    return settings.database_url.replace('+psycopg', '')


class DigestPreferences(BaseModel):
    user_email:      str
    topic_domain:    str  = Field(default='General News', max_length=200)
    location:        str  = Field(default='Global (All)', max_length=100)
    recency:         str  = Field(default='Last 24 Hours', max_length=50)
    daily_digest:    bool = False
    digest_time:     str  = Field(default='08:00', max_length=5)   # HH:MM UTC
    alert_threshold: str  = Field(default='HIGH')   # CRITICAL | HIGH | MEDIUM


@router.get('/digest-preferences')
async def get_digest_preferences(x_user_email: str = Header(..., alias='X-User-Email')):
    """Get the current user's digest configuration."""
    try:
        with psycopg.connect(_db_url()) as conn:
            row = conn.execute(
                """
                SELECT user_email, topic_domain, location, recency,
                       daily_digest, digest_time, alert_threshold
                FROM notification_preferences
                WHERE user_email = %s
                """,
                (x_user_email,),
            ).fetchone()
        if not row:
            return DigestPreferences(user_email=x_user_email)
        return DigestPreferences(
            user_email=row[0], topic_domain=row[1], location=row[2],
            recency=row[3], daily_digest=row[4], digest_time=row[5],
            alert_threshold=row[6],
        )
    except Exception as exc:
        log.error('get_digest_preferences error: %s', exc)
        raise HTTPException(500, str(exc))


@router.put('/digest-preferences')
async def save_digest_preferences(prefs: DigestPreferences):
    """Upsert the user's digest configuration."""
    try:
        with psycopg.connect(_db_url()) as conn:
            conn.execute(
                """
                INSERT INTO notification_preferences
                    (user_email, topic_domain, location, recency,
                     daily_digest, digest_time, alert_threshold)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_email) DO UPDATE SET
                    topic_domain    = EXCLUDED.topic_domain,
                    location        = EXCLUDED.location,
                    recency         = EXCLUDED.recency,
                    daily_digest    = EXCLUDED.daily_digest,
                    digest_time     = EXCLUDED.digest_time,
                    alert_threshold = EXCLUDED.alert_threshold,
                    updated_at      = NOW()
                """,
                (
                    prefs.user_email, prefs.topic_domain, prefs.location,
                    prefs.recency, prefs.daily_digest, prefs.digest_time,
                    prefs.alert_threshold,
                ),
            )
            conn.commit()
        log.info('Preferences saved for %s (digest=%s)', prefs.user_email, prefs.daily_digest)
        return {'status': 'saved', 'daily_digest': prefs.daily_digest}
    except Exception as exc:
        log.error('save_digest_preferences error: %s', exc)
        raise HTTPException(500, str(exc))


@router.post('/digest-preferences/test')
async def send_test_digest(x_user_email: str = Header(..., alias='X-User-Email')):
    """Immediately send a test digest to the authenticated user."""
    from app.notifications.digest import send_daily_digests

    # Build a fake ctx — ARQ ctx is just a dict
    result = await send_daily_digests({'job_id': 'test', '_override_email': x_user_email})
    return {
        'status': 'dispatched',
        'result': result,
        'message': f'Test digest triggered for {x_user_email}. Check your inbox.',
    }
