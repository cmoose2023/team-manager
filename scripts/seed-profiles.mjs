/**
 * One-time script to seed the `profiles` table from existing Supabase Auth users.
 * Run AFTER applying supabase/migrations/add_profiles_table.sql.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
 *   node scripts/seed-profiles.mjs
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

// Known engineer data from src/lib/engineers.ts
const ENGINEER_DATA = {
  'steven.snyder': { level: 'PRINCIPAL_IC', jiraAccountId: '5fa1dbd1b45b2e007481fa68' },
  'julia.ballo':   { level: 'SENIOR_IC',    jiraAccountId: '712020:22be27ff-b9b2-4a7a-912d-0c1a7efbe0bf' },
  'agnes.szigethy':{ level: 'SENIOR_IC',    jiraAccountId: '712020:7409260c-a008-45cb-ae2b-0575beaac53e' },
  'michael.murphy':{ level: 'PRINCIPAL_IC', jiraAccountId: '' },
};

// Fetch all auth users
const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error('Failed to list users:', listError.message);
  process.exit(1);
}

for (const user of users) {
  const username = user.user_metadata?.username;
  const fullName = user.user_metadata?.name ?? '';
  const isAdmin = user.user_metadata?.isAdmin === true;

  if (!username) {
    console.warn(`⚠  Skipping user ${user.id} — no username in metadata`);
    continue;
  }

  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ');

  const engineerData = ENGINEER_DATA[username] ?? {};

  const profile = {
    username,
    auth_user_id: user.id,
    first_name: firstName,
    last_name: lastName,
    email: user.email ?? '',
    is_admin: isAdmin,
    level: engineerData.level ?? null,
    jira_account_id: engineerData.jiraAccountId ?? null,
    active: true,
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'username' });

  if (error) {
    console.error(`✗  ${username}: ${error.message}`);
  } else {
    console.log(`✓  Seeded profile for ${username} (${user.email})`);
  }
}

console.log('\nDone. All existing users now have profile rows.');
