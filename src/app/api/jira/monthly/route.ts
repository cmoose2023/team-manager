import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';
import { ENGINEERS } from '@/lib/engineers';
import { searchIssues, type JiraIssue } from '@/lib/jira';

const DONE_STATUSES = new Set(['Done', 'Closed', 'Resolved', 'Complete', 'Completed']);

export interface MonthlyEngineerData {
  engineerId: string;
  engineerName: string;
  inFlight: JiraIssue[];
  completed: JiraIssue[];
}

export async function GET(request: NextRequest): Promise<Response> {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!auth.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const year = Number(searchParams.get('year'));
  const month = Number(searchParams.get('month')); // 1-based

  if (!year || !month || month < 1 || month > 12) {
    return Response.json({ error: 'year and month query params are required' }, { status: 400 });
  }

  const engineersWithJira = ENGINEERS.filter((e) => e.jiraAccountId);
  if (engineersWithJira.length === 0) {
    return Response.json({ engineers: [] });
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  try {
    const accountIds = engineersWithJira.map((e) => `"${e.jiraAccountId}"`).join(',');
    const jql = `assignee in (${accountIds}) AND updated >= "${startDate}" AND updated <= "${endDate}" ORDER BY updated DESC`;
    const issues = await searchIssues(jql);

    const engineers: MonthlyEngineerData[] = engineersWithJira.map((e) => {
      const mine = issues.filter((i) => i.assigneeAccountId === e.jiraAccountId);
      return {
        engineerId: e.id,
        engineerName: e.name,
        inFlight: mine.filter((i) => !DONE_STATUSES.has(i.status)),
        completed: mine.filter((i) => DONE_STATUSES.has(i.status)),
      };
    });

    return Response.json({ engineers });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('GET /api/jira/monthly error:', detail);
    return Response.json({ error: 'Failed to fetch Jira monthly data', detail }, { status: 500 });
  }
}
