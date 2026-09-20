import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendFetch } from "@/lib/backend-fetch";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();

  try {
    const res = await backendFetch(`/v1/alerts${qs ? `?${qs}` : ""}`, {
      headers: {
        ...(process.env.AGENT_SERVICE_TOKEN ? { Authorization: `Bearer ${process.env.AGENT_SERVICE_TOKEN}` } : {}),
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Agent backend unavailable" }, { status: 503 });
  }
}
