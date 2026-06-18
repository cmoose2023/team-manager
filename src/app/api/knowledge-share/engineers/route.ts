import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { ENGINEERS } from '@/lib/engineers';

// GET /api/knowledge-share/engineers - List engineers with their Supabase UUIDs
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error || !data?.users) {
      // Fallback: return engineers without UUIDs (presenterId will be omitted)
      return NextResponse.json({
        engineers: ENGINEERS.map((e) => ({ id: null, username: e.id, name: e.name })),
      });
    }

    const engineers = ENGINEERS.map((eng) => {
      const user = data.users.find((u) => u.user_metadata?.username === eng.id);
      return { id: user?.id ?? null, username: eng.id, name: eng.name };
    });

    return NextResponse.json({ engineers });
  } catch (err) {
    console.error('Error fetching engineers:', err);
    return NextResponse.json({ error: 'Failed to fetch engineers' }, { status: 500 });
  }
}
