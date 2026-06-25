import { getAuth } from '@/lib/auth';
import { ENGINEERS } from '@/lib/engineers';
import { getClosedSprints, searchIssues } from '@/lib/jira';

export interface VelocityEngineerEntry {
  engineerId: string;
  engineerName: string;
  points: number;
}

export interface VelocitySprintEntry {
  sprintId: number;
  sprintName: string;
  engineers: VelocityEngineerEntry[];
  totalPoints: number;
}

export async function GET(): Promise<Response> {
  let auth;
  try {
    auth = await getAuth();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!auth.isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const boardId = Number(process.env.JIRA_BOARD_ID);
  if (!boardId) return Response.json({ error: 'JIRA_BOARD_ID not configured' }, { status: 500 });

  const engineersWithJira = ENGINEERS.filter((e) => e.jiraAccountId);
  if (engineersWithJira.length === 0) {
    return Response.json({ sprints: [] });
  }

  try {
    const sprints = await getClosedSprints(boardId, 6);
    const accountIds = engineersWithJira.map((e) => `"${e.jiraAccountId}"`).join(',');

    const velocityData: VelocitySprintEntry[] = await Promise.all(
      sprints.map(async (sprint) => {
        const jql = `sprint = ${sprint.id} AND assignee in (${accountIds})`;
        const issues = await searchIssues(jql);

        const engineers: VelocityEngineerEntry[] = engineersWithJira.map((e) => {
          const mine = issues.filter((i) => i.assigneeAccountId === e.jiraAccountId);
          const points = mine.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
          return { engineerId: e.id, engineerName: e.name, points };
        });

        const totalPoints = engineers.reduce((sum, e) => sum + e.points, 0);
        return { sprintId: sprint.id, sprintName: sprint.name, engineers, totalPoints };
      }),
    );

    return Response.json({ sprints: velocityData });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('GET /api/jira/velocity error:', detail);
    return Response.json({ error: 'Failed to fetch Jira velocity data', detail }, { status: 500 });
  }
}
