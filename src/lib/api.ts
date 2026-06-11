import { fetchAuthSession } from 'aws-amplify/auth';
import type { Assessment, Ratings } from './types';

export async function getCurrentUsername(): Promise<string> {
  const session = await fetchAuthSession();
  const username = session.tokens?.accessToken?.payload['username'] as
    | string
    | undefined;
  if (!username) throw new Error('Not authenticated');
  return username;
}

async function authHeaders(): Promise<HeadersInit> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) throw new Error('Session expired — please sign in again.');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchPeriods(): Promise<string[]> {
  const res = await fetch('/api/periods', { headers: await authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch periods');
  const data: { periods: string[] } = await res.json();
  return data.periods;
}

export async function fetchAllAssessmentsForPeriod(period: string): Promise<Assessment[]> {
  const res = await fetch(
    `/api/assessments?period=${encodeURIComponent(period)}`,
    { headers: await authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to fetch assessments');
  const data: { items: Assessment[] } = await res.json();
  return data.items;
}

export async function fetchEngineerAssessments(
  engineerId: string,
  period: string,
): Promise<{ admin: Assessment | null; self: Assessment | null }> {
  const res = await fetch(
    `/api/assessments/${encodeURIComponent(engineerId)}?period=${encodeURIComponent(period)}`,
    { headers: await authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to fetch assessment');
  return res.json();
}

export async function saveAssessment(
  engineerId: string,
  data: {
    period: string;
    assessorType: 'admin' | 'self';
    ratings: Ratings;
    overallNote?: string;
    createdAt?: string;
  },
): Promise<Assessment> {
  const res = await fetch(`/api/assessments/${encodeURIComponent(engineerId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Failed to save assessment');
  }
  const body: { item: Assessment } = await res.json();
  return body.item;
}
