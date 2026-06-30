'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { levelLabel } from '@/lib/matrix';
import {
  getCurrentUsername,
  fetchPeriods,
  fetchProfile,
  fetchEngineerAssessments,
  saveAssessment,
} from '@/lib/api';
import { AssessmentMatrix } from '@/components/AssessmentMatrix';
import { PeriodSelector } from '@/components/PeriodSelector';
import type { Assessment, Profile, Ratings } from '@/lib/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  initialPeriod: string;
}

export function SelfAssessmentClient({ initialPeriod }: Props) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Admin assessment — used to show manager's notes as context
  const [adminAssessment, setAdminAssessment] = useState<Assessment | null>(
    null,
  );

  // Self-assessment (editable)
  const [selfRatings, setSelfRatings] = useState<Ratings>({});
  const [selfOverallNote, setSelfOverallNote] = useState('');
  const [selfCreatedAt, setSelfCreatedAt] = useState<string | undefined>();

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Bootstrap: username + periods + profile
  useEffect(() => {
    async function init() {
      try {
        const uname = await getCurrentUsername();
        setUsername(uname);
        const [ps, prof] = await Promise.all([
          fetchPeriods(),
          fetchProfile(uname).catch(() => null),
        ]);
        setPeriods(ps);
        setProfile(prof);
        if (!initialPeriod && ps.length > 0) setSelectedPeriod(ps[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, [initialPeriod]);

  // Load assessments when username + period are ready
  const loadAssessments = useCallback(async () => {
    if (!username || !selectedPeriod) return;
    setLoadingAssessments(true);
    try {
      const { admin, self } = await fetchEngineerAssessments(
        username,
        selectedPeriod,
      );
      setAdminAssessment(admin);
      setSelfRatings(self?.ratings ?? {});
      setSelfOverallNote(self?.overallNote ?? '');
      setSelfCreatedAt(self?.createdAt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssessments(false);
    }
  }, [username, selectedPeriod]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssessments();
  }, [loadAssessments]);

  async function handleSave() {
    if (!username || !selectedPeriod) return;
    setSaveStatus('saving');
    try {
      await saveAssessment(username, {
        period: selectedPeriod,
        assessorType: 'self',
        ratings: selfRatings,
        overallNote: selfOverallNote || undefined,
        createdAt: selfCreatedAt,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  }

  const isLoading = loadingInit || loadingAssessments;
  const isPrincipal = profile?.level === 'PRINCIPAL_IC';

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="text-sm text-brand-grey hover:text-brand-red transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300 select-none">|</span>
          <h1 className="text-xl font-semibold text-brand-grey-dark">
            Self-Assessment
          </h1>
          {profile?.level && (
            <span
              className={[
                'text-xs font-semibold px-2.5 py-1 rounded-full',
                isPrincipal
                  ? 'bg-brand-red text-white'
                  : 'bg-brand-grey-light text-brand-grey',
              ].join(' ')}
            >
              {levelLabel(profile.level)}
            </span>
          )}
        </div>

        {!loadingInit && (
          <PeriodSelector
            periods={periods}
            selected={selectedPeriod}
            onChange={setSelectedPeriod}
          />
        )}
      </div>

      {/* Context banner if admin assessment exists */}
      {!isLoading && adminAssessment && (
        <div className="mb-5 rounded-md bg-rating-yellow-light border border-rating-yellow px-4 py-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Manager feedback is available.</span>{' '}
            Your manager&apos;s notes are shown inline with each criterion as
            context for your self-reflection.
          </p>
        </div>
      )}

      {/* No admin assessment notice */}
      {!isLoading && !adminAssessment && selectedPeriod && (
        <div className="mb-5 rounded-md bg-gray-50 border border-gray-200 px-4 py-3">
          <p className="text-sm text-brand-grey">
            Your manager hasn&apos;t submitted an assessment for this period yet.
            You can still complete your self-assessment.
          </p>
        </div>
      )}

      {/* Matrix + form */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      ) : !selectedPeriod || !profile?.level ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-brand-grey">
            Select a review period to begin your self-assessment.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-3">
            <SaveButton status={saveStatus} onClick={handleSave} />
          </div>

          <AssessmentMatrix
            level={profile.level}
            ratings={selfRatings}
            adminRatings={adminAssessment?.ratings}
            mode="self-edit"
            onChange={setSelfRatings}
          />

          {/* Overall note */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-brand-grey-dark mb-1.5">
              Overall reflection
            </label>
            <textarea
              value={selfOverallNote}
              onChange={(e) => setSelfOverallNote(e.target.value)}
              rows={4}
              placeholder="Summarize your overall performance, growth areas, or anything you want your manager to know…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end mt-4 gap-3">
            <Link
              href={`/dashboard?period=${encodeURIComponent(selectedPeriod)}`}
              className="px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-colors"
            >
              Back to Dashboard
            </Link>
            <SaveButton status={saveStatus} onClick={handleSave} />
          </div>
        </>
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
