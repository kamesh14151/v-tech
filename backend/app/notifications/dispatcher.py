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
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: {'#dc2626' if alert.priority == 'CRITICAL' else '#f59e0b'};">
            {'🚨' if alert.priority == 'CRITICAL' else '⚠️'} {alert.priority} News Alert
        </h2>
        <h3><a href="{alert.url}" style="color: #2563eb;">{alert.title}</a></h3>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; font-weight: bold;">Score</td><td style="padding: 8px;">{alert.importance_score}/10</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Sources</td><td style="padding: 8px;">{', '.join(alert.sources)}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Reason</td><td style="padding: 8px;">{alert.reason}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 12px;">Generated at {alert.triggered_at} | Story: {alert.story_id}</p>
    </div>
    """

    # Try Resend API first
    if settings.resend_api_key:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(
                    'https://api.resend.com/emails',
                    headers={'Authorization': f'Bearer {settings.resend_api_key}'},
                    json={
                        'from': 'alerts@optimus-intelligence.com',
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
