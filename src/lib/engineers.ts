import { createSupabaseAdminClient } from './supabase-server';
import type { Engineer, EngineerLevel } from './types';

function rowToEngineer(row: Record<string, unknown>): Engineer {
  return {
    id: row.username as string,
    name: `${row.first_name as string} ${row.last_name as string}`.trim(),
    level: row.level as EngineerLevel,
    jiraAccountId: (row.jira_account_id as string | null) ?? undefined,
  };
}

/** Server-side: fetch all active non-admin engineers from the profiles table. */
export async function getEngineers(): Promise<Engineer[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('profiles')
    .select('username, first_name, last_name, level, jira_account_id')
    .eq('is_admin', false)
    .eq('active', true)
    .order('last_name');

  if (error) {
    console.error('getEngineers error:', error);
    return [];
  }

  return (data ?? []).map((r) => rowToEngineer(r as Record<string, unknown>));
}

/** Server-side: fetch a single engineer profile by username. */
export async function getEngineerById(id: string): Promise<Engineer | undefined> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('profiles')
    .select('username, first_name, last_name, level, jira_account_id')
    .eq('username', id)
    .single();

  if (error || !data) return undefined;
  return rowToEngineer(data as Record<string, unknown>);
}
