-- ============================================================
-- Shared V-Tech + LangGraph database initialization.
-- PostgreSQL/pgvector is shared by Next.js and FastAPI.
-- All DDL uses IF NOT EXISTS for safe re-runs on existing volumes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── NextAuth required tables ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- ─── Optimus Platform core tables ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  ticker VARCHAR(20),
  industry VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  executives JSONB DEFAULT '[]',
  products JSONB DEFAULT '[]',
  aliases JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  keywords JSONB DEFAULT '[]',
  is_setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source VARCHAR(255),
  author VARCHAR(255),
  published_at TIMESTAMPTZ,
  description TEXT,
  full_content TEXT,
  sentiment VARCHAR(20),
  sentiment_score FLOAT,
  relevance_score INTEGER DEFAULT 0,
  is_indirect BOOLEAN DEFAULT FALSE,
  entities JSONB DEFAULT '[]',
  api_source VARCHAR(50),
  saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  condition_json JSONB NOT NULL,
  action_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  triggered_count INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  summary TEXT,
  top_alerts JSONB DEFAULT '[]',
  competitor_insights JSONB DEFAULT '[]',
  article_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Article Embeddings (pgvector HNSW) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS article_embeddings (
  article_id TEXT PRIMARY KEY,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for approximate nearest-neighbor cosine search
CREATE INDEX IF NOT EXISTS idx_article_embeddings_hnsw
  ON article_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── Story Clusters ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  story_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  narrative TEXT,
  priority VARCHAR(10) DEFAULT 'MEDIUM',   -- CRITICAL|HIGH|MEDIUM|LOW
  importance_score FLOAT DEFAULT 0,
  sources JSONB DEFAULT '[]',
  article_ids JSONB DEFAULT '[]',
  first_published_at TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_priority ON stories(priority);
CREATE INDEX IF NOT EXISTS idx_stories_importance ON stories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- ─── AI Analysis (per story) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_analysis (
  story_id TEXT PRIMARY KEY REFERENCES stories(story_id) ON DELETE CASCADE,
  topic_tags JSONB DEFAULT '[]',
  entities JSONB DEFAULT '{}',
  impact_signals JSONB DEFAULT '[]',
  sentiment VARCHAR(10) DEFAULT 'neutral',
  confidence FLOAT DEFAULT 0.7,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Priority Scores (rule engine output) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS priority_scores (
  story_id TEXT PRIMARY KEY REFERENCES stories(story_id) ON DELETE CASCADE,
  business_impact FLOAT DEFAULT 0,
  urgency FLOAT DEFAULT 0,
  market_impact FLOAT DEFAULT 0,
  novelty FLOAT DEFAULT 0,
  confidence FLOAT DEFAULT 0,
  weighted_score FLOAT DEFAULT 0,
  final_score FLOAT DEFAULT 0,
  priority_label VARCHAR(10) DEFAULT 'MEDIUM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Source Reliability Registry ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS source_reliability (
  source_name TEXT PRIMARY KEY,
  reliability_score FLOAT NOT NULL DEFAULT 0.7,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with initial values (idempotent)
INSERT INTO source_reliability (source_name, reliability_score, notes) VALUES
  ('Reuters', 0.95, 'Tier 1 — wire service'),
  ('AP News', 0.95, 'Tier 1 — wire service'),
  ('Bloomberg', 0.93, 'Tier 1 — finance'),
  ('The Guardian', 0.92, 'Tier 1 — quality journalism'),
  ('BBC News', 0.92, 'Tier 1 — public broadcaster'),
  ('The New York Times', 0.92, 'Tier 1'),
  ('TechCrunch', 0.87, 'Tier 2 — tech publication'),
  ('The Verge', 0.86, 'Tier 2 — tech publication'),
  ('Wired', 0.86, 'Tier 2 — tech publication'),
  ('Forbes', 0.83, 'Tier 2 — business'),
  ('CNBC', 0.84, 'Tier 2 — finance'),
  ('The Hindu', 0.84, 'Tier 2 — India national'),
  ('Economic Times', 0.83, 'Tier 2 — India business'),
  ('NDTV', 0.82, 'Tier 2 — India national'),
  ('Hacker News', 0.72, 'Tier 3 — community aggregator'),
  ('Medium', 0.65, 'Tier 3 — user content')
ON CONFLICT (source_name) DO NOTHING;

-- ─── Agent Run Logs (observability) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_run_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  latency_ms FLOAT DEFAULT 0,
  cost_usd FLOAT DEFAULT 0,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_run_logs_run_id ON agent_run_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_logs_created_at ON agent_run_logs(created_at DESC);

-- ─── Master Agent Runs (legacy + extended) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_runs (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID,
  query TEXT NOT NULL,
  status TEXT NOT NULL,
  trace JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_request_id ON agent_runs(request_id);

-- ─── Alerts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  alert_id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES stories(story_id) ON DELETE CASCADE,
  priority VARCHAR(10) NOT NULL,   -- CRITICAL|HIGH
  title TEXT NOT NULL,
  reason TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'dashboard'
);

CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at DESC);

-- ─── Core indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_user_id ON briefings(user_id);
