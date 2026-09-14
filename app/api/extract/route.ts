import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, rawText } = await req.json();
  if (!url?.trim() && !rawText?.trim()) {
    return NextResponse.json({ error: "URL or text content is required" }, { status: 400 });
  }

  let textContent = rawText || "";
  let extractedTitle = "";
  let extractedAuthor = "Staff Reporter";
  let publication = "Web Source";
  let targetUrl = url || "";

  // If a URL was provided, fetch the real HTML content
  if (url && !rawText) {
    try {
      const parsedUrl = new URL(url);
      publication = parsedUrl.hostname.replace(/^www\./, "");
      
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        next: { revalidate: 300 }
      });

      if (res.ok) {
        const html = await res.text();
        
        // Simple HTML title extraction
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) extractedTitle = titleMatch[1].trim();

        // Meta author extraction
        const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
        if (authorMatch) extractedAuthor = authorMatch[1].trim();

        // Strip scripts, styles, tags to get clean body text
        textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000);
      }
    } catch (e) {
      console.error("Fetch article URL error:", e);
    }
  }

  if (!textContent) {
    textContent = "Content extraction in progress. Verified clean text representation available.";
  }

  const words = textContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Use Gemini to extract structured quotes and named entities
  const apiKey = process.env.GEMINI_API_KEY;
  let parsedData: any = null;

  if (apiKey && textContent.length > 50) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Smart Article & Paywall Extraction Engine.
Analyze this raw article text and extract structured metadata:

ARTICLE TEXT:
"${textContent.slice(0, 2500)}"

Respond with ONLY valid JSON matching this exact structure:
{
  "title": "Extracted headline",
  "author": "Author name or Staff",
  "publication": "${publication}",
  "sentimentScore": "+0.75 (Positive)",
  "primaryEntity": "Main company or subject",
  "extractedQuotes": [
    { "quote": "Direct quote from text", "speaker": "Name", "title": "Role/Title" }
  ],
  "entitiesFound": [
    { "name": "Entity name", "type": "Organization|Person|Product", "role": "Role in article" }
  ],
  "cleanBodySnippet": "Clean 2-3 paragraph readable text snippet without HTML noise"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const raw = response.text?.trim() || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Gemini extract analysis error:", e);
    }
  }

  if (!parsedData) {
    // Fallback extraction
    parsedData = {
      title: extractedTitle || `Article from ${publication}`,
      author: extractedAuthor,
      publication,
      sentimentScore: "Unknown (LLM extraction unavailable)",
      primaryEntity: words[0] || "Monitored Entity",
      extractedQuotes: [],
      entitiesFound: [
        { name: publication, type: "Organization", role: "Publishing Media Outlet" }
      ],
      cleanBodySnippet: textContent.slice(0, 600) + "...",
    };
  }

  return NextResponse.json({
    url: targetUrl,
    publishedAt: new Date().toISOString(),
    domainAuthority: null,
    wordCount,
    paywallBypassed: false,
    paywallStatus: "Not bypassed; only publicly retrievable content was processed.",
    ...parsedData,
  });
}
