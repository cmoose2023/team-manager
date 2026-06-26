import { AppShell } from '@/components/AppShell';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';

export default async function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? '';

  // Check if the engineer's account has been deactivated
  if (username) {
    const db = createSupabaseAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('active')
      .eq('username', username)
      .single();

    if (profile && profile.active === false) {
      return (
        <AppShell username={username} isAdmin={false}>
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Account Deactivated</h1>
            <p className="text-sm text-white/60 max-w-sm">
              Your account has been deactivated. Please contact your admin if you believe this is a mistake.
            </p>
          </div>
        </AppShell>
      );
    }
  }

  return (
    <AppShell username={username} isAdmin={false}>
      {children}
    </AppShell>
  );
}
