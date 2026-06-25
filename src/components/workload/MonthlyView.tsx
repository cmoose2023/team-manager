'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthlyEngineerData } from '@/app/api/jira/monthly/route';
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

function IssueList({ issues, label }: { issues: JiraIssue[]; label: string }) {
  if (issues.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-2">
        {label} ({issues.length})
      </p>
      {issues.map((issue) => (
        <div
          key={issue.key}
          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 gap-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[#e03030] text-sm font-mono shrink-0">{issue.key}</span>
            <span className="text-white/80 text-sm truncate">{issue.summary}</span>
          </div>
          <StatusBadge status={issue.status} />
        </div>
      ))}
    </div>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthlyView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [engineers, setEngineers] = useState<MonthlyEngineerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/jira/monthly?year=${year}&month=${month}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch monthly data');
        return r.json() as Promise<{ engineers: MonthlyEngineerData[] }>;
      })
      .then((d) => setEngineers(d.engineers))
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const futureYear = month === 12 ? year + 1 : year;
    const futureMonth = month === 12 ? 1 : month + 1;
    if (futureYear > now.getFullYear() || (futureYear === now.getFullYear() && futureMonth > now.getMonth() + 1)) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-semibold text-lg min-w-[160px] text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : (
        engineers.map((eng) => (
          <div key={eng.engineerId} className="bg-[#141414] rounded-lg border border-white/10 p-5">
            <h3 className="text-white font-semibold mb-4">{eng.engineerName}</h3>
            {eng.inFlight.length === 0 && eng.completed.length === 0 ? (
              <p className="text-white/40 text-sm">No ticket activity this month.</p>
            ) : (
              <>
                <IssueList issues={eng.inFlight} label="In Flight" />
                <IssueList issues={eng.completed} label="Completed" />
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
