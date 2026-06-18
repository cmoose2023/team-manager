import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { KnowledgeShareSession } from '@/lib/types';

function rowToSession(row: Record<string, unknown>): KnowledgeShareSession {
  return {
    id: row.id as string,
    week: row.week as number,
    scheduledDate: (row.scheduled_date as string) || undefined,
    presenterId: (row.presenter_id as string) || undefined,
    presenterName: (row.presenter_name as string) || undefined,
    backlogId: (row.backlog_id as string) || undefined,
    topicTitle: (row.topic_title as string) || undefined,
    status: row.status as KnowledgeShareSession['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// PUT /api/knowledge-share/sessions/[id] - Update session (schedule, presenter, topic, status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { scheduledDate, presenterId, presenterName, backlogId, topicTitle, status } = body;
    
    const supabase = createSupabaseAdminClient();
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    if (scheduledDate !== undefined) updateData.scheduled_date = scheduledDate;
    if (presenterId !== undefined) updateData.presenter_id = presenterId;
    if (presenterName !== undefined) updateData.presenter_name = presenterName;
    if (backlogId !== undefined) updateData.backlog_id = backlogId;
    if (topicTitle !== undefined) updateData.topic_title = topicTitle;
    if (status !== undefined) updateData.status = status;
    
    const { data: row, error } = await supabase
      .from('knowledge_share_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!row) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json({ session: rowToSession(row) });
  } catch (err: unknown) {
    console.error('Error updating session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update session', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/knowledge-share/sessions/[id] - Clear a session back to planned state
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: row, error } = await supabase
      .from('knowledge_share_sessions')
      .update({
        scheduled_date: null,
        presenter_id: null,
        presenter_name: null,
        backlog_id: null,
        topic_title: null,
        status: 'planned',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!row) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: rowToSession(row) });
  } catch (err: unknown) {
    console.error('Error clearing session:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to clear session', details: errorMessage }, { status: 500 });
  }
}
