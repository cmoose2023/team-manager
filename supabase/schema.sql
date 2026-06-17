-- Engineering Assessment schema for Supabase (Postgres)
-- Run this in: Supabase Dashboard → SQL Editor → Run

-- ── Assessments table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  engineer_id    TEXT        NOT NULL,
  period         TEXT        NOT NULL,
  assessor_type  TEXT        NOT NULL CHECK (assessor_type IN ('admin', 'self')),
  engineer_name  TEXT        NOT NULL,
  engineer_level TEXT        NOT NULL CHECK (engineer_level IN ('SENIOR_IC', 'PRINCIPAL_IC')),
  assessor_id    TEXT        NOT NULL,
  ratings        JSONB       NOT NULL DEFAULT '{}',
  overall_note   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (engineer_id, period, assessor_type)
);

-- ── Auto-update updated_at on every row update ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessments_updated_at ON assessments;
CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Index for period-based queries (admin dashboard) ─────────────────────────
CREATE INDEX IF NOT EXISTS assessments_period_idx ON assessments (period, assessor_type);

-- ── Row-Level Security (disabled — API routes use service-role key) ───────────
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Group Testing Scheduler
-- Run this section in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS test_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  scheduled_date DATE        NOT NULL,
  ticket_ref     TEXT,
  goal           TEXT,
  notes          TEXT,
  signed_off     BOOLEAN     NOT NULL DEFAULT false,
  created_by     TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_session_attendees (
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  PRIMARY KEY (session_id, username)
);

CREATE TABLE IF NOT EXISTS test_cases (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID    NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  category   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_permutations (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID    NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL,
  channel    TEXT    NOT NULL,
  browser    TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_results (
  test_case_id   UUID        NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  permutation_id UUID        NOT NULL REFERENCES test_permutations(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'pass', 'fail', 'skip')),
  notes          TEXT,
  updated_by     TEXT        NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (test_case_id, permutation_id)
);

DROP TRIGGER IF EXISTS test_sessions_updated_at ON test_sessions;
CREATE TRIGGER test_sessions_updated_at
  BEFORE UPDATE ON test_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS test_sessions_created_by_idx ON test_sessions (created_by);
CREATE INDEX IF NOT EXISTS test_cases_session_idx       ON test_cases (session_id, sort_order);
CREATE INDEX IF NOT EXISTS test_permutations_session_idx ON test_permutations (session_id, sort_order);

ALTER TABLE test_sessions         DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_session_attendees DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases            DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_permutations     DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_results          DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FE Huddle Knowledge Share tables
-- ============================================================================

-- Pre-populated backlog topics with categories
CREATE TABLE IF NOT EXISTS knowledge_share_backlog (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category       TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL,
  claimed_by     UUID                    REFERENCES auth.users(id),
  claimed_by_name TEXT,                 -- display name for easy reference
  claimed_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly rotation schedule (8 weeks)
CREATE TABLE IF NOT EXISTS knowledge_share_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  week           INTEGER     NOT NULL CHECK (week >= 1 AND week <= 8),
  scheduled_date DATE,
  presenter_id   UUID                   REFERENCES auth.users(id),
  presenter_name TEXT,                   -- display name for easy reference
  backlog_id     UUID                   REFERENCES knowledge_share_backlog(id),
  topic_title    TEXT,
  status         TEXT        NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('planned', 'confirmed', 'done')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS knowledge_share_sessions_updated_at ON knowledge_share_sessions;
CREATE TRIGGER knowledge_share_sessions_updated_at
  BEFORE UPDATE ON knowledge_share_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS knowledge_share_backlog_category_idx ON knowledge_share_backlog (category);
CREATE INDEX IF NOT EXISTS knowledge_share_sessions_week_idx ON knowledge_share_sessions (week);
CREATE INDEX IF NOT EXISTS knowledge_share_backlog_claimed_idx ON knowledge_share_backlog (claimed_by);

ALTER TABLE knowledge_share_backlog   DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_share_sessions  DISABLE ROW LEVEL SECURITY;
