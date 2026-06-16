import { AppShell } from '@/components/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? '';
  const isAdmin = user?.user_metadata?.isAdmin === true;

  return (
    <AppShell username={username} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
