import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query } from "@/lib/db";

// Ensure preferences table exists and has all required columns
async function ensurePreferencesTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        topic_domain VARCHAR(150),
        location VARCHAR(100) DEFAULT 'Within Tamil Nadu (TN)',
        recency VARCHAR(50) DEFAULT 'Last 24 Hours',
        target_email VARCHAR(255),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS topic_domain VARCHAR(150);
      ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Within Tamil Nadu (TN)';
      ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS recency VARCHAR(50) DEFAULT 'Last 24 Hours';
      ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS target_email VARCHAR(255);
    `);
  } catch (err) {
    console.error("ensurePreferencesTable notice:", err);
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id && !isNaN(Number(session.user.id)) ? Number(session.user.id) : null;
  const sessionEmail = session.user.email || "";

  try {
    await ensurePreferencesTable();
    
    if (userId) {
      const rows = await query(
        "SELECT topic_domain, location, recency, target_email FROM user_preferences WHERE user_id = $1 LIMIT 1",
        [userId]
      );

      if (rows && rows[0]) {
        return NextResponse.json({
          preferences: {
            topic_domain: rows[0].topic_domain || "",
            location: rows[0].location || "Within Tamil Nadu (TN)",
            recency: rows[0].recency || "Last 24 Hours",
            target_email: rows[0].target_email || sessionEmail,
          },
        });
      }
    }

    return NextResponse.json({
      preferences: {
        topic_domain: "",
        location: "Within Tamil Nadu (TN)",
        recency: "Last 24 Hours",
        target_email: sessionEmail,
      },
    });
  } catch (error: any) {
    console.error("GET preferences error:", error);
    return NextResponse.json({
      preferences: {
        topic_domain: "",
        location: "Within Tamil Nadu (TN)",
        recency: "Last 24 Hours",
        target_email: sessionEmail,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { topic_domain, location, recency, target_email } = body;

  const resolvedDomain = topic_domain || "";
  const resolvedLocation = location || "Within Tamil Nadu (TN)";
  const resolvedRecency = recency || "Last 24 Hours";
  const resolvedEmail = target_email || session.user.email || "";

  const userId = session.user.id && !isNaN(Number(session.user.id)) ? Number(session.user.id) : null;

  try {
    await ensurePreferencesTable();

    if (userId) {
      await query(
        `INSERT INTO user_preferences (user_id, topic_domain, location, recency, target_email, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           topic_domain = EXCLUDED.topic_domain,
           location = EXCLUDED.location,
           recency = EXCLUDED.recency,
           target_email = EXCLUDED.target_email,
           updated_at = NOW()`,
        [userId, resolvedDomain, resolvedLocation, resolvedRecency, resolvedEmail]
      );
    }

    return NextResponse.json({
      success: true,
      preferences: {
        topic_domain: resolvedDomain,
        location: resolvedLocation,
        recency: resolvedRecency,
        target_email: resolvedEmail,
      },
    });
  } catch (error: any) {
    console.error("POST preferences error:", error);
    return NextResponse.json({
      success: true,
      preferences: {
        topic_domain: resolvedDomain,
        location: resolvedLocation,
        recency: resolvedRecency,
        target_email: resolvedEmail,
      },
    });
  }
}
