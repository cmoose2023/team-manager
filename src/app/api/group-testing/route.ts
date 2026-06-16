import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { TestSession, TestResultStatus } from '@/lib/types';

function rowToTestSession(row: Record<string, unknown>): TestSession {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledDate: row.scheduled_date as string,
    ticketRef: (row.ticket_ref as string | null) ?? undefined,
    goal: (row.goal as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    signedOff: row.signed_off as boolean,
    createdBy: row.created_by as string,
    attendees: row.attendees as string[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── GET /api/group-testing ───────────────────────────────────────────────────
// Returns all test sessions. Accessible to any authenticated user.

export async function GET() {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  const { data: rows, error } = await db
    .from('test_sessions')
    .select('*')
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('GET /api/group-testing error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (rows ?? []).map((r) => rowToTestSession(r as Record<string, unknown>));
  return Response.json({ items });
}

// ── POST /api/group-testing ──────────────────────────────────────────────────
// Create a new test session. Any authenticated user can create.

export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<TestSession> & { testCases?: string[]; permutations?: Array<{ label: string; channel: string; browser: string }> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, scheduledDate, ticketRef, goal, notes, attendees = [], testCases = [], permutations = [] } = body;

  if (!title || !scheduledDate) {
    return Response.json(
      { error: 'title and scheduledDate are required' },
      { status: 400 },
    );
  }

  const db = createSupabaseAdminClient();

  // Create the session
  const { data: sessionRow, error: sessionError } = await db
    .from('test_sessions')
    .insert({
      title,
      scheduled_date: scheduledDate,
      ticket_ref: ticketRef ?? null,
      goal: goal ?? null,
      notes: notes ?? null,
      signed_off: false,
      created_by: auth.username,
      attendees,
    })
    .select()
    .single();

  if (sessionError) {
    console.error('POST /api/group-testing session error:', sessionError);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const sessionId = sessionRow.id as string;

  // Insert test cases if provided
  if (testCases.length > 0) {
    const testCasesData = testCases.map((label, index) => ({
      session_id: sessionId,
      label,
      sort_order: index,
    }));

    const { error: testCasesError } = await db.from('test_cases').insert(testCasesData);
    if (testCasesError) {
      console.error('POST /api/group-testing test cases error:', testCasesError);
    }
  }

  // Insert permutations if provided
  if (permutations.length > 0) {
    const permutationsData = permutations.map((perm, index) => ({
      session_id: sessionId,
      label: perm.label,
      channel: perm.channel,
      browser: perm.browser,
      sort_order: index,
    }));

    const { error: permutationsError } = await db.from('test_permutations').insert(permutationsData);
    if (permutationsError) {
      console.error('POST /api/group-testing permutations error:', permutationsError);
    }
  }

  const item = rowToTestSession(sessionRow as Record<string, unknown>);
  return Response.json({ item }, { status: 201 });
}
