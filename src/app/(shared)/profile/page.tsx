import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function ProfileRedirect() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? '';
  redirect(`/profile/${username}`);
}
