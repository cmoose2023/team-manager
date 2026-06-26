import Link from 'next/link';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import type { Profile, EngineerLevel } from '@/lib/types';

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
    level: (row.level as EngineerLevel | null) ?? null,
    jiraAccountId: (row.jira_account_id as string | null) ?? null,
    isAdmin: row.is_admin as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const LEVEL_LABELS: Record<string, string> = {
  SENIOR_IC: 'Senior IC',
  PRINCIPAL_IC: 'Principal IC',
};

export default async function MyTeamPage() {
  const db = createSupabaseAdminClient();

  const [{ data: engineerRows }, { data: adminRows }] = await Promise.all([
    db.from('profiles').select('*').eq('is_admin', false).order('last_name'),
    db.from('profiles').select('username, first_name, last_name').eq('is_admin', true),
  ]);

  const engineers = (engineerRows ?? []).map((r) => rowToProfile(r as Record<string, unknown>));
  const adminMap = Object.fromEntries(
    (adminRows ?? []).map((a) => [
      a.username as string,
      `${a.first_name as string} ${a.last_name as string}`.trim(),
    ]),
  );

  const active = engineers.filter((e) => e.active);
  const inactive = engineers.filter((e) => !e.active);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">My Team</h1>
        <p className="text-sm text-white/60 mt-0.5">{active.length} active engineers</p>
      </div>

      <EngineerTable engineers={active} adminMap={adminMap} />

      {inactive.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">
            Inactive
          </h2>
          <EngineerTable engineers={inactive} adminMap={adminMap} dimmed />
        </div>
      )}
    </div>
  );
}

function EngineerTable({
  engineers,
  adminMap,
  dimmed,
}: {
  engineers: Profile[];
  adminMap: Record<string, string>;
  dimmed?: boolean;
}) {
  if (engineers.length === 0) return null;

  return (
    <div className={['rounded-lg border border-white/10 overflow-hidden', dimmed ? 'opacity-60' : ''].join(' ')}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#141414] border-b border-white/10">
            <th className="text-left px-5 py-3 font-semibold text-white/60 w-[22%]">Name</th>
            <th className="text-left px-5 py-3 font-semibold text-white/60 w-[18%]">Title</th>
            <th className="text-left px-5 py-3 font-semibold text-white/60 w-[14%]">Level</th>
            <th className="text-left px-5 py-3 font-semibold text-white/60 w-[18%]">Manager</th>
            <th className="text-left px-5 py-3 font-semibold text-white/60 w-[14%]">Start Date</th>
            <th className="px-5 py-3 w-[14%]" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {engineers.map((eng) => (
            <tr key={eng.username} className="bg-[#0a0a0a] hover:bg-[#141414] transition-colors">
              <td className="px-5 py-4">
                <p className="font-medium text-white">
                  {`${eng.firstName} ${eng.lastName}`.trim()}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{eng.username}</p>
              </td>
              <td className="px-5 py-4 text-white/70">{eng.title ?? <Dash />}</td>
              <td className="px-5 py-4">
                {eng.level ? (
                  <span
                    className={[
                      'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
                      eng.level === 'PRINCIPAL_IC'
                        ? 'bg-[#e03030] text-white'
                        : 'bg-white/10 text-white/70',
                    ].join(' ')}
                  >
                    {LEVEL_LABELS[eng.level] ?? eng.level}
                  </span>
                ) : (
                  <Dash />
                )}
              </td>
              <td className="px-5 py-4 text-white/70">
                {eng.manager ? (adminMap[eng.manager] ?? eng.manager) : <Dash />}
              </td>
              <td className="px-5 py-4 text-white/70">
                {eng.startDate
                  ? new Date(eng.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : <Dash />}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/profile/${eng.username}`}
                  className="text-xs font-medium text-[#e03030] hover:underline"
                >
                  View Profile →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dash() {
  return <span className="text-white/25">—</span>;
}
