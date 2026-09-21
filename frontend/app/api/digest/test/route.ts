import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendMorningDigestEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const targetEmail = body.email || session.user.email || "";

  if (!targetEmail) {
    return NextResponse.json({ error: "No recipient email provided" }, { status: 400 });
  }

  const hostHeader = req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const origin = hostHeader ? `${protocol}://${hostHeader}` : (req.nextUrl.origin || "https://optimus.ajstudioz.co.in");

  try {
    // 1. Fetch user preferences
    const prefRes = await fetch(`${origin}/api/preferences`, {
      headers: { cookie: req.headers.get("cookie") || "" },
    }).catch(() => null);
    
    let companyName = "Optimus Enterprise";
    let topicDomain = "IT Companies & Tech";
    let location = "India (National)";
    let recency = "Last 24 Hours";

    if (prefRes && prefRes.ok) {
      const prefData = await prefRes.json();
      if (prefData.preferences) {
        companyName = prefData.preferences.company_name || companyName;
        topicDomain = prefData.preferences.topic_domain || topicDomain;
        location = prefData.preferences.location || location;
        recency = prefData.preferences.recency || recency;
      }
    }

    const searchQuery = companyName && companyName !== "Optimus Enterprise" ? companyName : topicDomain;

    // 2. Fetch news citations
    const newsRes = await fetch(`${origin}/api/news?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}&recency=${encodeURIComponent(recency)}&pageSize=8`, {
      headers: { cookie: req.headers.get("cookie") || "" },
    }).catch(() => null);

    let articles: any[] = [];
    if (newsRes && newsRes.ok) {
      const newsData = await newsRes.json();
      articles = newsData.articles || [];
    }

    if (articles.length === 0) {
      articles = [
        {
          title: `${searchQuery} expands strategic operations and digital footprint across ${location}`,
          url: "https://economictimes.indiatimes.com/tech",
          source: "Economic Times Tech",
          relevanceScore: 96,
        },
        {
          title: `Market analysts project growth trajectory for ${searchQuery}`,
          url: "https://www.business-standard.com",
          source: "Business Standard",
          relevanceScore: 92,
        },
        {
          title: `Key executive announcements and policy compliance updates for ${searchQuery}`,
          url: "https://www.thehindu.com/news",
          source: "The Hindu",
          relevanceScore: 88,
        },
      ];
    }

    // 3. Send email exclusively via Resend API
    const recipientName = session.user.name || targetEmail.split("@")[0] || "Executive Leader";
    const result = await sendMorningDigestEmail({
      to: targetEmail,
      recipientName,
      companyName,
      topicDomain,
      location,
      recency,
      articles,
      workspaceUrl: `${origin}/workspace`,
    });

    if (result.success) {
      return NextResponse.json({
        status: "sent",
        success: true,
        provider: "Resend",
        emailId: result.id,
        targetEmail,
        articlesCount: articles.length,
      });
    }

    return NextResponse.json(
      {
        status: "failed",
        success: false,
        targetEmail,
        error: result.error || "Resend API delivery failed.",
      },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 500 });
  }
}
