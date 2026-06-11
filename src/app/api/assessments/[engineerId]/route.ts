import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth';
import { docClient, TABLE_NAME, makePeriodType } from '@/lib/dynamo';
import { getEngineerById } from '@/lib/engineers';
import type { Assessment, AssessorType } from '@/lib/types';

// ── GET /api/assessments/[engineerId]?period=2026-Q2 ─────────────────────────
// Returns both the admin and self assessment records for the engineer + period.
// Admin can fetch any engineer; engineers can only fetch their own.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ engineerId: string }> }
) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let auth;
  try {
    auth = await verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { engineerId } = await params;

  if (!auth.isAdmin && auth.username !== engineerId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const period = request.nextUrl.searchParams.get('period');
  if (!period) {
    return Response.json({ error: 'period query parameter is required' }, { status: 400 });
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression:
          'engineerId = :eid AND begins_with(periodType, :prefix)',
        ExpressionAttributeValues: {
          ':eid': engineerId,
          ':prefix': `${period}#`,
        },
      })
    );

    const items = (result.Items ?? []) as Assessment[];
    const admin = items.find((i) => i.assessorType === 'admin') ?? null;
    const self = items.find((i) => i.assessorType === 'self') ?? null;

    return Response.json({ admin, self });
  } catch (err) {
    console.error('GET /api/assessments/[engineerId] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/assessments/[engineerId] ─────────────────────────────────────────
// Upsert an assessment for a specific engineer.
// Admin can upsert admin-type records for any engineer;
// engineers can only upsert self-type records for themselves.

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ engineerId: string }> }
) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let auth;
  try {
    auth = await verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { engineerId } = await params;

  let body: Partial<Assessment> & { assessorType?: AssessorType; period?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { assessorType, period, ratings, overallNote, createdAt } = body;

  if (!assessorType || !period || !ratings) {
    return Response.json(
      { error: 'assessorType, period, and ratings are required' },
      { status: 400 }
    );
  }

  // Authorization
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

  const now = new Date().toISOString();
  const item: Assessment = {
    engineerId,
    periodType: makePeriodType(period, assessorType),
    engineerName: engineer.name,
    engineerLevel: engineer.level,
    assessorId: auth.username,
    assessorType,
    period,
    ratings,
    overallNote,
    createdAt: createdAt ?? now,
    updatedAt: now,
  };

  try {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return Response.json({ item });
  } catch (err) {
    console.error('PUT /api/assessments/[engineerId] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
