import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || '',
        isAdmin: user.user_metadata?.isAdmin === true,
      },
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
