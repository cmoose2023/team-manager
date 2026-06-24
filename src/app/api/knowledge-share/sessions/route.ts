import { NextResponse } from 'next/server';
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

// GET /api/knowledge-share/sessions - List all sessions (8 weeks)
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data: rows, error } = await supabase
      .from('knowledge_share_sessions')
      .select('*')
      .order('week');
    
    if (error) throw error;
    
    // If no data exists, create 8 week slots
    if (!rows || rows.length === 0) {
      const initialSlots = Array.from({ length: 8 }, (_, i) => ({
        week: i + 1,
        status: 'planned',
      }));
      
      const { data: created, error: createError } = await supabase
        .from('knowledge_share_sessions')
        .insert(initialSlots)
        .select();
      
      if (createError) throw createError;
      return NextResponse.json({ sessions: (created || []).map(rowToSession) });
    }
    
    return NextResponse.json({ sessions: rows.map(rowToSession) });
  } catch (err: unknown) {
    console.error('Error fetching sessions:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch sessions', details: errorMessage }, { status: 500 });
  }
}
