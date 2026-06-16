import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { TestCase } from '@/lib/types';

// ── POST /api/group-testing/[id]/test-cases ────────────────────────────────
// Add a new test case to the session.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: sessionId } = await params;

  let body: { label: string; category?: string; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { label, category, sortOrder } = body;

  if (!label) {
    return Response.json({ error: 'label is required' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Check ownership
  const { data: session } = await db
    .from('test_sessions')
    .select('created_by')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!auth.isAdmin && session.created_by !== auth.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get max sort order if not provided
  let finalSortOrder = sortOrder;
  if (finalSortOrder === undefined) {
    const { data: maxRow } = await db
      .from('test_cases')
      .select('sort_order')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    finalSortOrder = (maxRow?.sort_order ?? -1) + 1;
  }

  const { data: row, error } = await db
    .from('test_cases')
    .insert({
      session_id: sessionId,
      label,
      category: category ?? null,
      sort_order: finalSortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('POST /api/group-testing/[id]/test-cases error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const testCase: TestCase = {
    id: row.id as string,
    sessionId: row.session_id as string,
    label: row.label as string,
    category: (row.category as string | null) ?? undefined,
    sortOrder: row.sort_order as number,
  };

  return Response.json({ testCase }, { status: 201 });
}

// ── DELETE /api/group-testing/[id]/test-cases ──────────────────────────────
// Delete a test case and its associated results.

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

  const { id: sessionId } = await params;
  const { searchParams } = request.nextUrl;
  const testCaseId = searchParams.get('testCaseId');

  if (!testCaseId) {
    return Response.json({ error: 'testCaseId query parameter is required' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Check ownership
  const { data: session } = await db
    .from('test_sessions')
    .select('created_by')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!auth.isAdmin && session.created_by !== auth.username) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete associated results first
  await db
    .from('test_results')
    .delete()
    .eq('test_case_id', testCaseId);

  // Delete test case
  const { error } = await db
    .from('test_cases')
    .delete()
    .eq('id', testCaseId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('DELETE /api/group-testing/[id]/test-cases error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return Response.json({ success: true });
}
