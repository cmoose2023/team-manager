'use client';

import { useEffect, useState } from 'react';
import type { VelocitySprintEntry } from '@/app/api/jira/velocity/route';

export function VelocityView() {
  const [sprints, setSprints] = useState<VelocitySprintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jira/velocity')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch velocity data');
        return r.json() as Promise<{ sprints: VelocitySprintEntry[] }>;
      })
      .then((d) => setSprints(d.sprints))
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
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

  if (sprints.length === 0) {
    return <p className="text-white/50 text-sm">No closed sprints found.</p>;
  }

  const engineerNames = sprints[0]?.engineers.map((e) => e.engineerName) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 pr-6 text-white/50 font-medium">Sprint</th>
            {engineerNames.map((name) => (
              <th key={name} className="text-right py-3 px-4 text-white/50 font-medium whitespace-nowrap">
                {name.split(' ')[0]}
              </th>
            ))}
            <th className="text-right py-3 pl-4 text-white/50 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {[...sprints].reverse().map((sprint) => (
            <tr
              key={sprint.sprintId}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 pr-6 text-white/80 font-medium">{sprint.sprintName}</td>
              {sprint.engineers.map((eng) => (
                <td key={eng.engineerId} className="py-3 px-4 text-right">
                  <span className={eng.points > 0 ? 'text-white' : 'text-white/30'}>
                    {eng.points}
                  </span>
                </td>
              ))}
              <td className="py-3 pl-4 text-right font-semibold text-[#e03030]">
                {sprint.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10">
            <td className="py-3 pr-6 text-white/50 text-xs font-medium uppercase tracking-wide">
              Avg / sprint
            </td>
            {engineerNames.map((name, i) => {
              const avg =
                sprints.length > 0
                  ? Math.round(
                      sprints.reduce((sum, s) => sum + (s.engineers[i]?.points ?? 0), 0) / sprints.length,
                    )
                  : 0;
              return (
                <td key={name} className="py-3 px-4 text-right text-white/50 text-xs">
                  {avg}
                </td>
              );
            })}
            <td className="py-3 pl-4 text-right text-white/50 text-xs">
              {sprints.length > 0
                ? Math.round(sprints.reduce((sum, s) => sum + s.totalPoints, 0) / sprints.length)
                : 0}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
