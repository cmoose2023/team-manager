import { NavBar } from '@/components/NavBar';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = (user?.user_metadata?.username as string | undefined) ?? '';

  return (
    <>
      <NavBar username={username} homeHref="/dashboard" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </>
  );
}
