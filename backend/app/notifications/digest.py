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
    """Render a Grok-style dark theme HTML digest email."""
    name          = subscriber['name']
    topic         = subscriber['topic_domain']
    location      = subscriber['location']
    generated_at  = datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')

    # Top stories rows
    story_cards = ''
    for i, s in enumerate(stories[:10], 1):
        priority = s.get('priority', 'MEDIUM')
        badge_style = {
            'CRITICAL': 'background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.4);',
            'HIGH':     'background:rgba(245,158,11,0.2);color:#f59e0b;border:1px solid rgba(245,158,11,0.4);',
            'MEDIUM':   'background:rgba(59,130,246,0.2);color:#3b82f6;border:1px solid rgba(59,130,246,0.4);',
            'LOW':      'background:#27272a;color:#a1a1aa;border:1px solid #3f3f46;',
        }.get(priority, 'background:#27272a;color:#a1a1aa;')

        sources_str = ', '.join(s.get('sources', [])[:2]) or 'Verified News Source'
        story_cards += f"""
        <div style="background:#141417;border:1px solid #27272a;border-radius:14px;padding:16px 18px;margin-bottom:12px;">
          <div style="font-family:monospace;font-size:11px;color:#71717a;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
            <span style="font-weight:700;color:#10b981;">#{i}</span>
            <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;{badge_style}">{priority}</span>
            <span>· {sources_str}</span>
            <span style="margin-left:auto;color:#a1a1aa;font-weight:600;">{s.get('importance_score',0):.0f}/100</span>
          </div>
          <a href="{s.get('url','#')}" target="_blank" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;line-height:1.4;display:block;margin-bottom:6px;">
            {s.get('title','')}
          </a>
          <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;">
            {s.get('narrative','')[:180]}{'…' if len(s.get('narrative',''))>180 else ''}
          </p>
        </div>"""

    # Source pills
    source_pills = ''
    for src, cnt in list(source_breakdown.items())[:12]:
        source_pills += (
            f'<span style="display:inline-block;background:#18181b;border:1px solid #27272a;'
            f'color:#a1a1aa;font-family:monospace;font-size:11px;padding:4px 10px;border-radius:999px;margin:3px;">'
            f'{src} <b style="color:#ffffff;">({cnt})</b></span>'
        )

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Optimus Grok Intelligence Briefing</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:32px 12px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background-color:#121215;border:1px solid #27272a;border-radius:20px;overflow:hidden;max-width:620px;">

  <!-- Header -->
  <tr>
    <td style="background-color:#000000;padding:32px 32px 24px 32px;border-bottom:1px solid #27272a;">
      <div style="font-family:monospace;font-size:11px;font-weight:700;color:#10b981;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);padding:4px 12px;border-radius:999px;display:inline-block;letter-spacing:1px;text-transform:uppercase;">
        ⚡ GROK-STYLE INTELLIGENCE DOSSIER
      </div>
      <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:14px 0 6px 0;letter-spacing:-0.5px;">
        {topic} Briefing
      </h1>
      <div style="font-size:12px;color:#71717a;font-family:monospace;">
        Scope: <b style="color:#d4d4d8;">{location}</b> &nbsp;·&nbsp; Generated: <b style="color:#d4d4d8;">{generated_at}</b>
      </div>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style="padding:24px 32px 12px 32px;">
      <p style="margin:0;font-size:15px;color:#e4e4e7;line-height:1.6;">
        Good morning, <b style="color:#ffffff;">{name}</b> 👋
      </p>
      <p style="margin:8px 0 0 0;font-size:13px;color:#a1a1aa;line-height:1.6;">
        Here is your AI-curated intelligence briefing for <b style="color:#ffffff;">{topic}</b> — analyzed across <b>{len(source_breakdown)}</b> verified media sources.
      </p>
    </td>
  </tr>

  <!-- Stats Grid -->
  <tr>
    <td style="padding:12px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="32%" style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;font-family:monospace;">{len(stories)}</div>
            <div style="font-size:10px;color:#71717a;font-family:monospace;text-transform:uppercase;margin-top:2px;">Stories Analyzed</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#3b82f6;font-family:monospace;">{len(source_breakdown)}</div>
            <div style="font-size:10px;color:#71717a;font-family:monospace;text-transform:uppercase;margin-top:2px;">Sources Monitored</div>
          </td>
          <td width="2%"></td>
          <td width="32%" style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ef4444;font-family:monospace;">{sum(1 for s in stories if s.get('priority') in ('CRITICAL','HIGH'))}</div>
            <div style="font-size:10px;color:#71717a;font-family:monospace;text-transform:uppercase;margin-top:2px;">High Priority</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Top Stories -->
  <tr>
    <td style="padding:16px 32px 8px 32px;">
      <div style="font-size:11px;font-weight:700;color:#71717a;font-family:monospace;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #27272a;padding-bottom:8px;margin-bottom:16px;">
        // TOP CURATED NARRATIVE CLUSTERS
      </div>
      {story_cards if story_cards else '<div style="color:#71717a;font-family:monospace;font-size:13px;padding:16px 0;">No high-priority stories detected for this scope window.</div>'}
    </td>
  </tr>

  <!-- Sources -->
  <tr>
    <td style="padding:16px 32px 12px 32px;">
      <div style="font-size:11px;font-weight:700;color:#71717a;font-family:monospace;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #27272a;padding-bottom:8px;margin-bottom:12px;">
        // SOURCES & PUBLISHERS INDEXED
      </div>
      <div style="line-height:2.2;">{source_pills}</div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#000000;padding:24px 32px;border-top:1px solid #27272a;text-align:center;">
      <p style="margin:0;font-size:11px;color:#52525b;font-family:monospace;line-height:1.7;">
        Sent autonomously by <b style="color:#71717a;">Optimus Intelligence</b> · Domain: <b style="color:#71717a;">ajstudioz.co.in</b><br>
        To manage preferences, log into your Optimus Media Discovery workspace.
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
    from_addr = 'Optimus Intelligence <digest@ajstudioz.co.in>'

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
