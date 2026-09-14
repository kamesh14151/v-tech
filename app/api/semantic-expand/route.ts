import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

interface SynonymMatch {
  title: string;
  source: string;
  url: string;
  synonymMatched: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entity } = await req.json();
  if (!entity?.trim()) {
    return NextResponse.json({ error: "Entity is required" }, { status: 400 });
  }

  const query = entity.trim();
  let expandedContexts: string[] = [];

  // Step 1: Generate real contextual synonyms & aliases using Gemini or heuristic expansion
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Given the entity or topic "${query}", identify 4 contextual synonyms, industry descriptions, parent entities, or descriptive phrases that journalists use to refer to it without using the exact name "${query}".
For example, if entity is "PayU", synonyms could be: "Prosus payments firm", "digital merchant payment aggregator", "fintech unicorn", "BNPL provider".
If entity is "Apple", synonyms could be: "Cupertino tech giant", "iPhone maker", "M-series silicon designer", "iOS developer ecosystem".

Respond with ONLY a JSON array of 4 strings, e.g. ["synonym 1", "synonym 2", "synonym 3", "synonym 4"]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const text = response.text?.trim() || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        expandedContexts = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Gemini synonym expansion error:", e);
    }
  }

  if (expandedContexts.length === 0) {
    expandedContexts = [
      `${query} industry category leader`,
      `Key enterprise ecosystem in ${query}`,
      `Market innovation across ${query} sector`,
      `Venture-backed developments in ${query}`
    ];
  }

  // Step 2: Fetch real articles for the top synonyms
  const matchedArticles: SynonymMatch[] = [];
  const primarySynonym = expandedContexts[0];
  const secondarySynonym = expandedContexts[1];

  const lexicalSimilarity = (query: string, title: string): number => {
    const q = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const t = new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    if (!q.size || !t.size) return 0;
    const overlap = [...q].filter(word => t.has(word)).length;
    return Math.round((overlap / q.size) * 100);
  };

  try {
    const [res1, res2] = await Promise.allSettled([
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(primarySynonym)}&pageSize=5&sortBy=publishedAt&language=en`,
        { headers: { "X-Api-Key": process.env.NEWSAPI_KEY! } }
      ),
      fetch(
        `https://content.guardianapis.com/search?q=${encodeURIComponent(secondarySynonym)}&page-size=5&api-key=${process.env.GUARDIAN_API_KEY}`
      ),
    ]);

    if (res1.status === "fulfilled" && res1.value.ok) {
      const data = await res1.value.json();
      for (const a of (data.articles || []).slice(0, 3)) {
        if (a.title && a.title !== "[Removed]") {
          matchedArticles.push({
            title: a.title,
            source: a.source?.name || "NewsAPI",
            url: a.url,
            synonymMatched: primarySynonym,
            similarity: lexicalSimilarity(primarySynonym, a.title),
          });
        }
      }
    }

    if (res2.status === "fulfilled" && res2.value.ok) {
      const data = await res2.value.json();
      for (const a of (data.response?.results || []).slice(0, 3)) {
        if (a.webTitle) {
          matchedArticles.push({
            title: a.webTitle,
            source: "The Guardian",
            url: a.webUrl,
            synonymMatched: secondarySynonym,
            similarity: lexicalSimilarity(secondarySynonym, a.webTitle),
          });
        }
      }
    }
  } catch (e) {
    console.error("Fetch synonym articles error:", e);
  }

  return NextResponse.json({
    targetEntity: query,
    expandedContexts,
    matchedArticles,
  });
}
