import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth';
import { docClient, TABLE_NAME } from '@/lib/dynamo';

// ── GET /api/periods ──────────────────────────────────────────────────────────
// Returns all unique review periods that exist in the DB, newest first.
// Available to all authenticated users (admin + engineers).

export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await verifyToken(token);
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: '#period',
        ExpressionAttributeNames: { '#period': 'period' },
      })
    );

    const periods = [
      ...new Set((result.Items ?? []).map((item) => item.period as string)),
    ].sort((a, b) => b.localeCompare(a)); // newest first (lexicographic on "2026-Q2" format)

    return Response.json({ periods });
  } catch (err) {
    console.error('GET /api/periods error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
