import { AppShell } from '@/components/AppShell';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? '';

  return (
    <AppShell username={username} isAdmin={true}>
      {children}
    </AppShell>
  );
}
