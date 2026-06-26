-- Profiles table: stores engineer/admin profile info linked to Supabase Auth users.
-- Run in: Supabase Dashboard → SQL Editor → Run

CREATE TABLE IF NOT EXISTS profiles (
  username         TEXT        PRIMARY KEY,
  auth_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name       TEXT        NOT NULL DEFAULT '',
  last_name        TEXT        NOT NULL DEFAULT '',
  email            TEXT        NOT NULL DEFAULT '',
  title            TEXT,
  manager          TEXT,
  start_date       DATE,
  level            TEXT        CHECK (level IN ('SENIOR_IC', 'PRINCIPAL_IC')),
  jira_account_id  TEXT,
  is_admin         BOOLEAN     NOT NULL DEFAULT false,
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS profiles_auth_user_id_idx ON profiles (auth_user_id);
CREATE INDEX IF NOT EXISTS profiles_active_idx ON profiles (active);

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
