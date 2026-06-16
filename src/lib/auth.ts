import { createSupabaseServerClient } from './supabase-server';
import type { AuthPayload } from './types';

/**
 * Validates the caller's Supabase session (from cookies) and returns their
 * identity. Throws if the session is missing or invalid.
 * For use in API Route Handlers only.
 */
export async function getAuth(): Promise<AuthPayload> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Unauthorized');

  const username = (user.user_metadata?.username as string | undefined) ?? '';
  const isAdmin = user.user_metadata?.isAdmin === true;

  return {
    username,
    groups: isAdmin ? ['Admins'] : [],
    isAdmin,
  };
}
