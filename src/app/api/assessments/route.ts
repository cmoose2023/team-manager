import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getEngineerById } from '@/lib/engineers';
import type { Assessment, AssessorType, EngineerLevel, Ratings } from '@/lib/types';

function rowToAssessment(row: Record<string, unknown>): Assessment {
  return {
    engineerId: row.engineer_id as string,
    engineerName: row.engineer_name as string,
    engineerLevel: row.engineer_level as EngineerLevel,
    assessorId: row.assessor_id as string,
    assessorType: row.assessor_type as AssessorType,
    period: row.period as string,
    ratings: row.ratings as Ratings,
    overallNote: (row.overall_note as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── GET /api/assessments?period=2026-Q2&type=admin|self ───────────────────────
// Admin only. Returns all assessment records for the given period.
// If `type` is omitted, returns both admin and self records.

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
  const period = searchParams.get('period');
  const type = searchParams.get('type') as AssessorType | null;

  if (!period) {
    return Response.json({ error: 'period query parameter is required' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  let query = db.from('assessments').select('*').eq('period', period);
  if (type) query = query.eq('assessor_type', type);

  const { data: rows, error } = await query;
  if (error) {
    console.error('GET /api/assessments error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (rows ?? []).map((r) => rowToAssessment(r as Record<string, unknown>));
  return Response.json({ items });
}

// ── POST /api/assessments ─────────────────────────────────────────────────────
// Upsert an assessment. Admin can save admin-type records for any engineer;
// engineers can only save self-type records for themselves.

export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Partial<Assessment> & { assessorType?: AssessorType; period?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { engineerId, engineerLevel, assessorType, period, ratings, overallNote } = body;

  if (!engineerId || !engineerLevel || !assessorType || !period || !ratings) {
    return Response.json(
      { error: 'engineerId, engineerLevel, assessorType, period, and ratings are required' },
      { status: 400 },
    );
  }

  if (!auth.isAdmin) {
    if (auth.username !== engineerId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (assessorType !== 'self') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const engineer = await getEngineerById(engineerId);
  if (!engineer) {
    return Response.json({ error: 'Engineer not found' }, { status: 404 });
  }

  const db = createSupabaseAdminClient();
  const { data: row, error } = await db
    .from('assessments')
    .upsert(
      {
        engineer_id: engineerId,
        period,
        assessor_type: assessorType,
        engineer_name: engineer.name,
        engineer_level: engineerLevel,
        assessor_id: auth.username,
        ratings,
        overall_note: overallNote ?? null,
      },
      { onConflict: 'engineer_id,period,assessor_type' },
    )
    .select()
    .single();

  if (error) {
    console.error('POST /api/assessments error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const item = rowToAssessment(row as Record<string, unknown>);
  return Response.json({ item }, { status: 200 });
}
