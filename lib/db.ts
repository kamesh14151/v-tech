import { Pool } from "pg";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const useSsl = process.env.NODE_ENV === "production" && !connectionString?.includes("localhost") && !connectionString?.includes("postgres:");

const pool = new Pool({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  connectionTimeoutMillis: 2000,
});

export { pool };

const DEV_FILE = path.join(process.cwd(), ".dev_db_store.json");

function loadDevStore() {
  try {
    if (fs.existsSync(DEV_FILE)) {
      return JSON.parse(fs.readFileSync(DEV_FILE, "utf-8"));
    }
  } catch (e) {}
  return { users: [], profiles: [], rules: [], articles: [], briefings: [] };
}

function saveDevStore(store: any) {
  try {
    fs.writeFileSync(DEV_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {}
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  } catch (err: any) {
    // If PostgreSQL is unreachable, use local dev store fallback
    return handleDevFallback<T>(text, params);
  }
}

function handleDevFallback<T>(text: string, params: any[]): T[] {
  const store = loadDevStore();
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();

  // 1. SELECT FROM users
  if (normalized.includes("from users")) {
    if (normalized.includes("email =") || normalized.includes("lower(email) =")) {
      const email = String(params[0] || "").toLowerCase();
      const user = store.users.find((u: any) => u.email.toLowerCase() === email);
      return user ? ([user] as T[]) : [];
    }
    return store.users as T[];
  }

  // 2. INSERT INTO users
  if (normalized.includes("insert into users")) {
    const [name, email, password_hash] = params;
    const existing = store.users.find((u: any) => u.email.toLowerCase() === String(email).toLowerCase());
    if (existing) {
      if (password_hash) existing.password_hash = password_hash;
      if (name) existing.name = name;
      saveDevStore(store);
      return [{ id: existing.id, name: existing.name, email: existing.email }] as T[];
    }
    const newId = store.users.length + 1;
    const newUser = {
      id: newId,
      name: name || String(email).split("@")[0],
      email: email,
      password_hash: password_hash || null,
      emailVerified: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    store.users.push(newUser);
    saveDevStore(store);
    return [{ id: newUser.id, name: newUser.name, email: newUser.email }] as T[];
  }

  // 3. Profiles
  if (normalized.includes("from profiles")) {
    const userId = params[0];
    const profile = store.profiles.find((p: any) => String(p.user_id) === String(userId));
    return profile ? ([profile] as T[]) : [];
  }

  if (normalized.includes("insert into profiles") || normalized.includes("update profiles")) {
    const userId = params[0];
    let profile = store.profiles.find((p: any) => String(p.user_id) === String(userId));
    if (!profile) {
      profile = { id: store.profiles.length + 1, user_id: userId, is_setup_complete: true };
      store.profiles.push(profile);
    }
    Object.assign(profile, { updated_at: new Date().toISOString() });
    saveDevStore(store);
    return [profile] as T[];
  }

  // 4. Rules & Articles
  if (normalized.includes("from rules")) {
    return store.rules as T[];
  }

  if (normalized.includes("from articles")) {
    return store.articles as T[];
  }

  return [] as T[];
}
