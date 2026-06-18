import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuth } from '@/lib/auth';
import { KnowledgeShareBacklog } from '@/lib/types';

function rowToBacklog(row: Record<string, unknown>): KnowledgeShareBacklog {
  return {
    id: row.id as string,
    category: row.category as string,
    title: row.title as string,
    description: row.description as string,
    claimedBy: (row.claimed_by as string) || undefined,
    claimedByName: (row.claimed_by_name as string) || undefined,
    claimedAt: (row.claimed_at as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// Seed data for initial backlog topics
const SEED_BACKLOG = [
  // AI Tools & Workflows
  { category: 'AI Tools & Workflows', title: 'Claude Code in practice', description: 'Setup, delegating real tickets, and where it shines vs. where it doesn\'t' },
  { category: 'AI Tools & Workflows', title: 'Prompt engineering fundamentals', description: 'Specs, examples, structured output, iteration' },
  { category: 'AI Tools & Workflows', title: 'AI-assisted code review', description: 'Catching bugs, suggesting refactors, drafting PR descriptions' },
  { category: 'AI Tools & Workflows', title: 'AI for test generation', description: 'Unit tests, edge cases, and the trust-but-verify problem' },
  { category: 'AI Tools & Workflows', title: 'AI for documentation', description: 'Turning tribal knowledge into living docs' },
  { category: 'AI Tools & Workflows', title: 'Building a small internal AI tool', description: 'Live demo wiring up the Anthropic API' },
  { category: 'AI Tools & Workflows', title: 'Limits & failure modes of AI coding tools', description: 'Hallucinated APIs, subtle logic errors, guardrails' },
  
  // Frontend Concepts & Deep Dives
  { category: 'Frontend Concepts & Deep Dives', title: 'Web Components from scratch', description: 'Custom elements, shadow DOM, slots' },
  { category: 'Frontend Concepts & Deep Dives', title: 'SSR vs. SSG vs. CSR vs. ISR', description: 'Tradeoffs, hydration, and when each makes sense' },
  { category: 'Frontend Concepts & Deep Dives', title: 'How React hydration actually works', description: 'And how it breaks' },
  { category: 'Frontend Concepts & Deep Dives', title: 'Modern CSS you\'re probably not using', description: 'Container queries, :has(), cascade layers, subgrid' },
  { category: 'Frontend Concepts & Deep Dives', title: 'State management beyond Redux', description: 'Context, Zustand, signals, and the "do we even need a library" question' },
  { category: 'Frontend Concepts & Deep Dives', title: 'Accessibility deep dive', description: 'ARIA, keyboard nav, and auditing a real page together' },
  { category: 'Frontend Concepts & Deep Dives', title: 'Core Web Vitals & performance budgets', description: 'Measuring, profiling, fixing bottlenecks' },
  { category: 'Frontend Concepts & Deep Dives', title: 'Migrating jQuery patterns to modern JS', description: 'What to replace and what to leave alone' },
  
  // Workflows & Engineering Practice
  { category: 'Workflows & Engineering Practice', title: 'Git beyond the basics', description: 'Rebasing, bisecting, reflog, recovering from mistakes' },
  { category: 'Workflows & Engineering Practice', title: 'Reading & writing good technical design docs', description: 'Structure, scope, estimates' },
  { category: 'Workflows & Engineering Practice', title: 'Debugging like a detective', description: 'DevTools deep dive, network waterfalls, source maps' },
  { category: 'Workflows & Engineering Practice', title: 'Effective code review culture', description: 'What to flag, what to let go, tone and turnaround' },
  { category: 'Workflows & Engineering Practice', title: 'Feature flags & safe rollouts', description: 'Decoupling deploy from release' },
  { category: 'Workflows & Engineering Practice', title: 'Observability for frontend', description: 'Error tracking, logging, knowing when something\'s broken' },
];

// GET /api/knowledge-share/backlog - List all backlog items
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data: rows, error } = await supabase
      .from('knowledge_share_backlog')
      .select('*')
      .order('category')
      .order('title');
    
    if (error) throw error;
    
    // If no data exists, seed it
    if (!rows || rows.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from('knowledge_share_backlog')
        .insert(SEED_BACKLOG)
        .select();
      
      if (seedError) throw seedError;
      return NextResponse.json({ backlog: (seeded || []).map(rowToBacklog) });
    }
    
    return NextResponse.json({ backlog: rows.map(rowToBacklog) });
  } catch (err) {
    console.error('Error fetching backlog:', err);
    return NextResponse.json({ error: 'Failed to fetch backlog' }, { status: 500 });
  }
}

// POST /api/knowledge-share/backlog - Create new backlog item (any authenticated user)
export async function POST(request: NextRequest) {
  try {
    await getAuth(); // ensures user is authenticated
    
    const body = await request.json();
    const { category, title, description } = body;
    
    if (!category || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = createSupabaseAdminClient();
    const { data: row, error } = await supabase
      .from('knowledge_share_backlog')
      .insert({ category, title, description })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ item: rowToBacklog(row) }, { status: 201 });
  } catch (err) {
    console.error('Error creating backlog item:', err);
    return NextResponse.json({ error: 'Failed to create backlog item' }, { status: 500 });
  }
}
