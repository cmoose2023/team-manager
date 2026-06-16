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

// ── GET /api/assessments/[engineerId]?period=2026-Q2 ─────────────────────────
// Returns both the admin and self assessment records for the engineer + period.
// Admin can fetch any engineer; engineers can only fetch their own.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ engineerId: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { engineerId } = await params;

  if (!auth.isAdmin && auth.username !== engineerId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const period = request.nextUrl.searchParams.get('period');
  if (!period) {
    return Response.json({ error: 'period query parameter is required' }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const { data: rows, error } = await db
    .from('assessments')
    .select('*')
    .eq('engineer_id', engineerId)
    .eq('period', period);

  if (error) {
    console.error('GET /api/assessments/[engineerId] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (rows ?? []).map((r) => rowToAssessment(r as Record<string, unknown>));
  const admin = items.find((i) => i.assessorType === 'admin') ?? null;
  const self = items.find((i) => i.assessorType === 'self') ?? null;

  return Response.json({ admin, self });
}

// ── PUT /api/assessments/[engineerId] ─────────────────────────────────────────
// Upsert an assessment for a specific engineer.
// Admin can upsert admin-type records for any engineer;
// engineers can only upsert self-type records for themselves.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ engineerId: string }> },
) {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { engineerId } = await params;

  let body: { assessorType?: AssessorType; period?: string; ratings?: Ratings; overallNote?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { assessorType, period, ratings, overallNote } = body;

  if (!assessorType || !period || !ratings) {
    return Response.json(
      { error: 'assessorType, period, and ratings are required' },
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

  const engineer = getEngineerById(engineerId);
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
        engineer_level: engineer.level,
        assessor_id: auth.username,
        ratings,
        overall_note: overallNote ?? null,
      },
      { onConflict: 'engineer_id,period,assessor_type' },
    )
    .select()
    .single();

  if (error) {
    console.error('PUT /api/assessments/[engineerId] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  const item = rowToAssessment(row as Record<string, unknown>);
  return Response.json({ item });
}
