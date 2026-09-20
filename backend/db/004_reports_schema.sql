-- ─── Migration 004: Saved Reports & History ─────────────────────────────
CREATE TABLE IF NOT EXISTS saved_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_email VARCHAR(255),
    query VARCHAR(300),
    topic_domain VARCHAR(150),
    location VARCHAR(100),
    recency VARCHAR(50),
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_email ON saved_reports(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created ON saved_reports(created_at DESC);
