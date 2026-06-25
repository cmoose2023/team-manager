import { getAuth } from '@/lib/auth';
import { ENGINEERS } from '@/lib/engineers';
import { getActiveSprint, searchIssues, type JiraIssue, type JiraSprint } from '@/lib/jira';

export interface EngineerSprintData {
  engineerId: string;
  engineerName: string;
  issues: JiraIssue[];
}

export interface SprintResponse {
  sprint: JiraSprint | null;
  engineers: EngineerSprintData[];
}

export async function GET(): Promise<Response> {
  try {
    await getAuth().then((auth) => {
      if (!auth.isAdmin) throw new Error('forbidden');
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'forbidden') return Response.json({ error: 'Forbidden' }, { status: 403 });
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const boardId = Number(process.env.JIRA_BOARD_ID);
  if (!boardId) return Response.json({ error: 'JIRA_BOARD_ID not configured' }, { status: 500 });

  try {
    const sprint = await getActiveSprint(boardId);

    const engineersWithJira = ENGINEERS.filter((e) => e.jiraAccountId);
    let engineers: EngineerSprintData[] = engineersWithJira.map((e) => ({
      engineerId: e.id,
      engineerName: e.name,
      issues: [],
    }));

    if (sprint && engineersWithJira.length > 0) {
      const accountIds = engineersWithJira.map((e) => `"${e.jiraAccountId}"`).join(',');
      const jql = `sprint in openSprints() AND assignee in (${accountIds}) ORDER BY assignee ASC, status ASC`;
      const issues = await searchIssues(jql);

      engineers = engineersWithJira.map((e) => ({
        engineerId: e.id,
        engineerName: e.name,
        issues: issues.filter((i) => i.assigneeAccountId === e.jiraAccountId),
      }));
    }

    return Response.json({ sprint, engineers } satisfies SprintResponse);
  } catch (e) {
    console.error('GET /api/jira/sprint error:', e);
    return Response.json({ error: 'Failed to fetch Jira sprint data' }, { status: 500 });
  }
}
