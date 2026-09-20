"""
Deterministic Notification Dispatcher.
Dispatches CRITICAL and HIGH alerts to configured channels:
  - Slack (incoming webhooks with Block Kit)
  - Microsoft Teams (incoming webhooks with Adaptive Cards)
  - Email (Resend API or SMTP fallback)
Tracks delivery in the `notifications` DB table.
Strictly plain Python, zero AI/LLM involvement.
"""
from __future__ import annotations
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx
import psycopg

from app.core.config import settings
from app.schemas.news import Alert

log = logging.getLogger(__name__)


def _track_notification(
    alert_id: str,
    channel: str,
    recipient: str,
    status: str,
    error: str | None = None,
) -> None:
    """Persist notification delivery record to the database."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            conn.execute(
                '''INSERT INTO notifications (alert_id, channel, recipient, status, sent_at, error)
                   VALUES (%s, %s, %s, %s, NOW(), %s)''',
                (alert_id, channel, recipient, status, error),
            )
            conn.commit()
    except Exception as exc:
        log.debug('Failed to track notification: %s', exc)


async def send_slack_alert(alert: Alert) -> bool:
    """Send alert formatted message to Slack incoming webhook."""
    webhook_url = settings.slack_webhook_url
    if not webhook_url:
        return False

    emoji = '🚨' if alert.priority == 'CRITICAL' else '⚠️'
    payload = {
        'text': f'{emoji} *[{alert.priority} ALERT]* {alert.title}',
        'blocks': [
            {
                'type': 'header',
                'text': {
                    'type': 'plain_text',
                    'text': f'{emoji} {alert.priority} News Alert',
                    'emoji': True,
                },
            },
            {
                'type': 'section',
                'text': {
                    'type': 'mrkdwn',
                    'text': (
                        f'*<{alert.url}|{alert.title}>*\n'
                        f'*Score:* {alert.importance_score}/10 | '
                        f"*Sources:* {', '.join(alert.sources)}\n"
                        f'*Trigger:* {alert.reason}'
                    ),
                },
            },
            {
                'type': 'context',
                'elements': [
                    {
                        'type': 'mrkdwn',
                        'text': f'Triggered at: {alert.triggered_at} | Story ID: `{alert.story_id}`',
                    }
                ],
            },
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(webhook_url, json=payload)
            resp.raise_for_status()
            log.info('Slack notification dispatched for alert %s', alert.alert_id)
            _track_notification(alert.alert_id, 'slack', webhook_url[:50], 'sent')
            return True
    except Exception as exc:
        log.warning('Failed to dispatch Slack alert: %s', exc)
        _track_notification(alert.alert_id, 'slack', webhook_url[:50], 'failed', str(exc))
        return False


async def send_teams_alert(alert: Alert) -> bool:
    """Send alert to Microsoft Teams via incoming webhook (Adaptive Card)."""
    webhook_url = settings.teams_webhook_url
    if not webhook_url:
        return False

    emoji = '🚨' if alert.priority == 'CRITICAL' else '⚠️'
    payload = {
        'type': 'message',
        'attachments': [
            {
                'contentType': 'application/vnd.microsoft.card.adaptive',
                'content': {
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type': 'AdaptiveCard',
                    'version': '1.4',
                    'body': [
                        {
                            'type': 'TextBlock',
                            'text': f'{emoji} {alert.priority} News Alert',
                            'weight': 'Bolder',
                            'size': 'Large',
                        },
                        {
                            'type': 'TextBlock',
                            'text': alert.title,
                            'weight': 'Bolder',
                            'wrap': True,
                        },
                        {
                            'type': 'FactSet',
                            'facts': [
                                {'title': 'Score', 'value': f'{alert.importance_score}/10'},
                                {'title': 'Sources', 'value': ', '.join(alert.sources)},
                                {'title': 'Reason', 'value': alert.reason},
                                {'title': 'Time', 'value': alert.triggered_at},
                            ],
                        },
                    ],
                    'actions': [
                        {
                            'type': 'Action.OpenUrl',
                            'title': 'View Article',
                            'url': alert.url,
                        },
                    ],
                },
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(webhook_url, json=payload)
            resp.raise_for_status()
            log.info('Teams notification dispatched for alert %s', alert.alert_id)
            _track_notification(alert.alert_id, 'teams', webhook_url[:50], 'sent')
            return True
    except Exception as exc:
        log.warning('Failed to dispatch Teams alert: %s', exc)
        _track_notification(alert.alert_id, 'teams', webhook_url[:50], 'failed', str(exc))
        return False


async def send_email_alert(alert: Alert, recipient: str | None = None) -> bool:
    """Send alert email notification via Resend API or SMTP fallback."""
    to_email = recipient or settings.notification_email_to
    if not to_email:
        return False

    subject = f'[{alert.priority} ALERT] {alert.title}'
    priority_color = '#ef4444' if alert.priority == 'CRITICAL' else '#f59e0b'
    badge_bg = 'rgba(239, 68, 68, 0.15)' if alert.priority == 'CRITICAL' else 'rgba(245, 158, 11, 0.15)'
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
        <tr>
            <td style="padding: 24px; border-bottom: 1px solid #27272a;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td>
                            <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px;">
                                OPTIMUS SYSTEM ALERT
                            </span>
                        </td>
                        <td align="right">
                            <span style="font-family: monospace; color: #71717a; font-size: 12px;">{alert.triggered_at}</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 24px;">
                <div style="margin-bottom: 16px;">
                    <span style="display: inline-block; background-color: {badge_bg}; color: {priority_color}; border: 1px solid {priority_color}; font-size: 12px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 6px;">
                        {'🚨' if alert.priority == 'CRITICAL' else '⚠️'} {alert.priority} PRIORITY
                    </span>
                </div>
                
                <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0 0 16px 0;">
                    <a href="{alert.url}" style="color: #ffffff; text-decoration: none;">{alert.title}</a>
                </h1>
                
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; color: #e4e4e7;">
                        <tr>
                            <td width="100" style="color: #71717a; font-family: monospace; font-weight: 600;">IMPORTANCE</td>
                            <td style="color: {priority_color}; font-weight: 700;">{alert.importance_score} / 10</td>
                        </tr>
                        <tr>
                            <td style="color: #71717a; font-family: monospace; font-weight: 600;">SOURCES</td>
                            <td style="color: #a1a1aa;">{', '.join(alert.sources)}</td>
                        </tr>
                        <tr>
                            <td style="color: #71717a; font-family: monospace; font-weight: 600;">TRIGGER</td>
                            <td style="color: #a1a1aa;">{alert.reason}</td>
                        </tr>
                    </table>
                </div>

                <a href="{alert.url}" style="display: inline-block; width: 100%; box-sizing: border-box; text-align: center; background-color: #ffffff; color: #09090b; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 8px; text-decoration: none;">
                    Read Full Story &rarr;
                </a>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 24px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
                <p style="color: #71717a; font-size: 11px; font-family: monospace; margin: 0;">
                    // OPTIMUS INTELLIGENCE SYSTEM &bull; STORY ID: {alert.story_id}
                </p>
            </td>
        </tr>
    </table>
</body>
</html>"""

    # Try Resend API first
    if settings.resend_api_key:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(
                    'https://api.resend.com/emails',
                    headers={'Authorization': f'Bearer {settings.resend_api_key}'},
                    json={
                        'from': 'Optimus Intelligence <alerts@ajstudioz.co.in>',
                        'to': [to_email],
                        'subject': subject,
                        'html': html_body,
                    },
                )
                if resp.status_code in (200, 201):
                    _track_notification(alert.alert_id, 'email', to_email, 'sent')
                    return True
                _track_notification(alert.alert_id, 'email', to_email, 'failed', resp.text)
                return False
        except Exception as exc:
            log.warning('Resend email failed: %s', exc)
            _track_notification(alert.alert_id, 'email', to_email, 'failed', str(exc))

    # SMTP fallback
    if settings.smtp_host and settings.smtp_user:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.smtp_user
            msg['To'] = to_email
            msg.attach(MIMEText(html_body, 'html'))

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_pass)
                server.sendmail(settings.smtp_user, [to_email], msg.as_string())

            _track_notification(alert.alert_id, 'email', to_email, 'sent')
            return True
        except Exception as exc:
            log.warning('SMTP email failed: %s', exc)
            _track_notification(alert.alert_id, 'email', to_email, 'failed', str(exc))
            return False

    log.info('Email notification skipped (no email provider configured) for %s', to_email)
    return False


async def dispatch_alerts(
    alerts: list[Alert],
    recipient_email: str | None = None,
) -> dict[str, int]:
    """
    Dispatch all critical/high alerts to active channels.
    Returns dispatch stats.
    """
    slack_sent = 0
    teams_sent = 0
    email_sent = 0

    for a in alerts:
        if await send_slack_alert(a):
            slack_sent += 1
        if await send_teams_alert(a):
            teams_sent += 1
        if await send_email_alert(a, recipient_email):
            email_sent += 1

    return {
        'slack_dispatched': slack_sent,
        'teams_dispatched': teams_sent,
        'email_dispatched': email_sent,
        'total_alerts': len(alerts),
    }
