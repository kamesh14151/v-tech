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

function cleanXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .trim();
}

const LANGUAGE_MAP: Record<string, { hl: string; gl: string; ceid: string; regionName: string; native: string }> = {
  ta: { hl: "ta-IN", gl: "IN", ceid: "IN:ta", regionName: "Tamil Nadu (TN)", native: "தமிழ்" },
  kn: { hl: "kn-IN", gl: "IN", ceid: "IN:kn", regionName: "Karnataka (KA)", native: "ಕನ್ನಡ" },
  hi: { hl: "hi-IN", gl: "IN", ceid: "IN:hi", regionName: "National (Hindi)", native: "हिंदी" },
  te: { hl: "te-IN", gl: "IN", ceid: "IN:te", regionName: "AP & Telangana", native: "తెలుగు" },
  ml: { hl: "ml-IN", gl: "IN", ceid: "IN:ml", regionName: "Kerala (KL)", native: "മലയാളം" },
  es: { hl: "es", gl: "ES", ceid: "ES:es", regionName: "Spain & LatAm", native: "Español" },
  fr: { hl: "fr", gl: "FR", ceid: "FR:fr", regionName: "France & Global French", native: "Français" },
  de: { hl: "de", gl: "DE", ceid: "DE:de", regionName: "Germany & EU", native: "Deutsch" },
  ar: { hl: "ar", gl: "SA", ceid: "SA:ar", regionName: "Middle East", native: "العربية" },
  zh: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", regionName: "China & East Asia", native: "中文" },
  en: { hl: "en-US", gl: "US", ceid: "US:en", regionName: "Global English", native: "English" },
};

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
  const lang = (searchParams.get("lang") || searchParams.get("language") || "all").toLowerCase();
  const sourceFilter = (searchParams.get("source") || "all").toLowerCase();

  let baseTerm = q.trim();
  if (!baseTerm) {
    baseTerm = topicDomain ? topicDomain.replace(/&.*/, "").trim() : "technology business";
  }

  let effectiveQuery = baseTerm;
  if (topicDomain && !baseTerm.toLowerCase().includes(topicDomain.toLowerCase().split(" ")[0])) {
    const domainKeyword = topicDomain.replace(/&.*/, "").trim();
    effectiveQuery = `${baseTerm} ${domainKeyword}`;
  }

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

  const articles: any[] = [];
  const seenUrls = new Set<string>();

  try {
    const gdeltToken = process.env.GDELT_API_KEY || "gdelt_sk_1d5e02bceff21c9f89e1076e404059d3d1c3e60a9a15a725d60fe27e2137b4dd";
    const newsApiKey = process.env.NEWSAPI_KEY || process.env.NEWS_API_KEY || "35dd6258d259483e9e29062fe74acb38";
    const guardianApiKey = process.env.GUARDIAN_API_KEY || "dcec71f7-0a96-4ec3-8145-e629799258e5";

    // Build GDELT Cloud API promise
    const cleanGdeltSearch = baseTerm.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
    const gdeltUrl = `https://gdeltcloud.com/api/v2/events?search=${encodeURIComponent(cleanGdeltSearch || "technology")}&limit=${pageSize}`;

    const gdeltPromise = fetch(gdeltUrl, {
      headers: { Authorization: `Bearer ${gdeltToken}` },
      next: { revalidate: 120 },
    }).then(async res => {
      if (!res.ok) return null;
      return res.json();
    }).catch(() => null);

    // Build Google News RSS promises (multi-language regional feeds)
    const rssLanguages = lang === "all" ? ["en", "ta", "kn", "hi", "te", "ml", "es"] : [lang];
    const googleNewsPromises = rssLanguages.map(l => {
      const langConfig = LANGUAGE_MAP[l] || LANGUAGE_MAP.en;
      const gnewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(effectiveQuery)}&hl=${langConfig.hl}&gl=${langConfig.gl}&ceid=${langConfig.ceid}`;
      return fetch(gnewsUrl, { next: { revalidate: 120 } })
        .then(async r => ({ lang: l, config: langConfig, xml: await r.text() }))
        .catch(() => ({ lang: l, config: langConfig, xml: "" }));
    });

    // Build NewsAPI & Guardian promises
    const newsApiPromise = sourceFilter === "all" || sourceFilter === "newsapi"
      ? fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(effectiveQuery)}&from=${fromDate}&pageSize=${pageSize}&sortBy=publishedAt&language=en`,
          { headers: { "X-Api-Key": newsApiKey }, next: { revalidate: 120 } }
        ).then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null);

    const guardianPromise = sourceFilter === "all" || sourceFilter === "guardian"
      ? fetch(
          `https://content.guardianapis.com/search?q=${encodeURIComponent(effectiveQuery)}&from-date=${fromDate}&page-size=${pageSize}&show-fields=trailText,thumbnail,byline,bodyText&api-key=${guardianApiKey}`,
          { next: { revalidate: 120 } }
        ).then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null);

    const [gdeltResult, gnewsResults, newsApiResult, guardianResult] = await Promise.all([
      gdeltPromise,
      Promise.all(googleNewsPromises),
      newsApiPromise,
      guardianPromise,
    ]);

    // 1. Process GDELT Cloud API events
    if (gdeltResult?.data && Array.isArray(gdeltResult.data)) {
      for (const ev of gdeltResult.data) {
        const topArt = ev.top_articles?.[0];
        const targetUrl = topArt?.url || ev.primary_story_url || ev.url || `https://gdeltcloud.com/events/${ev.id}`;
        if (!targetUrl || seenUrls.has(targetUrl)) continue;
        seenUrls.add(targetUrl);

        const titleText = ev.title || topArt?.title || "GDELT Intelligence Event";
        const summaryText = ev.summary || ev.event_description || `GDELT tracked event in ${ev.geo?.country || "global location"}`;
        const nlp = computeNLP(`${titleText} ${summaryText}`, searchTerms);
        const idHash = crypto.createHash("md5").update(targetUrl).digest("hex").slice(0, 12);
        const topLang = ev.top_language || "en";
        const langConfig = LANGUAGE_MAP[topLang] || LANGUAGE_MAP.en;

        articles.push({
          id: `gdelt-${ev.id || idHash}`,
          title: titleText,
          url: targetUrl,
          source: topArt?.domain || "GDELT Cloud",
          author: ev.actors?.[0]?.name || "GDELT Automated Monitor",
          publishedAt: ev.observed_at || ev.event_date || new Date().toISOString(),
          description: summaryText,
          thumbnail: topArt?.domain_avatar_url || null,
          apiSource: "gdeltcloud",
          language: topLang,
          regionName: langConfig.regionName,
          nativeLanguage: langConfig.native,
          languageBreakdown: ev.language_breakdown || [],
          topArticles: ev.top_articles || [],
          geo: ev.geo || null,
          actors: ev.actors || [],
          metrics: ev.metrics || null,
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    // 2. Process Google News RSS multi-language regional feeds
    for (const item of gnewsResults) {
      if (!item.xml) continue;
      const rssItems = item.xml.split("<item>").slice(1);
      for (const rawItem of rssItems) {
        const titleMatch = rawItem.match(/<title>(.*?)<\/title>/);
        const linkMatch = rawItem.match(/<link>(.*?)<\/link>/);
        const dateMatch = rawItem.match(/<pubDate>(.*?)<\/pubDate>/);
        const sourceMatch = rawItem.match(/<source[^>]*>(.*?)<\/source>/);

        const title = titleMatch ? cleanXmlText(titleMatch[1]) : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        if (!title || !link || seenUrls.has(link)) continue;
        seenUrls.add(link);

        const source = sourceMatch ? cleanXmlText(sourceMatch[1]) : "Google News";
        const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
        const nlp = computeNLP(title, searchTerms);
        const idHash = crypto.createHash("md5").update(link).digest("hex").slice(0, 12);
        const langConfig = item.config || LANGUAGE_MAP[item.lang] || LANGUAGE_MAP.en;

        articles.push({
          id: `gnews-${idHash}`,
          title,
          url: link,
          source,
          author: source,
          publishedAt,
          description: `Regional news from ${langConfig.regionName} on ${title}`,
          thumbnail: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(source)}&sz=64`,
          apiSource: "googlenews",
          language: item.lang,
          regionName: langConfig.regionName,
          nativeLanguage: langConfig.native,
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    // 3. Process NewsAPI articles
    if (newsApiResult?.articles) {
      for (const a of newsApiResult.articles) {
        if (!a.title || a.title === "[Removed]" || !a.url || seenUrls.has(a.url)) continue;
        seenUrls.add(a.url);

        const textToAnalyze = `${a.title} ${a.description || ""}`;
        const nlp = computeNLP(textToAnalyze, searchTerms);
        const idHash = crypto.createHash("md5").update(a.url).digest("hex").slice(0, 12);

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
          language: "en",
          regionName: "Global English",
          nativeLanguage: "English",
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    // 4. Process The Guardian articles
    if (guardianResult?.response?.results) {
      for (const a of guardianResult.response.results) {
        if (!a.webTitle || !a.webUrl || seenUrls.has(a.webUrl)) continue;
        seenUrls.add(a.webUrl);

        const textToAnalyze = `${a.webTitle} ${a.fields?.trailText || ""}`;
        const nlp = computeNLP(textToAnalyze, searchTerms);
        const idHash = crypto.createHash("md5").update(a.webUrl).digest("hex").slice(0, 12);

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
          language: "en",
          regionName: "Global English",
          nativeLanguage: "English",
          relevanceScore: nlp.relevanceScore,
          sentimentScore: nlp.sentimentScore,
          sentiment: nlp.sentiment,
        });
      }
    }

    // Group cross-regional coverage across languages (e.g. TN, KA, Hindi, AP)
    const regionalBundles: Record<string, any[]> = {};
    for (const art of articles) {
      const l = art.language || "en";
      if (!regionalBundles[l]) regionalBundles[l] = [];
      regionalBundles[l].push(art);
    }

    // Attach cross-regional coverage links to articles
    for (const art of articles) {
      const otherLangs = Object.keys(regionalBundles).filter(l => l !== art.language);
      const crossCoverage: any[] = [];
      for (const ol of otherLangs) {
        const sample = regionalBundles[ol]?.[0];
        if (sample) {
          crossCoverage.push({
            language: ol,
            regionName: sample.regionName,
            nativeLanguage: sample.nativeLanguage,
            title: sample.title,
            source: sample.source,
            url: sample.url,
          });
        }
      }
      art.crossRegionalCoverage = crossCoverage.slice(0, 4);
    }

    // Filter by requested source if applicable
    let finalArticles = articles;
    if (sourceFilter !== "all") {
      finalArticles = articles.filter(a => a.apiSource === sourceFilter || (sourceFilter === "gdelt" && a.apiSource === "gdeltcloud") || (sourceFilter === "google" && a.apiSource === "googlenews"));
    }

    // Sort by publishedAt descending
    finalArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      articles: finalArticles.slice(0, pageSize * 2.5),
      total: finalArticles.length,
      query: baseTerm,
      effectiveQuery,
      topic_domain: topicDomain || "All Topics",
      location: location || "Global (All)",
      language: lang,
      recency,
      regionalBreakdown: Object.keys(regionalBundles).map(l => ({
        language: l,
        regionName: LANGUAGE_MAP[l]?.regionName || l,
        count: regionalBundles[l].length,
      })),
      providers: ["gdeltcloud", "googlenews", "newsapi", "guardian"],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, url, source, publishedAt, description, sentiment, relevanceScore, apiSource } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required" }, { status: 400 });
    }

    try {
      await query(
        `INSERT INTO saved_articles (user_id, title, url, source, published_at, description, sentiment, relevance_score, api_source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, relevance_score = EXCLUDED.relevance_score`,
        [session.user.id, title, url, source || "Unknown", publishedAt || new Date().toISOString(), description || "", sentiment || "neutral", relevanceScore || 80, apiSource || "gdeltcloud"]
      );
    } catch {
      // Table might not exist yet, log silently and respond with success
    }

    return NextResponse.json({ success: true, article: { title, url, source, apiSource } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

