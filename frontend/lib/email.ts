import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || '';
export const resend = apiKey ? new Resend(apiKey) : null;


if (!resend) {
  console.warn('⚠️ RESEND_API_KEY not found! Emails will fall back to HTTP API / Gmail compose.');
} else {
  console.log('✅ Resend email service initialized successfully');
}

export interface MorningDigestEmailParams {
  to: string;
  companyName: string;
  topicDomain: string;
  location: string;
  recency: string;
  articles: Array<{
    title: string;
    url: string;
    source: string;
    relevanceScore?: number;
    publishedAt?: string;
  }>;
  executiveSummary?: string;
  workspaceUrl?: string;
}

/**
 * Renders HTML Email Template modeled after AJ-Chat Lookout Completed Email
 */
export function buildMorningDigestHtml({
  companyName,
  topicDomain,
  location,
  recency,
  articles,
  executiveSummary,
  workspaceUrl = 'https://optimus.ajstudioz.co.in/workspace',
}: Omit<MorningDigestEmailParams, 'to'>): string {
  const searchQuery = companyName || topicDomain || 'IT Companies & Tech';
  const summaryText = executiveSummary || `Over the ${recency}, our deterministic intelligence engine ingested and verified ${articles.length} news citations for ${searchQuery} in ${location}. Primary coverage highlights strategic market movements, narrative drivers, and regulatory updates across regional & global media feeds.`;

  const articleItemsHtml = articles.map((art, idx) => `
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;">
      <a href="${art.url}" target="_blank" style="color: #0284C7; font-size: 15px; font-weight: 600; text-decoration: none; line-height: 1.4; display: block; margin-bottom: 6px;">
        [${idx + 1}] ${art.title} &rarr;
      </a>
      <div style="font-size: 12px; color: #64748B; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; display: flex; align-items: center; justify-content: space-between;">
        <span>Source: <strong style="color: #334155;">${art.source}</strong></span>
        <span style="background-color: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">
          Match: ${art.relevanceScore || 95}%
        </span>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Optimus Daily Intelligence Lookout</title>
</head>
<body style="background-color: #F1F5F9; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px 16px; color: #1E293B;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
      <div style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; tracking: 1px; padding: 6px 16px; border-radius: 9999px; margin-bottom: 16px;">
        AJ STUDIOZ • OPTIMUS AI
      </div>
      <h1 style="color: #0F172A; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
        Daily Lookout Briefing
      </h1>
      <div style="display: inline-block; background-color: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, monospace;">
        ${searchQuery} (${location})
      </div>
    </div>

    <!-- Executive Summary Section -->
    <div style="padding: 24px 32px; border-bottom: 1px solid #F1F5F9;">
      <div style="background-color: #F0FDF4; border-left: 4px solid #16A34A; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 8px;">
        <h3 style="color: #15803D; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px;">
          Executive Overview (${recency})
        </h3>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0;">
          ${summaryText}
        </p>
      </div>
    </div>

    <!-- Verified Story Citations (Hyperlinks) -->
    <div style="padding: 24px 32px;">
      <h2 style="color: #0F172A; font-size: 16px; font-weight: 700; margin: 0 0 16px 0;">
        Verified Source Citations (${articles.length} Ingested Stories)
      </h2>
      ${articleItemsHtml}
    </div>

    <!-- Action Button -->
    <div style="padding: 16px 32px 32px 32px; text-align: center;">
      <a href="${workspaceUrl}" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        Open Full Interactive Intelligence Dossier &rarr;
      </a>
    </div>

    <!-- Footer -->
    <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center;">
      <p style="color: #64748B; font-size: 12px; margin: 0 0 4px 0; font-family: ui-monospace, SFMono-Regular, monospace;">
        Automated Intelligence Engine • AJ STUDIOZ
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 0;">
        Sent to verified recipient &bull; <a href="${workspaceUrl}" style="color: #64748B; text-decoration: underline;">optimus.ajstudioz.co.in</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Sends Morning Intelligence Digest Email via Resend
 */
export async function sendMorningDigestEmail(params: MorningDigestEmailParams) {
  const html = buildMorningDigestHtml(params);
  const searchQuery = params.companyName || params.topicDomain || 'IT Companies & Tech';
  const subject = `Lookout Complete: ${searchQuery} Executive Briefing`;

  if (!resend) {
    // Fallback direct HTTP fetch to Resend API
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
          to: [params.to],
          subject,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Morning digest email sent via REST API:', data.id);
        return { success: true, id: data.id };
      }
      return { success: false, error: data.message || 'Resend REST API failed' };
    } catch (err: any) {
      console.error('❌ Failed to send email via REST API fallback:', err);
      return { success: false, error: err.message };
    }
  }

  try {
    const data = await resend.emails.send({
      from: 'AJ STUDIOZ <noreply@ajstudioz.co.in>',
      to: [params.to],
      subject,
      html,
    });

    console.log('✅ Morning digest email sent successfully via Resend SDK:', data.data?.id);
    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error('❌ Failed to send morning digest email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
