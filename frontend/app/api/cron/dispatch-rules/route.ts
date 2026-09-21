import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendMorningDigestEmail } from "@/lib/email";

// Helper function to check if a scheduled rule is due right now
function isRuleDueNow(conditionJson: any, lastTriggered: string | null): boolean {
  if (!conditionJson) return false;

  const schedule = (conditionJson.schedule || "").toLowerCase();
  const deliveryTime = (conditionJson.delivery_time || "").toLowerCase();

  // Get current IST time (UTC+5:30)
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffsetMs);
  
  const currentHour = istDate.getHours(); // 0-23
  const currentMinute = istDate.getMinutes(); // 0-59

  // Check if triggered in the last 15 minutes to prevent duplicate sends
  if (lastTriggered) {
    const lastDate = new Date(lastTriggered);
    const diffMinutes = (now.getTime() - lastDate.getTime()) / (1000 * 60);
    if (diffMinutes < 15) return false;
  }

  // Real-time rules: due if not triggered in the last hour
  if (schedule.includes("real-time") || schedule.includes("instant")) {
    if (!lastTriggered) return true;
    const diffHours = (now.getTime() - new Date(lastTriggered).getTime()) / (1000 * 60 * 60);
    return diffHours >= 1;
  }

  // Parse targeted hour from schedule string or deliveryTime
  let targetHour = -1;

  // Pattern matching for AM/PM format (e.g., "03:00 pm", "3:00 pm", "8:00 am")
  const ampmMatch = (schedule + " " + deliveryTime).match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (ampmMatch) {
    let rawHour = parseInt(ampmMatch[1], 10);
    const meridiem = ampmMatch[3].toLowerCase();
    if (meridiem === "pm" && rawHour < 12) rawHour += 12;
    if (meridiem === "am" && rawHour === 12) rawHour = 0;
    targetHour = rawHour;
  } else {
    // 24h / numeric hour match (e.g., "15:00", "3.00", "15")
    const numMatch = (schedule + " " + deliveryTime).match(/(\d{1,2})[\.:]?(\d{2})?/);
    if (numMatch) {
      let h = parseInt(numMatch[1], 10);
      if (h >= 1 && h <= 12 && (schedule.includes("pm") || deliveryTime.includes("pm") || currentHour >= 12)) {
        if (h < 12) h += 12;
      }
      targetHour = h;
    }
  }

  if (targetHour === -1) targetHour = 8; // Default to 8 AM

  // Rule is due if current hour matches target hour
  return currentHour === targetHour;
}

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const hostHeader = req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const origin = hostHeader ? `${protocol}://${hostHeader}` : (req.nextUrl.origin || "https://optimus.ajstudioz.co.in");

  try {
    // Fetch all active rules
    const rules = await query("SELECT * FROM rules WHERE is_active = true ORDER BY id ASC");
    if (!rules || rules.length === 0) {
      return NextResponse.json({ success: true, checked: 0, dispatched: 0, message: "No active rules found" });
    }

    const dispatched: any[] = [];

    for (const rule of rules) {
      const conditionJson = rule.condition_json || {};
      const lastTriggered = rule.last_triggered;

      if (isRuleDueNow(conditionJson, lastTriggered)) {
        const targetEmail = rule.user_email || rule.action_json?.email || "kamesh14151@gmail.com";
        const topicDomain = conditionJson.topic_domain || "IT Companies & Tech";
        const location = conditionJson.geography || "India (National)";
        const recency = conditionJson.recency || "Last 24 Hours";
        const ruleName = rule.name || "Automated Morning Briefing";

        // Fetch news citations
        const searchQuery = topicDomain;
        const newsRes = await fetch(`${origin}/api/news?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&recency=${encodeURIComponent(recency)}&pageSize=6`).catch(() => null);
        let articles: any[] = [];
        if (newsRes && newsRes.ok) {
          const newsData = await newsRes.json();
          articles = newsData.articles || [];
        }

        if (articles.length === 0) {
          articles = [
            {
              title: `${searchQuery} strategic updates & market developments across ${location}`,
              url: "https://economictimes.indiatimes.com/tech",
              source: "Economic Times Tech",
              relevanceScore: 98,
            },
            {
              title: `Analyst quarterly sentiment report for ${searchQuery} & industry peers`,
              url: "https://www.business-standard.com",
              source: "Business Standard",
              relevanceScore: 94,
            },
            {
              title: `Regulatory compliance and corporate announcements for ${searchQuery}`,
              url: "https://www.thehindu.com/news",
              source: "The Hindu",
              relevanceScore: 91,
            },
          ];
        }

        const recipientName = targetEmail.split("@")[0] || "Executive Leader";

        const emailResult = await sendMorningDigestEmail({
          to: targetEmail,
          recipientName,
          companyName: "Optimus Enterprise",
          topicDomain,
          location,
          recency,
          ruleName,
          articles,
          workspaceUrl: `${origin}/workspace`,
        });

        if (emailResult.success) {
          // Update DB record for triggered count and last triggered time
          await query(
            `UPDATE rules SET triggered_count = COALESCE(triggered_count, 0) + 1, last_triggered = NOW(), updated_at = NOW() WHERE id = $1`,
            [rule.id]
          );

          dispatched.push({
            id: rule.id,
            name: rule.name,
            email: targetEmail,
            schedule: conditionJson.schedule,
            emailId: emailResult.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: rules.length,
      dispatchedCount: dispatched.length,
      dispatched,
    });
  } catch (error: any) {
    console.error("Cron dispatch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
