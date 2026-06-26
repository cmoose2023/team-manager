'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { levelLabel } from '@/lib/matrix';
import { fetchPeriods, fetchProfile, fetchEngineerAssessments, saveAssessment } from '@/lib/api';
import { AssessmentMatrix } from '@/components/AssessmentMatrix';
import { PeriodSelector } from '@/components/PeriodSelector';
import type { Assessment, Profile, Ratings } from '@/lib/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  engineerId: string;
  initialPeriod: string;
}

export function EngineerDetailClient({ engineerId, initialPeriod }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Admin assessment (editable)
  const [adminRatings, setAdminRatings] = useState<Ratings>({});
  const [adminOverallNote, setAdminOverallNote] = useState('');
  const [adminCreatedAt, setAdminCreatedAt] = useState<string | undefined>();

  // Self assessment (read-only)
  const [selfAssessment, setSelfAssessment] = useState<Assessment | null>(null);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    Promise.all([
      fetchPeriods(),
      fetchProfile(engineerId).catch(() => null),
    ]).then(([ps, prof]) => {
      setPeriods(ps);
      setProfile(prof);
      if (!initialPeriod && ps.length > 0) setSelectedPeriod(ps[0]);
    }).catch(console.error);
  }, [initialPeriod, engineerId]);

  const loadAssessments = useCallback(async () => {
    if (!selectedPeriod) return;
    setLoading(true);
    try {
      const { admin, self } = await fetchEngineerAssessments(
        engineerId,
        selectedPeriod,
      );
      setAdminRatings(admin?.ratings ?? {});
      setAdminOverallNote(admin?.overallNote ?? '');
      setAdminCreatedAt(admin?.createdAt);
      setSelfAssessment(self);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    engineerId,
    selectedPeriod,
    setAdminRatings,
    setAdminOverallNote,
    setAdminCreatedAt,
    setSelfAssessment,
    setLoading,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssessments();
  }, [loadAssessments]);

  async function handleSave() {
    if (!selectedPeriod) return;
    setSaveStatus('saving');
    try {
      await saveAssessment(engineerId, {
        period: selectedPeriod,
        assessorType: 'admin',
        ratings: adminRatings,
        overallNote: adminOverallNote || undefined,
        createdAt: adminCreatedAt,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-brand-grey mb-3">Engineer not found.</p>
        <Link
          href="/admin"
          className="text-sm text-brand-red hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isPrincipal = profile.level === 'PRINCIPAL_IC';
  const engineerName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin"
            className="text-sm text-brand-grey hover:text-brand-red transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300 select-none">|</span>
          <h1 className="text-xl font-semibold text-brand-grey-dark">
            {engineerName}
          </h1>
          <span
            className={[
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              isPrincipal
                ? 'bg-brand-red text-white'
                : 'bg-brand-grey-light text-brand-grey',
            ].join(' ')}
          >
            {levelLabel(profile.level ?? 'SENIOR_IC')}
          </span>
        </div>

        <PeriodSelector
          periods={periods}
          selected={selectedPeriod}
          onChange={setSelectedPeriod}
        />
      </div>

      {/* Two-panel layout */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Admin panel (editable) ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-brand-grey-dark">
                Manager Assessment
              </h2>
              <SaveButton status={saveStatus} onClick={handleSave} />
            </div>

            <AssessmentMatrix
              level={profile.level ?? 'SENIOR_IC'}
              ratings={adminRatings}
              mode="admin-edit"
              onChange={setAdminRatings}
            />

            <div>
              <label className="block text-sm font-medium text-brand-grey-dark mb-1.5">
                Overall notes
              </label>
              <textarea
                value={adminOverallNote}
                onChange={(e) => setAdminOverallNote(e.target.value)}
                rows={3}
                placeholder="Add a summary or overall performance note…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end">
              <SaveButton status={saveStatus} onClick={handleSave} />
            </div>
          </div>

          {/* ── Self-assessment panel (read-only) ─────────────────────── */}
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-brand-grey-dark">
              Self-Assessment
            </h2>

            {selfAssessment ? (
              <>
                <AssessmentMatrix
                  level={profile.level ?? 'SENIOR_IC'}
                  ratings={selfAssessment.ratings}
                  mode="view"
                />
                {selfAssessment.overallNote && (
                  <div className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3">
                    <p className="text-xs font-semibold text-brand-grey mb-1">
                      Overall note
                    </p>
                    <p className="text-sm text-brand-grey-dark">
                      {selfAssessment.overallNote}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center py-16 px-6 text-center">
                <p className="text-sm text-brand-grey">
                  No self-assessment submitted yet for this period.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal sub-components ────────────────────────────────────────────────────

function SaveButton({
  status,
  onClick,
}: {
  status: SaveStatus;
  onClick: () => void;
}) {
  const labels: Record<SaveStatus, string> = {
    idle: 'Save Assessment',
    saving: 'Saving…',
    saved: '✓ Saved',
    error: 'Error — retry',
  };

  return (
    <button
      onClick={onClick}
      disabled={status === 'saving'}
      className={[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50',
        status === 'saved'
          ? 'bg-rating-green text-white'
          : status === 'error'
            ? 'bg-rating-red text-white'
            : 'bg-brand-red hover:bg-brand-red-hover text-white',
      ].join(' ')}
    >
      {labels[status]}
    </button>
  );
}

function SkeletonPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
      <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
