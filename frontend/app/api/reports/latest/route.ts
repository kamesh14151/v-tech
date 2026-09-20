import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userEmail = session.user.email || "";

  try {
    const response = await backendFetch(`/v1/reports/latest?user_email=${encodeURIComponent(userEmail)}`, {
      method: "GET",
      headers: {
        ...(process.env.AGENT_SERVICE_TOKEN ? { Authorization: `Bearer ${process.env.AGENT_SERVICE_TOKEN}` } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({});
      }
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(errData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}
