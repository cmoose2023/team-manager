'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { fetchAllProfiles, fetchAllAssessmentsForPeriod, fetchPeriods } from '@/lib/api';
import { EngineerCard } from '@/components/EngineerCard';
import { PeriodSelector } from '@/components/PeriodSelector';
import { AddEngineerModal } from '@/components/AddEngineerModal';
import type { Assessment, Profile } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();

  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Profile[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load engineers + admin profiles + periods on mount
  useEffect(() => {
    Promise.all([
      fetchAllProfiles('engineer'),
      fetchAllProfiles('admin'),
      fetchPeriods(),
    ])
      .then(([engs, admins, ps]) => {
        setEngineers(engs.filter((e) => e.active));
        setAdminProfiles(admins);
        setPeriods(ps);
        if (ps.length > 0) setSelectedPeriod(ps[0]);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => {
        setLoadingEngineers(false);
        setLoadingPeriods(false);
      });
  }, []);

  // Load assessments when selected period changes
  useEffect(() => {
    if (!selectedPeriod) {
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

  function getAssessment(engineerId: string, type: 'admin' | 'self'): Assessment | null {
    return assessments.find((a) => a.engineerId === engineerId && a.assessorType === type) ?? null;
  }

  function handleCreatePeriod(period: string) {
    setPeriods((prev) =>
      [period, ...prev.filter((p) => p !== period)].sort((a, b) => b.localeCompare(a)),
    );
    setSelectedPeriod(period);
    setAssessments([]);
  }

  async function handleDeactivate(username: string) {
    if (!confirm(`Deactivate ${username}? They will be hidden from the dashboard but their assessment history will be preserved.`)) return;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deactivate');
      setEngineers((prev) => prev.filter((e) => e.username !== username));
    } catch {
      setError('Failed to deactivate engineer.');
    }
  }

  function handleEngineerCreated(profile: Profile) {
    setEngineers((prev) => [...prev, profile]);
    setShowAddModal(false);
  }

  const isLoading = loadingEngineers || loadingPeriods || loadingAssessments;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team Assessments</h1>
          {selectedPeriod && (
            <p className="text-sm text-white/60 mt-0.5">
              {engineers.length} engineers · {selectedPeriod}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#e03030] hover:bg-[#c02525] text-white rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            Add Engineer
          </button>

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
      </div>

      {error && (
        <p className="text-sm text-[#e03030] bg-[#e03030]/10 rounded-md px-4 py-2 mb-6">
          {error}
        </p>
      )}

      {/* No periods yet */}
      {!loadingPeriods && periods.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-white/20 py-16 text-center">
          <p className="text-white font-medium mb-1">No assessment periods yet</p>
          <p className="text-sm text-white/60">
            Create a period (e.g. 2026-Q2) using the selector above to get started.
          </p>
        </div>
      )}

      {/* Engineer grid */}
      {(periods.length > 0 || isLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-52 bg-[#141414] rounded-lg animate-pulse" />
              ))
            : engineers.map((engineer) => (
                <EngineerCard
                  key={engineer.username}
                  profile={engineer}
                  period={selectedPeriod}
                  adminAssessment={getAssessment(engineer.username, 'admin')}
                  selfAssessment={getAssessment(engineer.username, 'self')}
                  isAdmin
                  onClick={() =>
                    router.push(
                      `/admin/engineer/${engineer.username}?period=${encodeURIComponent(selectedPeriod)}`,
                    )
                  }
                  onDeactivate={() => handleDeactivate(engineer.username)}
                />
              ))}
        </div>
      )}

      {showAddModal && (
        <AddEngineerModal
          adminProfiles={adminProfiles}
          onClose={() => setShowAddModal(false)}
          onCreated={handleEngineerCreated}
        />
      )}
    </div>
  );
}
