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
