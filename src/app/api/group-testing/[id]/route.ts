import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { TestSession, TestSessionDetail, TestCase, TestPermutation, TestResult } from '@/lib/types';

function rowToTestSession(row: Record<string, unknown>, attendees: string[] = []): TestSession {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledDate: row.scheduled_date as string,
    ticketRef: (row.ticket_ref as string | null) ?? undefined,
    goal: (row.goal as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    signedOff: row.signed_off as boolean,
    createdBy: row.created_by as string,
    attendees,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function fetchAttendees(db: ReturnType<typeof createSupabaseAdminClient>, sessionId: string) {
  const { data, error } = await db
    .from('test_session_attendees')
    .select('username')
    .eq('session_id', sessionId);

  if (error) {
    console.error('fetchAttendees error:', error);
    return [];
  }

  return (data ?? []).map((row) => row.username);
}

function rowToTestCase(row: Record<string, unknown>): TestCase {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    label: row.label as string,
    category: (row.category as string | null) ?? undefined,
    sortOrder: row.sort_order as number,
  };
}

function rowToTestPermutation(row: Record<string, unknown>): TestPermutation {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    label: row.label as string,
    channel: row.channel as string,
    browser: row.browser as string,
    sortOrder: row.sort_order as number,
  };
}

function rowToTestResult(row: Record<string, unknown>): TestResult {
  return {
    testCaseId: row.test_case_id as string,
    permutationId: row.permutation_id as string,
    status: row.status as TestResult['status'],
    notes: (row.notes as string | null) ?? undefined,
    updatedBy: row.updated_by as string,
    updatedAt: row.updated_at as string,
  };
}

// ── GET /api/group-testing/[id] ───────────────────────────────────────────
// Returns full session details with test cases, permutations, and results.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createSupabaseAdminClient();

  // Fetch session
  const { data: sessionRow, error: sessionError } = await db
    .from('test_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (sessionError || !sessionRow) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Fetch test cases
  const { data: testCasesRows } = await db
    .from('test_cases')
    .select('*')
    .eq('session_id', id)
    .order('sort_order');

  // Fetch permutations
  const { data: permutationsRows } = await db
    .from('test_permutations')
    .select('*')
    .eq('session_id', id)
    .order('sort_order');

  // Fetch results
  const { data: resultsRows } = await db
    .from('test_results')
    .select('*')
    .eq('session_id', id);

  const attendees = await fetchAttendees(db, id);

  const detail: TestSessionDetail = {
    ...rowToTestSession(sessionRow as Record<string, unknown>, attendees),
    testCases: (testCasesRows ?? []).map((r) => rowToTestCase(r as Record<string, unknown>)),
    permutations: (permutationsRows ?? []).map((r) => rowToTestPermutation(r as Record<string, unknown>)),
    results: (resultsRows ?? []).map((r) => rowToTestResult(r as Record<string, unknown>)),
  };

  return Response.json({ item: detail, currentUser: auth.username });
}

// ── PUT /api/group-testing/[id] ───────────────────────────────────────────
// Update session details. Only creator or admin can update.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: Partial<TestSession>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Check ownership
  const { data: sessionRow } = await db
    .from('test_sessions')
    .select('created_by')
    .eq('id', id)
    .single();

  if (!sessionRow) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!auth.isAdmin && sessionRow.created_by !== auth.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, scheduledDate, ticketRef, goal, notes, signedOff, attendees } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (scheduledDate !== undefined) updates.scheduled_date = scheduledDate;
  if (ticketRef !== undefined) updates.ticket_ref = ticketRef ?? null;
  if (goal !== undefined) updates.goal = goal ?? null;
  if (notes !== undefined) updates.notes = notes ?? null;
  if (signedOff !== undefined) updates.signed_off = signedOff;

  if (Object.keys(updates).length === 0 && attendees === undefined) {
    return Response.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await db.from('test_sessions').update(updates).eq('id', id);
    if (error) {
      console.error('PUT /api/group-testing/[id] error:', error);
      return Response.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
  }

  if (attendees !== undefined) {
    await db.from('test_session_attendees').delete().eq('session_id', id);
    if (attendees.length > 0) {
      const attendeesData = attendees.map((username) => ({ session_id: id, username }));
      const { error: attendeesError } = await db.from('test_session_attendees').insert(attendeesData);
      if (attendeesError) {
        console.error('PUT /api/group-testing/[id] attendees error:', attendeesError);
      }
    }
  }

  const { data: updatedRow, error: fetchError } = await db
    .from('test_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !updatedRow) {
    console.error('PUT /api/group-testing/[id] fetch error:', fetchError);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const updatedAttendees = await fetchAttendees(db, id);
  const item = rowToTestSession(updatedRow as Record<string, unknown>, updatedAttendees);
  return Response.json({ item });
}

// ── DELETE /api/group-testing/[id] ───────────────────────────────────────
// Delete a session and all related data. Only creator or admin can delete.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createSupabaseAdminClient();

  // Check ownership
  const { data: sessionRow } = await db
    .from('test_sessions')
    .select('created_by')
    .eq('id', id)
    .single();

  if (!sessionRow) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!auth.isAdmin && sessionRow.created_by !== auth.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete results first (foreign key dependency)
  await db.from('test_results').delete().eq('session_id', id);

  // Delete test cases
  await db.from('test_cases').delete().eq('session_id', id);

  // Delete permutations
  await db.from('test_permutations').delete().eq('session_id', id);

  // Delete session
  const { error } = await db.from('test_sessions').delete().eq('id', id);

  if (error) {
    console.error('DELETE /api/group-testing/[id] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ success: true });
}
