'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENGINEERS } from '@/lib/engineers';
import { fetchPeriods, fetchAllAssessmentsForPeriod } from '@/lib/api';
import { EngineerCard } from '@/components/EngineerCard';
import { PeriodSelector } from '@/components/PeriodSelector';
import type { Assessment } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();

  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [error, setError] = useState('');

  // Load periods on mount
  useEffect(() => {
    fetchPeriods()
      .then((ps) => {
        setPeriods(ps);
        if (ps.length > 0) setSelectedPeriod(ps[0]);
      })
      .catch(() => setError('Failed to load periods.'))
      .finally(() => setLoadingPeriods(false));
  }, []);

  // Load assessments when selected period changes
  useEffect(() => {
    if (!selectedPeriod) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssessments([]);
      return;
    }
    setLoadingAssessments(true);
    setError('');
    fetchAllAssessmentsForPeriod(selectedPeriod)
      .then(setAssessments)
      .catch(() => setError('Failed to load assessments.'))
      .finally(() => setLoadingAssessments(false));
  }, [selectedPeriod]);

  function getAssessment(
    engineerId: string,
    type: 'admin' | 'self',
  ): Assessment | null {
    return (
      assessments.find(
        (a) => a.engineerId === engineerId && a.assessorType === type,
      ) ?? null
    );
  }

  function handleCreatePeriod(period: string) {
    setPeriods((prev) => {
      const next = [period, ...prev.filter((p) => p !== period)].sort((a, b) =>
        b.localeCompare(a),
      );
      return next;
    });
    setSelectedPeriod(period);
    setAssessments([]);
  }

  const isLoading = loadingPeriods || loadingAssessments;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Team Assessments
          </h1>
          {selectedPeriod && (
            <p className="text-sm text-white/60 mt-0.5">
              {ENGINEERS.length} engineers · {selectedPeriod}
            </p>
          )}
        </div>

        {!loadingPeriods && (
          <PeriodSelector
            periods={periods}
            selected={selectedPeriod}
            onChange={setSelectedPeriod}
            canCreate
            onCreatePeriod={handleCreatePeriod}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-[#e03030] bg-[#e03030]/10 rounded-md px-4 py-2 mb-6">
          {error}
        </p>
      )}

      {/* No periods yet */}
      {!loadingPeriods && periods.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-white/20 py-16 text-center">
          <p className="text-white font-medium mb-1">
            No assessment periods yet
          </p>
          <p className="text-sm text-white/60">
            Create a period (e.g. 2026-Q2) using the selector above to get
            started.
          </p>
        </div>
      )}

      {/* Engineer grid */}
      {(periods.length > 0 || isLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ENGINEERS.map((engineer) =>
            isLoading ? (
              <div
                key={engineer.id}
                className="h-52 bg-[#141414] rounded-lg animate-pulse"
              />
            ) : (
              <EngineerCard
                key={engineer.id}
                engineer={engineer}
                period={selectedPeriod}
                adminAssessment={getAssessment(engineer.id, 'admin')}
                selfAssessment={getAssessment(engineer.id, 'self')}
                onClick={() =>
                  router.push(
                    `/admin/engineer/${engineer.id}?period=${encodeURIComponent(selectedPeriod)}`,
                  )
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
