import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuth } from '@/lib/auth';

// PUT /api/knowledge-share/backlog/[id] - Claim or unclaim a topic
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current user UUID from Supabase auth
    const serverClient = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await serverClient.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    const isAdmin = user.user_metadata?.isAdmin === true;
    
    const supabase = createSupabaseAdminClient();
    
    // Get current item state
    const { data: current, error: fetchError } = await supabase
      .from('knowledge_share_backlog')
      .select('claimed_by')
      .eq('id', id)
      .single();
    
    if (fetchError || !current) {
      return NextResponse.json({ error: 'Backlog item not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { action } = body; // 'claim' or 'unclaim'
    
    if (action === 'claim') {
      // Check if already claimed by someone else
      if (current.claimed_by && current.claimed_by !== userId) {
        return NextResponse.json({ error: 'Already claimed by another user' }, { status: 409 });
      }
      
      const displayName = (user.user_metadata?.name as string) || (user.user_metadata?.username as string) || user.email || 'Unknown';
      
      const { error } = await supabase
        .from('knowledge_share_backlog')
        .update({ 
          claimed_by: userId, 
          claimed_by_name: displayName,
          claimed_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) throw error;
    } else if (action === 'unclaim') {
      // Only the claimer or admin can unclaim
      if (current.claimed_by !== userId && !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const { error } = await supabase
        .from('knowledge_share_backlog')
        .update({ claimed_by: null, claimed_by_name: null, claimed_at: null })
        .eq('id', id);
      
      if (error) throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error updating backlog item:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update backlog item', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/knowledge-share/backlog/[id] - Delete backlog item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuth();
    
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('knowledge_share_backlog')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting backlog item:', err);
    return NextResponse.json({ error: 'Failed to delete backlog item' }, { status: 500 });
  }
}
