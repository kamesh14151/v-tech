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

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns="http://www.w3.org/1999/xhtml">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no">
  <title>{topic} Executive Intelligence Briefing</title>
  <!--[if (mso 16)]>
      <style type="text/css">
         a {{text-decoration: none;}}
      </style>
      <![endif]-->
  <!--[if gte mso 9]>
      <style>sup {{ font-size: 100% !important; }}</style>
      <![endif]-->
  <!--[if gte mso 9]>
      <noscript>
         <xml>
           <o:OfficeDocumentSettings>
           <o:AllowPNG></o:AllowPNG>
           <o:PixelsPerInch>96</o:PixelsPerInch>
           </o:OfficeDocumentSettings>
         </xml>
      </noscript>
      <![endif]-->
  <!--[if mso]><xml>
    <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
      <w:DontUseAdvancedTypographyReadingMail/>
    </w:WordDocument>
    </xml><![endif]-->
  <!--[if !mso]><!-- -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=League+Spartan:wght@200;300;400;500;600;700&display=swap">
  <!--<![endif]-->
  <style type="text/css">
u + .body img ~ div div {{ display:none; }}
#outlook a {{ padding:0; }}
span.MsoHyperlink, span.MsoHyperlinkFollowed {{ color:inherit; mso-style-priority:99; }}
a.es-button {{ mso-style-priority:100!important; text-decoration:none!important; }}
a[x-apple-data-detectors], #MessageViewBody a {{ color:inherit!important; text-decoration:none!important; font-size:inherit!important; font-family:inherit!important; font-weight:inherit!important; line-height:inherit!important; }}
.es-desk-hidden {{ display:none; float:left; overflow:hidden; width:0; max-height:0; line-height:0; mso-hide:all; }}
.es-header, .esd-header-popover:not(.es-content) {{ background-color:transparent }}
.es-footer, .esd-footer-popover:not(.es-content) {{ background-color:transparent }}
@media only screen and (max-width:600px) {{
  .es-m-p20b {{ padding-bottom:20px!important }}
  .es-m-p20 {{ padding:20px!important }}
  .es-m-p20t {{ padding-top:20px!important }}
  .es-m-p20r {{ padding-right:20px!important }}
  .es-m-p30b {{ padding-bottom:30px!important }}
  .es-m-p20l {{ padding-left:20px!important }}
  .es-m-p10r {{ padding-right:10px!important }}
  .es-m-p0r {{ padding-right:0px!important }}
  .es-m-p0l {{ padding-left:0px!important }}
  .es-m-p10b {{ padding-bottom:10px!important }}
  .es-m-p15t {{ padding-top:15px!important }}
  .es-m-p15b {{ padding-bottom:15px!important }}
  .es-m-p10t {{ padding-top:10px!important }}
  .es-p-default {{ }}
  *[class="gmail-fix"] {{ display:none!important }}
  p, a {{ line-height:150%!important }}
  h1, h1 a {{ line-height:120%!important }}
  h2, h2 a {{ line-height:120%!important }}
  h3, h3 a {{ line-height:120%!important }}
  h4, h4 a {{ line-height:120%!important }}
  h5, h5 a {{ line-height:120%!important }}
  h6, h6 a {{ line-height:120%!important }}
  h1 {{ font-size:32px!important; text-align:center }}
  h2 {{ font-size:26px!important; text-align:left }}
  h3 {{ font-size:22px!important; text-align:left }}
  h4 {{ font-size:18px!important; text-align:left }}
  .es-header-body p, .es-header-body a {{ font-size:14px!important }}
  .es-content-body p, .es-content-body a {{ font-size:16px!important }}
  .es-footer-body p, .es-footer-body a {{ font-size:12px!important }}
  .es-infoblock p, .es-infoblock a {{ font-size:12px!important }}
  .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4 {{ text-align:center!important }}
  .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button {{ display:block!important }}
  .es-m-il, .es-m-il .es-button, .es-social, .es-social td {{ display:inline-block!important }}
  .es-adaptive table, .es-left, .es-right {{ width:100%!important; border-collapse:separate!important }}
  .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header {{ width:100%!important; max-width:600px!important }}
  .adapt-img {{ width:100%!important; height:auto!important }}
  .es-adapt-td {{ display:block!important; width:100%!important }}
}}
@media screen and (max-width:384px) {{ .mail-message-content {{ width:414px!important }} }}
  </style>
 </head>
 <body class="body" style="width:100%;height:100%;font-family:Inter, Helvetica, Arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0;background-color:#F8F8F8">
  <div dir="ltr" lang="en" class="es-wrapper-color" style="background-color:#F8F8F8">
   <!--[if gte mso 9]>
   <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
     <v:fill type="tile" color="#f8f8f8" ></v:fill>
   </v:background>
   <![endif]-->
   <table width="100%" cellspacing="0" cellpadding="0" class="es-wrapper" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%">
    <tbody>
     <tr>
      <td valign="top" style="padding:0;Margin:0">
       <table cellspacing="0" cellpadding="0" align="center" class="es-header" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table align="center" cellspacing="0" cellpadding="0" bgcolor="#F9F1E8" class="es-header-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#F9F1E8;width:600px;border-radius:12px 12px 0 0" role="none">
            <tbody>
             <tr>
              <td align="center" style="Margin:0;padding:30px 20px 10px">
               <table align="center" cellspacing="0" cellpadding="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <div style="display:inline-block;background-color:#000000;color:#ffffff;padding:8px 16px;border-radius:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                     <table border="0" cellspacing="0" cellpadding="0" style="display:inline-table;vertical-align:middle">
                       <tr>
                         <td style="padding-right:10px;vertical-align:middle">
                           <img src="https://optimus.ajstudioz.co.in/logo.jpeg" alt="Optimus Logo" width="28" height="28" style="display:block;width:28px;height:28px;border-radius:6px;object-fit:cover;border:0" />
                         </td>
                         <td style="color:#ffffff;font-size:12px;font-weight:800;font-family:Inter, sans-serif;text-transform:uppercase;letter-spacing:1.5px;vertical-align:middle">
                           OPTIMUS ENTERPRISE INTELLIGENCE
                         </td>
                       </tr>
                     </table>
                   </div>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
             <tr>
              <td align="left" class="es-m-p20" style="Margin:0;padding:25px 40px 30px">
               <table width="100%" cellpadding="0" cellspacing="0" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <h1 class="es-m-txt-c" style="Margin:0;font-family:Inter, sans-serif;letter-spacing:-0.5px;font-size:32px;font-weight:900;line-height:40px;color:#151515;text-align:center">{topic} Executive Briefing</h1>
                   <p style="Margin:12px 0 0;font-family:Inter, sans-serif;line-height:24px;color:#4b5563;font-size:15px;text-align:center">Good Morning, {name} 👋 Scope: {location} &bull; Generated: {generated_at}</p>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
       <table cellspacing="0" cellpadding="0" align="center" class="es-content" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table bgcolor="#ffffff" align="center" cellspacing="0" cellpadding="0" class="es-content-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#FFFFFF;width:600px;border-radius:0 0 12px 12px">
            <tbody>
             <tr>
              <td align="left" class="es-m-p20l es-m-p20r" style="Margin:0;padding:30px 35px">
               
               <!-- Overview -->
               <div style="background-color:#FAFAFA;border-left:4px solid #000000;border-radius:0 8px 8px 0;padding:18px 20px;margin-bottom:24px">
                 <h3 style="color:#000000;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:1px;font-family:Inter, monospace">
                   EXECUTIVE OVERVIEW ({topic.upper()})
                 </h3>
                 <p style="color:#27272A;font-size:14px;line-height:1.6;margin:0">
                   Here is your AI-curated intelligence briefing for <b>{topic}</b> — analyzed across <b>{len(source_breakdown)}</b> verified media sources.
                 </p>
               </div>

               <!-- Citations -->
               <h2 style="color:#000000;font-size:18px;font-weight:800;margin:0 0 16px 0;letter-spacing:-0.3px">
                 Verified Source Citations ({len(stories)} Ingested Stories)
               </h2>
               {story_cards if story_cards else '<div style="color:#71717a;font-family:Inter;font-size:14px;padding:16px 0;">No high-priority stories detected for this scope window.</div>'}

               <!-- Publishers Pill Index -->
               <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E4E4E7">
                 <h3 style="color:#71717a;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 12px 0;letter-spacing:1px;font-family:Inter, monospace">
                   SOURCES & PUBLISHERS INDEXED
                 </h3>
                 <div style="line-height:2.2;">{source_pills}</div>
               </div>

               <!-- Action Button -->
               <div style="padding:28px 0 12px;text-align:center">
                 <span class="es-button-border" style="border-style:solid;border-color:#2CB543;background:#000000;border-width:0px;display:inline-block;border-radius:35px;width:auto">
                   <a href="https://optimus.ajstudioz.co.in/workspace" target="_blank" class="es-button" style="text-decoration:none !important;color:#FFFFFF;font-size:16px;font-weight:bold;padding:13px 45px;display:inline-block;background:#000000;border-radius:35px;font-family:Inter, sans-serif;line-height:22px;width:auto;text-align:center">Open Interactive Intelligence Dossier &rarr;</a>
                 </span>
               </div>

              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
       <table cellspacing="0" cellpadding="0" align="center" class="es-footer" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
        <tbody>
         <tr>
          <td align="center" style="padding:0;Margin:0">
           <table cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center" class="es-footer-body" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#FFFFFF;width:600px;margin-top:15px;border-radius:12px">
            <tbody>
             <tr>
              <td align="left" style="padding:15px;Margin:0">
               <table cellspacing="0" cellpadding="0" width="100%" role="none" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                <tbody>
                 <tr>
                  <td align="center" style="padding:0;Margin:0">
                   <table cellspacing="0" width="100%" cellpadding="0" class="es-menu es-menu-1939" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                    <tbody>
                     <tr class="links">
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0">
                       <a href="https://optimus.ajstudioz.co.in" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Workspace</a>
                      </td>
                      <td width="25.00%" align="center" valign="top" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/privacy" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Privacy</a>
                      </td>
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/terms" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Terms</a>
                      </td>
                      <td align="center" valign="top" width="25.00%" style="padding:5px 0;Margin:0;border:0;border-left:1px solid #e4e4e7">
                       <a href="https://optimus.ajstudioz.co.in/contact" target="_blank" style="text-decoration:none;font-family:Inter, sans-serif;font-weight:600;color:#151515;font-size:13px">Support</a>
                      </td>
                     </tr>
                    </tbody>
                   </table>
                  </td>
                 </tr>
                </tbody>
               </table>
              </td>
             </tr>
             <tr>
              <td align="center" style="Margin:0;padding:10px 15px 25px">
                <p style="Margin:0;font-family:monospace;font-size:11px;color:#71717a;letter-spacing:0.5px">
                  AUTOMATED INTELLIGENCE DISPATCH &bull; OPTIMUS ENTERPRISE PLATFORM
                </p>
              </td>
             </tr>
            </tbody>
           </table>
          </td>
         </tr>
        </tbody>
       </table>
      </td>
     </tr>
    </tbody>
   </table>
  </div>
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
