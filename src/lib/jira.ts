// Server-only — uses process.env directly. Never import from client components.

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  issueType: string;
  assigneeAccountId: string | null;
  storyPoints: number | null;
}

function authHeader(): string {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) throw new Error('JIRA_EMAIL and JIRA_API_TOKEN must be set');
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}

function baseUrl(): string {
  const url = process.env.JIRA_BASE_URL;
  if (!url) throw new Error('JIRA_BASE_URL must be set');
  return url.replace(/\/$/, '');
}

async function jiraFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Jira API error ${res.status} on ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getActiveSprint(boardId: number): Promise<JiraSprint | null> {
  const data = await jiraFetch<{ values: JiraSprint[] }>(
    `/rest/agile/1.0/board/${boardId}/sprint?state=active&maxResults=1`,
  );
  return data.values[0] ?? null;
}

export async function getClosedSprints(boardId: number, count = 6): Promise<JiraSprint[]> {
  // Fetch 1 item first to get the total, then page to the end
  const probe = await jiraFetch<{ total: number }>(
    `/rest/agile/1.0/board/${boardId}/sprint?state=closed&maxResults=1`,
  );
  const total = probe.total ?? 0;
  if (total === 0) return [];
  const startAt = Math.max(0, total - count);
  const data = await jiraFetch<{ values: JiraSprint[] }>(
    `/rest/agile/1.0/board/${boardId}/sprint?state=closed&startAt=${startAt}&maxResults=${count}`,
  );
  return [...data.values].reverse(); // newest first
}

// customfield_10016 = "Story Points" (classic projects)
// customfield_10028 = "Story point estimate" (next-gen / team-managed projects)
// customfield_10014 = "Story Points" (some older Jira configurations)
const STORY_POINT_FIELDS = ['customfield_10016', 'customfield_10028', 'customfield_10014'];

function extractStoryPoints(fields: Record<string, unknown>): number | null {
  for (const field of STORY_POINT_FIELDS) {
    const val = fields[field];
    if (typeof val === 'number' && val > 0) return val;
  }
  return null;
}

/** Returns raw Jira response for debugging */
export async function searchIssuesRaw(jql: string, maxResults = 3): Promise<unknown> {
  return jiraFetch<unknown>('/rest/api/3/search/jql', { jql, maxResults });
}

export async function searchIssues(jql: string): Promise<JiraIssue[]> {
  const data = await jiraFetch<{
    issues: Array<{
      key: string;
      fields: Record<string, unknown> & {
        summary: string;
        status: { name: string };
        issuetype: { name: string };
        assignee: { accountId: string } | null;
      };
    }>;
  }>('/rest/api/3/search/jql', {
    jql,
    fields: ['summary', 'status', 'issuetype', 'assignee', 'story_points', ...STORY_POINT_FIELDS],
    maxResults: 200,
  });

  return data.issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    issueType: issue.fields.issuetype.name,
    assigneeAccountId: issue.fields.assignee?.accountId ?? null,
    storyPoints: extractStoryPoints(issue.fields),
  }));
}
