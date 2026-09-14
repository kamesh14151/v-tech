-- ============================================================
-- Production schema migration 002.
-- Adds: story_articles join table, notifications tracking,
--        domains (monitoring configs), extended agent_run_logs.
-- Safe to re-run (IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- ─── Story-Articles join table (proper relational, replaces JSONB array) ────
CREATE TABLE IF NOT EXISTS story_articles (
    story_id TEXT NOT NULL,
    article_id TEXT NOT NULL,
    PRIMARY KEY (story_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_story_articles_article_id ON story_articles(article_id);

-- ─── Notifications delivery tracking ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    alert_id TEXT REFERENCES alerts(alert_id) ON DELETE CASCADE,
    channel TEXT NOT NULL,        -- 'slack' | 'email' | 'teams' | 'webhook'
    recipient TEXT,               -- email address, webhook URL, or channel name
    status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ─── Domains (monitoring configurations per user) ────────────────────────────
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords JSONB DEFAULT '[]',
    geography TEXT DEFAULT 'Global',
    exclusions JSONB DEFAULT '[]',
    sources_whitelist JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    schedule_cron VARCHAR(100),     -- e.g. "0 */6 * * *"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_active ON domains(is_active) WHERE is_active = TRUE;

-- ─── Extend agent_run_logs with production columns ──────────────────────────
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS story_id TEXT;
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS input_payload JSONB;
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS output_payload JSONB;
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ok';
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS items_in INTEGER DEFAULT 0;
ALTER TABLE agent_run_logs ADD COLUMN IF NOT EXISTS items_out INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_agent_run_logs_story_id ON agent_run_logs(story_id);

-- ─── Extend stories table for richer metadata ────────────────────────────────
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topic_tags JSONB DEFAULT '[]';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS sentiment VARCHAR(10) DEFAULT 'neutral';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_reliability FLOAT DEFAULT 0.7;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS weighted_score FLOAT DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS final_score FLOAT DEFAULT 0;

-- ─── ARQ background job tracking ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS background_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT UNIQUE NOT NULL,
    job_type TEXT NOT NULL,       -- 'analysis' | 'scrape' | 'notify'
    query TEXT,
    status TEXT DEFAULT 'queued', -- 'queued' | 'running' | 'completed' | 'failed'
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_created_at ON background_jobs(created_at DESC);
