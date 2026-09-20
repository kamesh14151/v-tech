import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendFetch } from "@/lib/backend-fetch";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const query = String(body.query || body.topic_domain || "").trim();
  if (!query) return NextResponse.json({ error: "Topic/query is required" }, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    const response = await backendFetch("/v1/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": String(session.user.id || ""),
        ...(process.env.AGENT_SERVICE_TOKEN ? { Authorization: `Bearer ${process.env.AGENT_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        query,
        topic_domain: body.topic_domain || query,
        location: body.location || "Global (All)",
        recency: body.recency || "Last 24 Hours",
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });

    // Preserve the exact response contract expected by the existing dashboard.
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Analysis timed out. Please retry."
      : "Agent backend is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
