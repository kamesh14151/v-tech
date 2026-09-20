"""
Daily Digest Email System.

Reads all users with notification preferences from the DB,
collects & analyses news for their configured topic/location,
and sends a beautiful HTML digest email to each user.
"""
from __future__ import annotations
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx
import psycopg

from app.core.config import settings

log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _db_url() -> str:
    return settings.database_url.replace('+psycopg', '')


def _get_digest_subscribers() -> list[dict]:
    """
    Return users that have digest enabled and a valid email.
    Checks user_preferences first, then notification_preferences table.
    """
    subscribers = []
    try:
        with psycopg.connect(_db_url()) as conn:
            # Query user_preferences table (from Next.js settings)
            try:
                rows = conn.execute(
                    """
                    SELECT COALESCE(up.target_email, u.email) AS email,
                           COALESCE(u.name, split_part(COALESCE(up.target_email, u.email), '@', 1)) AS name,
                           COALESCE(up.topic_domain, 'Fintech & Banking') AS topic_domain,
                           COALESCE(up.location, 'Global (All)') AS location,
                           COALESCE(up.recency, 'Last 24 Hours') AS recency,
                           COALESCE(up.delivery_time, '08:00') AS digest_time
                    FROM user_preferences up
                    LEFT JOIN users u ON u.id = up.user_id
                    WHERE (up.daily_digest_enabled IS TRUE OR up.daily_digest_enabled IS NULL)
                      AND (up.target_email IS NOT NULL OR u.email IS NOT NULL)
                    """
                ).fetchall()
                for r in rows:
                    if r[0] and r[0].strip():
                        subscribers.append({
                            'email': r[0].strip(),
                            'name': r[1] or r[0].split('@')[0].title(),
                            'topic_domain': r[2],
                            'location': r[3],
                            'recency': r[4],
                            'digest_time': r[5],
                        })
            except Exception as e:
                log.debug("user_preferences lookup notice: %s", e)

            # Query notification_preferences table if subscribers empty
            if not subscribers:
                try:
                    rows = conn.execute(
                        """
                        SELECT u.email, u.name,
                               COALESCE(np.topic_domain, 'Fintech & Banking')  AS topic_domain,
                               COALESCE(np.location,     'Global (All)')  AS location,
                               COALESCE(np.recency,      'Last 24 Hours') AS recency,
                               COALESCE(np.digest_time,  '08:00')         AS digest_time
                        FROM users u
                        JOIN notification_preferences np ON np.user_email = u.email
                        WHERE np.daily_digest = TRUE
                          AND u.email IS NOT NULL
                        """
                    ).fetchall()
                    for r in rows:
                        if r[0] and r[0].strip():
                            subscribers.append({
                                'email': r[0].strip(),
                                'name': r[1] or r[0].split('@')[0].title(),
                                'topic_domain': r[2],
                                'location': r[3],
                                'recency': r[4],
                                'digest_time': r[5],
                            })
                except Exception as e:
                    log.debug("notification_preferences lookup notice: %s", e)
    except Exception as exc:
        log.warning('Could not load digest subscribers: %s', exc)

    return subscribers


