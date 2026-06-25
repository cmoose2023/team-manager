'use client';

import { useEffect, useState } from 'react';
import type { SprintResponse } from '@/app/api/jira/sprint/route';
import type { JiraIssue } from '@/lib/jira';

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let color = 'bg-white/10 text-white/60';
  if (lower === 'done' || lower === 'closed' || lower === 'resolved') {
    color = 'bg-green-500/10 text-green-400';
  } else if (lower.includes('progress') || lower === 'in review') {
    color = 'bg-yellow-500/10 text-yellow-400';
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      {status}
    </span>
  );
}

function IssueRow({ issue }: { issue: JiraIssue }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[#e03030] text-sm font-mono shrink-0">{issue.key}</span>
        <span className="text-white/80 text-sm truncate">{issue.summary}</span>
      </div>
      <StatusBadge status={issue.status} />
    </div>
  );
}

export function SprintView() {
  const [data, setData] = useState<SprintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jira/sprint')
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({})) as { detail?: string };
          throw new Error(body.detail ?? 'Failed to fetch sprint data');
        }
        return r.json() as Promise<SprintResponse>;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const sprint = data?.sprint;
  const engineers = data?.engineers ?? [];

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="space-y-6">
      {sprint ? (
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-lg">{sprint.name}</span>
          {sprint.startDate && sprint.endDate && (
            <span className="text-white/50 text-sm">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </span>
          )}
          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full">
            Active
          </span>
        </div>
      ) : (
        <div className="text-white/50 text-sm">No active sprint found.</div>
      )}

      {engineers.map((eng) => (
        <div key={eng.engineerId} className="bg-[#141414] rounded-lg border border-white/10 p-5">
          <h3 className="text-white font-semibold mb-3">{eng.engineerName}</h3>
          {eng.issues.length === 0 ? (
            <p className="text-white/40 text-sm">No tickets assigned in this sprint.</p>
          ) : (
            <div>
              {eng.issues.map((issue) => (
                <IssueRow key={issue.key} issue={issue} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
