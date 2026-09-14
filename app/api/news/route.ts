import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";
import crypto from "crypto";

const POSITIVE_WORDS = new Set([
  "surge", "surges", "soar", "soars", "gain", "gains", "growth", "grow", "profit", "profits",
  "breakthrough", "innovative", "innovation", "lead", "leader", "leadership", "success",
  "successful", "record", "triumph", "expansion", "expand", "expands", "rally", "rallies",
  "upgrade", "upgrades", "win", "wins", "partner", "partnership", "optimistic", "boost", "boosts",
  "positive", "approved", "approval", "milestone", "revolutionary", "exceed", "exceeds"
]);

const NEGATIVE_WORDS = new Set([
  "crisis", "plunge", "plunges", "loss", "losses", "drop", "drops", "fall", "falls",
  "crash", "crashes", "lawsuit", "sue", "sued", "breach", "outage", "scandal", "fraud",
  "investigation", "probe", "fine", "fined", "penalty", "penalties", "decline", "declines",
  "layoff", "layoffs", "down", "warning", "warn", "warns", "risk", "risks", "threat",
  "threatens", "fail", "fails", "failure", "struggle", "struggles", "slump", "negative",
  "controversy", "delay", "delays", "violation", "deficit", "debt", "recession"
]);

function computeNLP(text: string, searchTerms: string[]): { sentiment: "positive" | "negative" | "neutral"; sentimentScore: string; relevanceScore: number } {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter(Boolean);

  let posCount = 0;
  let negCount = 0;

  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) posCount++;
    if (NEGATIVE_WORDS.has(w)) negCount++;
  }

  const totalSentimentWords = posCount + negCount;
  let rawScore = 0;
  if (totalSentimentWords > 0) {
    rawScore = (posCount - negCount) / Math.max(totalSentimentWords, 3);
  }

  const sentimentScore = Math.max(-1, Math.min(1, rawScore)).toFixed(2);
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (rawScore > 0.15) sentiment = "positive";
  else if (rawScore < -0.15) sentiment = "negative";

  let termMatches = 0;
  for (const term of searchTerms) {
    if (term.length > 2 && clean.includes(term)) {
      termMatches++;
    }
  }

  const matchRatio = searchTerms.length > 0 ? termMatches / searchTerms.length : 0.5;
  const relevanceScore = Math.min(99, Math.max(70, Math.round(75 + matchRatio * 22 + Math.min(words.length / 50, 2))));

  return { sentiment, sentimentScore, relevanceScore };
}

function getFromDate(recency: string): string {
  const now = Date.now();
  if (recency.includes("24")) return new Date(now - 24 * 3600 * 1000).toISOString().split("T")[0];
  if (recency.includes("7")) return new Date(now - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
  if (recency.includes("1 Month") || recency.includes("30")) return new Date(now - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
  if (recency.includes("3 Month") || recency.includes("90")) return new Date(now - 90 * 24 * 3600 * 1000).toISOString().split("T")[0];
  return new Date(now - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const location = searchParams.get("location") || "";
  const topicDomain = searchParams.get("topic_domain") || "";
  const recency = searchParams.get("recency") || "Last 24 Hours";

  // If no specific query is provided, use the configured topic domain
  let baseTerm = q.trim();
  if (!baseTerm) {
    baseTerm = topicDomain ? topicDomain.replace(/&.*/, "").trim() : "technology business";
  }

  let effectiveQuery = baseTerm;

  // Add domain context if not in base term
  if (topicDomain && !baseTerm.toLowerCase().includes(topicDomain.toLowerCase().split(" ")[0])) {
    const domainKeyword = topicDomain.replace(/&.*/, "").trim();
    effectiveQuery = `${baseTerm} ${domainKeyword}`;
  }

  // Add location context
  if (location && location !== "Global (All)") {
    if (location.includes("Tamil Nadu") || location.includes("TN")) {
      effectiveQuery = `${effectiveQuery} (Tamil Nadu OR Chennai OR TN)`;
    } else if (location.includes("Karnataka") || location.includes("Bangalore")) {
      effectiveQuery = `${effectiveQuery} (Karnataka OR Bangalore)`;
    } else if (location.includes("Maharashtra") || location.includes("Mumbai")) {
      effectiveQuery = `${effectiveQuery} (Maharashtra OR Mumbai)`;
    } else if (location.includes("India")) {
      effectiveQuery = `${effectiveQuery} India`;
    }
  }

  const fromDate = getFromDate(recency);
  const searchTerms = baseTerm.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);

  try {
    const [newsApiRes, guardianRes] = await Promise.allSettled([
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(effectiveQuery)}&from=${fromDate}&pageSize=${pageSize}&sortBy=publishedAt&language=en`,
        { headers: { "X-Api-Key": process.env.NEWSAPI_KEY! }, next: { revalidate: 120 } }
      ),
      fetch(
        `https://content.guardianapis.com/search?q=${encodeURIComponent(effectiveQuery)}&from-date=${fromDate}&page-size=${pageSize}&show-fields=trailText,thumbnail,byline,bodyText&api-key=${process.env.GUARDIAN_API_KEY}`,
        { next: { revalidate: 120 } }
      ),
    ]);

    const articles: any[] = [];

    if (newsApiRes.status === "fulfilled" && newsApiRes.value.ok) {
      const data = await newsApiRes.value.json();
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        const textToAnalyze = `${a.title} ${a.description || ""}`;
        const nlp = computeNLP(textToAnalyze, searchTerms);
        const idHash = crypto.createHash("md5").update(a.url || a.title).digest("hex").slice(0, 12);

        articles.push({
          id: `na-${idHash}`,
          title: a.title,
          url: a.url,
          source: a.source?.name || "NewsAPI",
          author: a.author || a.source?.name || "Staff Reporter",
          publishedAt: a.publishedAt || new Date().toISOString(),
          description: a.description,
          thumbnail: a.urlToImage,
          apiSource: "newsapi",
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    if (guardianRes.status === "fulfilled" && guardianRes.value.ok) {
      const data = await guardianRes.value.json();
      for (const a of (data.response?.results || [])) {
        const textToAnalyze = `${a.webTitle} ${a.fields?.trailText || ""}`;
        const nlp = computeNLP(textToAnalyze, searchTerms);
        const idHash = crypto.createHash("md5").update(a.webUrl || a.webTitle).digest("hex").slice(0, 12);

        articles.push({
          id: `gd-${idHash}`,
          title: a.webTitle,
          url: a.webUrl,
          source: "The Guardian",
          author: a.fields?.byline || "The Guardian Staff",
          publishedAt: a.webPublicationDate || new Date().toISOString(),
          description: a.fields?.trailText,
          thumbnail: a.fields?.thumbnail,
          apiSource: "guardian",
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    // Sort by published date descending
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      articles,
      total: articles.length,
      query: baseTerm,
      effectiveQuery,
      topic_domain: topicDomain || "All Topics",
      location: location || "Global (All)",
      recency,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
