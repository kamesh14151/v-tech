import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rules = await query(
      "SELECT * FROM rules WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );
    return NextResponse.json({ rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, condition_json, action_json } = body;

  try {
    const rows = await query(
      `INSERT INTO rules (user_id, name, description, condition_json, action_json)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb) RETURNING *`,
      [session.user.id, name, description, JSON.stringify(condition_json), JSON.stringify(action_json)]
    );
    return NextResponse.json({ rule: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, is_active } = body;

  try {
    const rows = await query(
      "UPDATE rules SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [is_active, id, session.user.id]
    );
    return NextResponse.json({ rule: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  try {
    await query("DELETE FROM rules WHERE id = $1 AND user_id = $2", [id, session.user.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
