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

type RouteContext = { params: Promise<{ username: string }> };

// ── GET /api/users/[username] ─────────────────────────────────────────────────
// Returns the profile. Allowed for: the user themselves, or any admin.

export async function GET(_request: NextRequest, { params }: RouteContext) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await params;

  if (!auth.isAdmin && auth.username !== username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createSupabaseAdminClient();
  const { data: row, error } = await db
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !row) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  return Response.json({ item: rowToProfile(row as Record<string, unknown>) });
}

// ── PUT /api/users/[username] ─────────────────────────────────────────────────
// Updates the profile. Self can update: firstName, lastName, email, password.
// Admin can also update: title, manager, startDate, level, active.

export async function PUT(request: NextRequest, { params }: RouteContext) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await params;

  if (!auth.isAdmin && auth.username !== username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    title?: string;
    manager?: string | null;
    startDate?: string | null;
    level?: EngineerLevel;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Fetch existing profile to get auth_user_id
  const { data: existing, error: fetchError } = await db
    .from('profiles')
    .select('auth_user_id, email')
    .eq('username', username)
    .single();

  if (fetchError || !existing) {
    return Response.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Build profile update (all roles can update these)
  const profileUpdate: Record<string, unknown> = {};
  if (body.firstName !== undefined) profileUpdate.first_name = body.firstName;
  if (body.lastName !== undefined) profileUpdate.last_name = body.lastName;
  if (body.email !== undefined) profileUpdate.email = body.email;

  // Admin-only profile fields
  if (auth.isAdmin) {
    if (body.title !== undefined) profileUpdate.title = body.title;
    if (body.manager !== undefined) profileUpdate.manager = body.manager;
    if (body.startDate !== undefined) profileUpdate.start_date = body.startDate;
    if (body.level !== undefined) profileUpdate.level = body.level;
    if (body.active !== undefined) profileUpdate.active = body.active;
  }

  // Apply profile changes
  if (Object.keys(profileUpdate).length > 0) {
    const { error: updateError } = await db
      .from('profiles')
      .update(profileUpdate)
      .eq('username', username);

    if (updateError) {
      console.error('PUT /api/users profile update error:', updateError);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }
  }

  // Sync auth user changes via admin client (email, name, password)
  if (existing.auth_user_id) {
    const authUpdate: Record<string, unknown> = {};
    if (body.email !== undefined) authUpdate.email = body.email;
    if (body.firstName !== undefined || body.lastName !== undefined) {
      const { data: currentRow } = await db
        .from('profiles')
        .select('first_name, last_name')
        .eq('username', username)
        .single();
      const fn = body.firstName ?? (currentRow?.first_name as string ?? '');
      const ln = body.lastName ?? (currentRow?.last_name as string ?? '');
      authUpdate.user_metadata = { username, name: `${fn} ${ln}`, isAdmin: (existing as Record<string, unknown>).is_admin ?? false };
    }
    if (body.password !== undefined) authUpdate.password = body.password;

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await db.auth.admin.updateUserById(
        existing.auth_user_id as string,
        authUpdate,
      );
      if (authError) {
        console.error('PUT /api/users auth update error:', authError);
        return Response.json({ error: 'Failed to update auth user' }, { status: 500 });
      }
    }
  }

  // Return updated profile
  const { data: updated, error: refetchError } = await db
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (refetchError || !updated) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ item: rowToProfile(updated as Record<string, unknown>) });
}

// ── DELETE /api/users/[username] ──────────────────────────────────────────────
// Admin only. Deactivates the engineer (sets active=false).

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!auth.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { username } = await params;

  if (username === auth.username) {
    return Response.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('profiles')
    .update({ active: false })
    .eq('username', username);

  if (error) {
    console.error('DELETE /api/users error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ success: true });
}
