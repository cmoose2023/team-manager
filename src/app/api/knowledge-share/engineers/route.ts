import { NextResponse } from 'next/server';
import { ENGINEERS } from '@/lib/engineers';

// GET /api/knowledge-share/engineers - List all engineers available as presenters
export async function GET() {
  return NextResponse.json({
    engineers: ENGINEERS.map((e) => ({ id: e.id, name: e.name })),
  });
}
