import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { Profile, EngineerLevel } from '@/lib/types';

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    username: row.username as string,
    authUserId: (row.auth_user_id as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    title: (row.title as string | null) ?? null,
    manager: (row.manager as string | null) ?? null,
    startDate: (row.start_date as string | null) ?? null,
    level: (row.level as EngineerLevel | null) ?? null,
    jiraAccountId: (row.jira_account_id as string | null) ?? null,
    isAdmin: row.is_admin as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── GET /api/users ────────────────────────────────────────────────────────────
// Admin only. Returns all profiles. Supports ?role=engineer|admin filter.

export async function GET(request: NextRequest) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const role = searchParams.get('role');

  const db = createSupabaseAdminClient();
  let query = db.from('profiles').select('*').order('last_name');

  if (role === 'engineer') query = query.eq('is_admin', false);
  if (role === 'admin') query = query.eq('is_admin', true);

  const { data: rows, error } = await query;
  if (error) {
    console.error('GET /api/users error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (rows ?? []).map((r) => rowToProfile(r as Record<string, unknown>));
  return Response.json({ items });
}

// ── POST /api/users ───────────────────────────────────────────────────────────
// Admin only. Creates a new Supabase Auth user + profile row.

export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    level?: EngineerLevel;
    title?: string;
    manager?: string;
    startDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { firstName, lastName, email, password, level, title, manager, startDate } = body;

  if (!firstName || !lastName || !email || !password || !level) {
    return Response.json(
      { error: 'firstName, lastName, email, password, and level are required' },
      { status: 400 },
    );
  }

  // Derive username from first.last (lowercase, dots)
  const username = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}`;

  const db = createSupabaseAdminClient();

  // Create Supabase Auth user
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      name: `${firstName} ${lastName}`,
      isAdmin: false,
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return Response.json({ error: 'A user with this email already exists' }, { status: 409 });
    }
    console.error('POST /api/users auth error:', authError);
    return Response.json({ error: 'Failed to create auth user' }, { status: 500 });
  }

  // Insert profile row
  const { data: row, error: profileError } = await db
    .from('profiles')
    .insert({
      username,
      auth_user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      level,
      title: title ?? null,
      manager: manager ?? null,
      start_date: startDate ?? null,
      is_admin: false,
      active: true,
    })
    .select()
    .single();

  if (profileError) {
    console.error('POST /api/users profile error:', profileError);
    // Clean up auth user if profile insert fails
    await db.auth.admin.deleteUser(authData.user.id);
    return Response.json({ error: 'Failed to create profile' }, { status: 500 });
  }

  const item = rowToProfile(row as Record<string, unknown>);
  return Response.json({ item }, { status: 201 });
}
