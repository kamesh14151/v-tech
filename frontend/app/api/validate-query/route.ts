import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

export interface QueryValidationResult {
  originalQuery: string;
  correctedQuery: string;
  wasCorrection: boolean;
  confidence: number; // 0-100
  explanation: string;
  suggestedLanguages?: string[]; // e.g. ["Tamil", "Hindi", "English"]
}

/**
 * POST /api/validate-query
 * Body: { query: string, topicDomain?: string }
 *
 * Calls Gemini (or falls back to heuristic) to:
 *  1. Detect & fix typos  (e.g. "MTUAL FUNDS" → "Mutual Funds")
 *  2. Normalise casing / abbrevs
 *  3. Suggest relevant languages for multilingual news discovery
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: string; topicDomain?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawQuery = (body.query || body.topicDomain || "").trim();
  if (!rawQuery) {
    return NextResponse.json(
      {
        originalQuery: "",
        correctedQuery: "",
        wasCorrection: false,
        confidence: 100,
        explanation: "Empty query — nothing to validate.",
      } as QueryValidationResult,
      { status: 200 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are Optimus AI Query Validator — an enterprise media intelligence pre-processor.

Your job:
1. Detect and fix any typos, abbreviations, or noise in the user's search query.
2. Return the corrected, properly-cased query suitable for news API searches.
3. Suggest up to 3 relevant languages in which news about this topic is commonly published (e.g. English, Tamil, Hindi, Kannada, Telugu, Marathi, Bengali, Malayalam).

USER INPUT QUERY: "${rawQuery}"

Rules:
- "MTUAL FUNDS" → "Mutual Funds"
- "fintceh" → "Fintech"
- Keep the original if there are no errors (wasCorrection = false)
- correctedQuery must always be non-empty
- confidence is how sure you are about your correction (0-100)

Respond with ONLY valid JSON:
{
  "correctedQuery": "<corrected query string>",
  "wasCorrection": true,
  "confidence": 90,
  "explanation": "One sentence explanation",
  "suggestedLanguages": ["English", "Tamil", "Hindi"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const raw = (response.text || "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const corrected = (parsed.correctedQuery || rawQuery).trim();
        return NextResponse.json({
          originalQuery: rawQuery,
          correctedQuery: corrected,
          wasCorrection:
            parsed.wasCorrection === true ||
            corrected.toLowerCase() !== rawQuery.toLowerCase(),
          confidence: parsed.confidence ?? 90,
          explanation:
            parsed.explanation || "Query processed by Optimus AI Validator.",
          suggestedLanguages: parsed.suggestedLanguages || ["English"],
        } as QueryValidationResult);
      }
    } catch (e) {
      console.warn(
        "Gemini validate-query error (falling back to heuristic):",
        e
      );
    }
  }

  // ── Heuristic Fallback (no Gemini key) ────────────────────────────────────
  const corrected = heuristicCorrect(rawQuery);
  const wasCorrection = corrected.toLowerCase() !== rawQuery.toLowerCase();
  const suggestedLanguages = inferLanguages(corrected);

  return NextResponse.json({
    originalQuery: rawQuery,
    correctedQuery: corrected,
    wasCorrection,
    confidence: wasCorrection ? 85 : 98,
    explanation: wasCorrection
      ? `Auto-corrected "${rawQuery}" to "${corrected}" based on known terminology.`
      : `Query "${rawQuery}" looks valid — no correction needed.`,
    suggestedLanguages,
  } as QueryValidationResult);
}

// ── Heuristic Spell-Correction Dictionary ────────────────────────────────────
const CORRECTIONS: Record<string, string> = {
  // Financial
  "mtual funds": "Mutual Funds",
  "mutal funds": "Mutual Funds",
  "mutaul funds": "Mutual Funds",
  "mututal funds": "Mutual Funds",
  "fintceh": "Fintech",
  "finteh": "Fintech",
  "finteck": "Fintech",
  "bankin": "Banking",
  "bankng": "Banking",
  "insuarance": "Insurance",
  "insurence": "Insurance",
  "crpyto": "Crypto",
  "crypo": "Crypto",
  "bitconi": "Bitcoin",
  "blockhcain": "Blockchain",
  "stockmarket": "Stock Market",
  "sip investemnt": "SIP Investment",
  "sebi regualtion": "SEBI Regulation",
  // Entertainment
  "coliwood": "Kollywood",
  "kolywood": "Kollywood",
  "bollywod": "Bollywood",
  "bollwywood": "Bollywood",
  // Tech
  "artficial intelligence": "Artificial Intelligence",
  "artificail intelligence": "Artificial Intelligence",
  // Govt
  "goverment": "Government",
  "govement": "Government",
};

function heuristicCorrect(q: string): string {
  const lower = q.toLowerCase();
  for (const [pattern, fix] of Object.entries(CORRECTIONS)) {
    if (lower.includes(pattern)) {
      return q.replace(new RegExp(pattern, "gi"), fix);
    }
  }
  // Capitalise each word as mild normalisation
  return q
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function inferLanguages(query: string): string[] {
  const q = query.toLowerCase();
  if (
    q.includes("tamil") ||
    q.includes("kollywood") ||
    q.includes("tamilnadu") ||
    q.includes("tn")
  ) {
    return ["Tamil", "English"];
  }
  if (q.includes("kannada") || q.includes("karnataka")) {
    return ["Kannada", "English"];
  }
  if (
    q.includes("telugu") ||
    q.includes("tollywood") ||
    q.includes("andhra") ||
    q.includes("telangana")
  ) {
    return ["Telugu", "English"];
  }
  if (
    q.includes("hindi") ||
    q.includes("bollywood") ||
    q.includes("delhi") ||
    q.includes("mumbai")
  ) {
    return ["Hindi", "English"];
  }
  if (q.includes("malayalam") || q.includes("kerala")) {
    return ["Malayalam", "English"];
  }
  if (
    q.includes("bengali") ||
    q.includes("kolkata") ||
    q.includes("bengal")
  ) {
    return ["Bengali", "English"];
  }
  if (
    q.includes("marathi") ||
    q.includes("pune") ||
    q.includes("maharashtra")
  ) {
    return ["Marathi", "English"];
  }
  // Default: pan-India financial topics
  return ["English", "Hindi", "Tamil"];
}
