/**
 * Provisions Supabase Auth users for the engineering assessment app.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/setup-supabase-users.mjs
 *
 * Each user gets a temporary password. On first login the user should change it
 * via Supabase Auth (no in-app forced-reset flow — use the Supabase dashboard
 * or email a reset link).
 *
 * user_metadata.username  → matches the engineer ID in src/lib/engineers.ts
 * user_metadata.isAdmin   → true for the admin account
 * user_metadata.name      → display name
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEMP_PASSWORD = 'TempPass123!';

const USERS = [
  // ── Admin ───────────────────────────────────────────────────────────────────
  {
    email: 'crissmoosman1@gmail.com',
    metadata: { username: 'admin', name: 'Criss Moosman', isAdmin: true },
    profile: { level: null, jiraAccountId: null },
  },
  // ── Engineers ───────────────────────────────────────────────────────────────
  {
    email: 'ssnyder@invaluable.com',
    metadata: { username: 'steven.snyder', name: 'Steven Snyder', isAdmin: false },
    profile: { level: 'PRINCIPAL_IC', jiraAccountId: '5fa1dbd1b45b2e007481fa68' },
  },
  {
    email: 'jballo@invaluable.com',
    metadata: { username: 'julia.ballo', name: 'Julia Ballo', isAdmin: false },
    profile: { level: 'SENIOR_IC', jiraAccountId: '712020:22be27ff-b9b2-4a7a-912d-0c1a7efbe0bf' },
  },
  {
    email: 'aszigethy@invaluable.com',
    metadata: { username: 'agnes.szigethy', name: 'Agnes Szigethy', isAdmin: false },
    profile: { level: 'SENIOR_IC', jiraAccountId: '712020:7409260c-a008-45cb-ae2b-0575beaac53e' },
  },
  {
    email: 'mmurphy@invaluable.com',
    metadata: { username: 'michael.murphy', name: 'Michael Murphy', isAdmin: false },
    profile: { level: 'PRINCIPAL_IC', jiraAccountId: '' },
  },
  {
    email: 'jriley@invaluable.com',
    metadata: { username: 'justin.riley', name: 'Justin Riley', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
  {
    email: 'dzendzian@invaluable.com',
    metadata: { username: 'david.zendzian', name: 'David Zendzian', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
  {
    email: 'abermudez@invaluable.com',
    metadata: { username: 'alex.bermudez', name: 'Alex Bermudez', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
  {
    email: 'tcolucci@invaluable.com',
    metadata: { username: 'tory.colucci', name: 'Tory Colucci', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
  {
    email: 'cnecklas@invaluable.com',
    metadata: { username: 'chris.necklas', name: 'Chris Necklas', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
  {
    email: 'mgomes@invaluable.com',
    metadata: { username: 'myron.gomes', name: 'Myron Gomes', isAdmin: false },
    profile: { level: null, jiraAccountId: null },
  },
];

for (const { email, metadata, profile } of USERS) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`⚠  ${email} already exists — skipping`);
    } else {
      console.error(`✗  ${email}: ${error.message}`);
    }
    continue;
  }

  console.log(`✓  Created ${email} (${data.user.id})`);

  const nameParts = metadata.name.trim().split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  const { error: profileError } = await supabase.from('profiles').upsert({
    username: metadata.username,
    auth_user_id: data.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    is_admin: metadata.isAdmin,
    level: profile.level ?? null,
    jira_account_id: profile.jiraAccountId ?? null,
    active: true,
  }, { onConflict: 'username' });

  if (profileError) {
    console.error(`  ✗  Profile insert failed for ${metadata.username}: ${profileError.message}`);
  } else {
    console.log(`  ✓  Profile row created for ${metadata.username}`);
  }
}

console.log(`\nTemporary password for all new users: ${TEMP_PASSWORD}`);
console.log('Share passwords privately and ask users to update them after first login.');
