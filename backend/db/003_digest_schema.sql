-- ─── Migration 003: Daily Digest Infrastructure ─────────────────────────────
-- notification_preferences: stores each user's digest configuration
-- digest_logs: audit trail of every digest email sent

-- 1. notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id              SERIAL PRIMARY KEY,
    user_email      TEXT NOT NULL UNIQUE,
    topic_domain    TEXT NOT NULL DEFAULT 'General News',
    location        TEXT NOT NULL DEFAULT 'Global (All)',
    recency         TEXT NOT NULL DEFAULT 'Last 24 Hours',
    daily_digest    BOOLEAN NOT NULL DEFAULT FALSE,
    digest_time     TEXT NOT NULL DEFAULT '08:00',  -- HH:MM UTC, informational
    slack_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    teams_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
    alert_threshold TEXT NOT NULL DEFAULT 'HIGH',   -- CRITICAL | HIGH | MEDIUM
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_np_updated_at ON notification_preferences;
CREATE TRIGGER trg_np_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();


-- 2. digest_logs table
CREATE TABLE IF NOT EXISTS digest_logs (
    id              SERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    topic_domain    TEXT,
    stories_count   INT  NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending', -- sent | failed | error
    error           TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digest_logs_email   ON digest_logs (recipient_email);
CREATE INDEX IF NOT EXISTS idx_digest_logs_sent_at ON digest_logs (sent_at DESC);


-- 3. Seed a default row for any existing users that don't have preferences yet
--    (safe to run multiple times thanks to ON CONFLICT DO NOTHING)
INSERT INTO notification_preferences (user_email, topic_domain, location, daily_digest)
SELECT email, 'General News', 'Global (All)', FALSE
FROM users
WHERE email IS NOT NULL
  AND email <> ''
ON CONFLICT (user_email) DO NOTHING;
