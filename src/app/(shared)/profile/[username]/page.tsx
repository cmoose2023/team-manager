import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { ProfileForm } from '@/components/ProfileForm';
import type { Profile } from '@/lib/types';

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    username: row.username as string,
    authUserId: (row.auth_user_id as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    title: (row.title as string | null) ?? null,
    manager: (row.manager as string | null) ?? null,
    startDate: (row.start_date as string | null) ?? null,
    level: (row.level as Profile['level']) ?? null,
    jiraAccountId: (row.jira_account_id as string | null) ?? null,
    isAdmin: row.is_admin as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const currentUsername = (user.user_metadata?.username as string | undefined) ?? '';
  const isAdmin = user.user_metadata?.isAdmin === true;

  // Only allow self or admin
  if (!isAdmin && currentUsername !== username) redirect('/profile');

  const db = createSupabaseAdminClient();

  // Fetch the target profile
  const { data: profileRow, error } = await db
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !profileRow) redirect('/profile');

  const profile = rowToProfile(profileRow as Record<string, unknown>);

  // Fetch admin users for the manager dropdown (only needed when admin is viewing)
  let adminProfiles: Profile[] = [];
  if (isAdmin) {
    const { data: admins } = await db
      .from('profiles')
      .select('*')
      .eq('is_admin', true)
      .eq('active', true)
      .order('last_name');
    adminProfiles = (admins ?? []).map((r) => rowToProfile(r as Record<string, unknown>));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          {currentUsername === username ? 'My Profile' : `${profile.firstName} ${profile.lastName}`}
        </h1>
        <p className="text-sm text-white/60 mt-0.5">
          {currentUsername === username
            ? 'Update your personal information'
            : 'Edit this engineer\'s profile'}
        </p>
      </div>

      <ProfileForm
        profile={profile}
        isSelf={currentUsername === username}
        isAdmin={isAdmin}
        adminProfiles={adminProfiles}
      />
    </div>
  );
}
