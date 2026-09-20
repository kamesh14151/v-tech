import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query(
      "SELECT * FROM profiles WHERE user_id = $1 LIMIT 1",
      [session.user.id]
    );
    return NextResponse.json({ profile: rows[0] || null });
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
  const {
    company_name, ticker, industry, website, description,
    executives, products, aliases, competitors, keywords
  } = body;

  try {
    const rows = await query(
      `INSERT INTO profiles (user_id, company_name, ticker, industry, website, description, executives, products, aliases, competitors, keywords, is_setup_complete, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, true, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         ticker = EXCLUDED.ticker,
         industry = EXCLUDED.industry,
         website = EXCLUDED.website,
         description = EXCLUDED.description,
         executives = EXCLUDED.executives,
         products = EXCLUDED.products,
         aliases = EXCLUDED.aliases,
         competitors = EXCLUDED.competitors,
         keywords = EXCLUDED.keywords,
         is_setup_complete = true,
         updated_at = NOW()
       RETURNING *`,
      [
        session.user.id, company_name, ticker, industry, website, description,
        JSON.stringify(executives || []),
        JSON.stringify(products || []),
        JSON.stringify(aliases || []),
        JSON.stringify(competitors || []),
        JSON.stringify(keywords || []),
      ]
    );
    return NextResponse.json({ profile: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
