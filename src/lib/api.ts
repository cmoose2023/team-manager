import { createSupabaseBrowserClient } from './supabase';
import type { Assessment, Ratings } from './types';

export async function getCurrentUsername(): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return (user.user_metadata?.username as string | undefined) ?? user.email ?? '';
}

// Cookies are sent automatically on same-origin requests — no auth headers needed.

export async function fetchPeriods(): Promise<string[]> {
  const res = await fetch('/api/periods');
  if (!res.ok) throw new Error('Failed to fetch periods');
  const data: { periods: string[] } = await res.json();
  return data.periods;
}

export async function fetchAllAssessmentsForPeriod(period: string): Promise<Assessment[]> {
  const res = await fetch(`/api/assessments?period=${encodeURIComponent(period)}`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Failed to save assessment');
  }
  const body: { item: Assessment } = await res.json();
  return body.item;
}
