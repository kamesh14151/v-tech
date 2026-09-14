import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendFetch } from "@/lib/backend-fetch";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await backendFetch("/health/ready", { cache: "no-store" });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
