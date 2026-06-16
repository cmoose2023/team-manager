import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { TestResult, TestResultStatus } from '@/lib/types';

// ── PUT /api/group-testing/[id]/results ────────────────────────────────────
// Upsert a test result cell (testCaseId × permutationId).

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

  const { id: sessionId } = await params;

  let body: { testCaseId: string; permutationId: string; status: TestResultStatus; notes?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { testCaseId, permutationId, status, notes } = body;

  if (!testCaseId || !permutationId || !status) {
    return Response.json(
      { error: 'testCaseId, permutationId, and status are required' },
      { status: 400 },
    );
  }

  const validStatuses: TestResultStatus[] = ['pending', 'pass', 'fail', 'skip'];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  // Verify session exists
  const { data: session } = await db
    .from('test_sessions')
    .select('id')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  // Upsert the result
  const { data: row, error } = await db
    .from('test_results')
    .upsert(
      {
        test_case_id: testCaseId,
        permutation_id: permutationId,
        status,
        notes: notes ?? null,
        updated_by: auth.username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'test_case_id,permutation_id' },
    )
    .select()
    .single();

  if (error) {
    console.error('PUT /api/group-testing/[id]/results error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const result: TestResult = {
    testCaseId: row.test_case_id as string,
    permutationId: row.permutation_id as string,
    status: row.status as TestResultStatus,
    notes: (row.notes as string | null) ?? undefined,
    updatedBy: row.updated_by as string,
    updatedAt: row.updated_at as string,
  };

  return Response.json({ result });
}
