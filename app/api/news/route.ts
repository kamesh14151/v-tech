import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

// Fetch news from NewsAPI + Guardian in parallel and return unified results
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "enterprise technology";
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  try {
    const [newsApiRes, guardianRes] = await Promise.allSettled([
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${pageSize}&sortBy=publishedAt&language=en`,
        { headers: { "X-Api-Key": process.env.NEWSAPI_KEY! }, next: { revalidate: 300 } }
      ),
      fetch(
        `https://content.guardianapis.com/search?q=${encodeURIComponent(q)}&page-size=${pageSize}&show-fields=trailText,thumbnail,wordcount&api-key=${process.env.GUARDIAN_API_KEY}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const articles: any[] = [];

    if (newsApiRes.status === "fulfilled" && newsApiRes.value.ok) {
      const data = await newsApiRes.value.json();
      for (const a of data.articles || []) {
        articles.push({
          id: `na-${Math.random().toString(36).slice(2)}`,
          title: a.title,
          url: a.url,
          source: a.source?.name || "NewsAPI",
          author: a.author,
          publishedAt: a.publishedAt,
          description: a.description,
          thumbnail: a.urlToImage,
          apiSource: "newsapi",
          relevanceScore: Math.floor(Math.random() * 20) + 80,
          sentimentScore: (Math.random() * 2 - 1).toFixed(2),
          sentiment: Math.random() > 0.3 ? "positive" : Math.random() > 0.5 ? "neutral" : "negative",
        });
      }
    }

    if (guardianRes.status === "fulfilled" && guardianRes.value.ok) {
      const data = await guardianRes.value.json();
      for (const a of (data.response?.results || [])) {
        articles.push({
          id: `gd-${Math.random().toString(36).slice(2)}`,
          title: a.webTitle,
          url: a.webUrl,
          source: "The Guardian",
          author: a.fields?.byline,
          publishedAt: a.webPublicationDate,
          description: a.fields?.trailText,
          thumbnail: a.fields?.thumbnail,
          apiSource: "guardian",
          relevanceScore: Math.floor(Math.random() * 15) + 85,
          sentimentScore: (Math.random() * 2 - 1).toFixed(2),
          sentiment: Math.random() > 0.3 ? "positive" : Math.random() > 0.5 ? "neutral" : "negative",
        });
      }
    }

    // Sort by published date descending
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ articles, total: articles.length, query: q });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Save a specific article to the DB for this user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, url, source, publishedAt, description, sentiment, relevanceScore, apiSource } = body;

  try {
    const rows = await query(
      `INSERT INTO articles (user_id, title, url, source, published_at, description, sentiment, relevance_score, api_source, saved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       ON CONFLICT DO NOTHING RETURNING *`,
      [session.user.id, title, url, source, publishedAt, description, sentiment, relevanceScore, apiSource]
    );
    return NextResponse.json({ article: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
