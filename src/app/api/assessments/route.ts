import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth';
import { docClient, TABLE_NAME, GSI_NAME, makePeriodType } from '@/lib/dynamo';
import { getEngineerById } from '@/lib/engineers';
import type { Assessment, AssessorType, EngineerLevel } from '@/lib/types';

// ── GET /api/assessments?period=2026-Q2&type=admin|self ───────────────────────
// Admin only. Returns all assessment records for the given period.
// If `type` is omitted, returns both admin and self records.

export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let auth;
  try {
    auth = await verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
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

  try {
    let items: Assessment[] = [];

    if (type) {
      // Query GSI for a specific assessorType
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: GSI_NAME,
          KeyConditionExpression: '#period = :period AND assessorType = :type',
          ExpressionAttributeNames: { '#period': 'period' },
          ExpressionAttributeValues: { ':period': period, ':type': type },
        })
      );
      items = (result.Items ?? []) as Assessment[];
    } else {
      // Fetch both admin and self in parallel
      const [adminResult, selfResult] = await Promise.all([
        docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: GSI_NAME,
            KeyConditionExpression: '#period = :period AND assessorType = :type',
            ExpressionAttributeNames: { '#period': 'period' },
            ExpressionAttributeValues: { ':period': period, ':type': 'admin' },
          })
        ),
        docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: GSI_NAME,
            KeyConditionExpression: '#period = :period AND assessorType = :type',
            ExpressionAttributeNames: { '#period': 'period' },
            ExpressionAttributeValues: { ':period': period, ':type': 'self' },
          })
        ),
      ]);
      items = [
        ...((adminResult.Items ?? []) as Assessment[]),
        ...((selfResult.Items ?? []) as Assessment[]),
      ];
    }

    return Response.json({ items });
  } catch (err) {
    console.error('GET /api/assessments error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/assessments ─────────────────────────────────────────────────────
// Upsert an assessment. Admin can save admin-type records for any engineer;
// engineers can only save self-type records for themselves.

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let auth;
  try {
    auth = await verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  let body: Partial<Assessment>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { engineerId, engineerLevel, assessorType, period, ratings, overallNote } = body;

  if (!engineerId || !engineerLevel || !assessorType || !period || !ratings) {
    return Response.json(
      { error: 'engineerId, engineerLevel, assessorType, period, and ratings are required' },
      { status: 400 }
    );
  }

  // Authorization: engineers can only save their own self-assessments
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
    engineerLevel: engineerLevel as EngineerLevel,
    assessorId: auth.username,
    assessorType,
    period,
    ratings,
    overallNote,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Use a conditional write to preserve createdAt on updates
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        // If the item already exists, keep its original createdAt
        ConditionExpression: 'attribute_not_exists(engineerId)',
      })
    );
    return Response.json({ item }, { status: 201 });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === 'ConditionalCheckFailedException'
    ) {
      // Item exists — fall through to an unconditional update preserving createdAt
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: { ...item, createdAt: body.createdAt ?? now },
        })
      );
      return Response.json({ item }, { status: 200 });
    }
    console.error('POST /api/assessments error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