def _build_digest_html(subscriber: dict, stories: list[dict], source_breakdown: dict) -> str:
    """Render a premium HTML digest email."""
    name          = subscriber['name']
    topic         = subscriber['topic_domain']
    location      = subscriber['location']
    generated_at  = datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')

    # Top stories rows
    story_rows = ''
    for i, s in enumerate(stories[:8], 1):
        priority = s.get('priority', 'MEDIUM')
        badge_color = {
            'CRITICAL': '#dc2626', 'HIGH': '#f59e0b',
            'MEDIUM': '#3b82f6',   'LOW': '#6b7280',
        }.get(priority, '#6b7280')
        sources_str = ', '.join(s.get('sources', [])[:2]) or 'Unknown'
        story_rows += f"""
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:14px 8px;font-size:13px;color:#374151;vertical-align:top;width:28px;">
            <span style="font-weight:700;color:#9ca3af;">#{i}</span>
          </td>
          <td style="padding:14px 8px;vertical-align:top;">
            <a href="{s.get('url','#')}" style="color:#1d4ed8;font-weight:600;
               text-decoration:none;font-size:14px;line-height:1.4;">{s.get('title','')}</a>
            <div style="margin-top:6px;font-size:12px;color:#6b7280;">
              <span style="background:{badge_color};color:#fff;padding:2px 7px;
                border-radius:3px;font-size:11px;font-weight:600;">{priority}</span>
              &nbsp;📰 {sources_str}
              &nbsp;·&nbsp;Score: {s.get('importance_score',0):.0f}/100
            </div>
            <p style="margin:6px 0 0;font-size:12px;color:#4b5563;line-height:1.5;">
              {s.get('narrative','')[:160]}{'…' if len(s.get('narrative',''))>160 else ''}
            </p>
          </td>
        </tr>"""

    # Source pills
    source_pills = ''
    for src, cnt in list(source_breakdown.items())[:12]:
        source_pills += (
            f'<span style="display:inline-block;background:#f3f4f6;color:#374151;'
            f'padding:3px 10px;border-radius:999px;font-size:12px;margin:3px;">'
            f'{src} <b>({cnt})</b></span>'
        )

    return f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;
  box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
      <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        ⚡ Optimus Intelligence
      </div>
      <div style="color:#93c5fd;font-size:14px;margin-top:6px;">Daily News Digest</div>
      <div style="margin-top:16px;background:rgba(255,255,255,0.15);border-radius:8px;
        padding:10px 20px;display:inline-block;">
        <span style="color:#e0f2fe;font-size:13px;">
          🎯 <b>{topic}</b> &nbsp;·&nbsp; 📍 {location}
        </span>
      </div>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style="padding:28px 40px 8px;">
      <p style="margin:0;font-size:16px;color:#1f2937;">
        Good morning, <b>{name}</b> 👋
      </p>
      <p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Here's your personalised news intelligence briefing for
        <b>{topic}</b> — curated across {len(source_breakdown)} live sources,
        generated on <b>{generated_at}</b>.
      </p>
    </td>
  </tr>

  <!-- Stats bar -->
  <tr>
    <td style="padding:16px 40px;">
      <table width="100%" style="background:#f0f9ff;border-radius:8px;padding:0;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:14px;text-align:center;border-right:1px solid #bae6fd;">
            <div style="font-size:22px;font-weight:800;color:#1d4ed8;">{len(stories)}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Stories Found</div>
          </td>
          <td style="padding:14px;text-align:center;border-right:1px solid #bae6fd;">
            <div style="font-size:22px;font-weight:800;color:#1d4ed8;">{len(source_breakdown)}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Sources Scanned</div>
          </td>
          <td style="padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#dc2626;">
              {sum(1 for s in stories if s.get('priority') in ('CRITICAL','HIGH'))}
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">High Priority</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Top Stories -->
  <tr>
    <td style="padding:8px 40px 0;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#111827;font-weight:700;
        border-bottom:2px solid #e5e7eb;padding-bottom:8px;">
        📌 Top Stories
      </h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        {story_rows if story_rows else '<tr><td style="color:#6b7280;padding:16px 0;font-size:13px;">No stories found for this topic today.</td></tr>'}
      </table>
    </td>
  </tr>

  <!-- Sources -->
  <tr>
    <td style="padding:24px 40px 8px;">
      <h2 style="margin:0 0 10px;font-size:15px;color:#111827;font-weight:700;
        border-bottom:2px solid #e5e7eb;padding-bottom:8px;">
        🗞️ Sources Monitored
      </h2>
      <div style="line-height:2.2;">{source_pills}</div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.8;">
        You're receiving this because you enabled daily digest in your
        <b>Optimus Intelligence</b> workspace.<br>
        To change your preferences, visit your workspace settings.<br>
        <span style="color:#d1d5db;">— Optimus Intelligence Platform</span>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>"""


async def _send_digest_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send digest via Resend API or SMTP fallback."""
    from_addr = settings.smtp_user or 'digest@optimus-intelligence.com'

    # Resend API
    if settings.resend_api_key:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    'https://api.resend.com/emails',
                    headers={'Authorization': f'Bearer {settings.resend_api_key}'},
                    json={'from': from_addr, 'to': [to_email], 'subject': subject, 'html': html_body},
                )
                if resp.status_code in (200, 201):
                    log.info('Digest sent via Resend → %s', to_email)
                    return True
                log.warning('Resend rejected digest for %s: %s %s', to_email, resp.status_code, resp.text)
        except Exception as exc:
            log.warning('Resend digest error for %s: %s', to_email, exc)

    # SMTP fallback
    if settings.smtp_host and settings.smtp_user:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From']    = from_addr
            msg['To']      = to_email
            msg.attach(MIMEText(html_body, 'html'))
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as srv:
                srv.login(settings.smtp_user, settings.smtp_pass)
                srv.sendmail(from_addr, [to_email], msg.as_string())
            log.info('Digest sent via SMTP → %s', to_email)
            return True
        except Exception as exc:
            log.warning('SMTP digest error for %s: %s', to_email, exc)

    log.warning('No email provider configured — digest not sent to %s', to_email)
    return False


