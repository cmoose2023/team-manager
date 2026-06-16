import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// ── GET /api/periods ──────────────────────────────────────────────────────────
// Returns all unique review periods that exist in the DB, newest first.
// Available to all authenticated users (admin + engineers).

export async function GET() {
  try {
    await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createSupabaseAdminClient();
  const { data: rows, error } = await db
    .from('assessments')
    .select('period');

  if (error) {
    console.error('GET /api/periods error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const periods = [
    ...new Set((rows ?? []).map((r) => r.period as string)),
  ].sort((a, b) => b.localeCompare(a)); // newest first (lexicographic on "2026-Q2" format)

  return Response.json({ periods });
}
