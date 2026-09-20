import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.AGENT_BACKEND_URL || "http://localhost:8000";
  const userEmail = session.user.email || "";

  try {
    const res = await fetch(`${backendUrl}/v1/digest-preferences/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errText = await res.text().catch(() => "");
    return NextResponse.json({ error: errText || "Failed to dispatch test digest email" }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Backend connection error" }, { status: 502 });
  }
}