def _log_digest_sent(email: str, topic: str, stories_count: int, status: str, error: str | None = None):
    """Persist digest delivery record."""
    try:
        with psycopg.connect(_db_url()) as conn:
            conn.execute(
                """
                INSERT INTO digest_logs (recipient_email, topic_domain, stories_count, status, error, sent_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (email, topic, stories_count, status, error),
            )
            conn.commit()
    except Exception as exc:
        log.debug('digest_logs insert failed: %s', exc)


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point (called by ARQ cron)
# ─────────────────────────────────────────────────────────────────────────────

async def send_daily_digests(ctx: dict) -> dict:
    """
    ARQ cron task: collect news for each subscriber and email their digest.
    Scheduled daily at 08:00 UTC via WorkerSettings.cron_jobs.
    """
    from app.ingestion.collector import collect_raw_articles
    from app.rules.pre_filter import apply_rule_pre_filter
    from app.services.source_reliability import score_articles
    from app.graph.workflow import graph

    subscribers = _get_digest_subscribers()
    log.info('Daily digest run: %d subscribers', len(subscribers))

    sent = 0
    failed = 0

    for sub in subscribers:
        email  = sub['email']
        topic  = sub['topic_domain']
        loc    = sub['location']
        recency = sub['recency']

        try:
            log.info('Digest: collecting news for %s → %s', email, topic)

            raw_articles, source_breakdown = await collect_raw_articles(
                query=topic, recency=recency
            )
            score_articles(raw_articles)

            filtered, _ = apply_rule_pre_filter(
                raw_articles, query=topic, topic_domain=topic,
                location=loc, recency=recency,
            )
            filtered = filtered[:settings.max_articles]

            stories: list[dict] = []
            if filtered:
                state = await graph.ainvoke({
                    'query': topic,
                    'topic_domain': topic,
                    'location': loc,
                    'recency': recency,
                    'keywords': [],
                    'raw_articles': filtered,
                    'pre_filter_stats': {},
                    'agent_logs': [],
                    'trace': [],
                    'run_id': str(__import__('uuid').uuid4()),
                })
                scored = state.get('scored_stories', [])
                stories = [
                    {
                        'title':            s.title,
                        'url':              s.representative_url,
                        'priority':         s.priority,
                        'importance_score': s.importance_score,
                        'narrative':        s.narrative,
                        'sources':          s.sources,
                    }
                    for s in scored
                ]

            html   = _build_digest_html(sub, stories, source_breakdown)
            subject = f'📰 Your Daily {topic} Digest — {datetime.now(timezone.utc).strftime("%b %d, %Y")}'
            ok     = await _send_digest_email(email, subject, html)

            _log_digest_sent(email, topic, len(stories), 'sent' if ok else 'failed')
            if ok:
                sent += 1
            else:
                failed += 1

        except Exception as exc:
            log.error('Digest failed for %s: %s', email, exc)
            _log_digest_sent(email, topic, 0, 'error', str(exc))
            failed += 1

    log.info('Daily digest complete: sent=%d failed=%d', sent, failed)
    return {'sent': sent, 'failed': failed, 'total': len(subscribers)}
