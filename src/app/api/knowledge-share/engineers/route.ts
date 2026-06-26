import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// GET /api/knowledge-share/engineers - List active engineers with their Supabase UUIDs
export async function GET() {
  try {
    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from('profiles')
      .select('username, first_name, last_name, auth_user_id')
      .eq('is_admin', false)
      .eq('active', true)
      .order('last_name');

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to fetch engineers' }, { status: 500 });
    }

    const engineers = data.map((row) => ({
      id: row.auth_user_id ?? null,
      username: row.username as string,
      name: `${row.first_name as string} ${row.last_name as string}`.trim(),
    }));

    return NextResponse.json({ engineers });
  } catch (err) {
    console.error('Error fetching engineers:', err);
    return NextResponse.json({ error: 'Failed to fetch engineers' }, { status: 500 });
  }
}
