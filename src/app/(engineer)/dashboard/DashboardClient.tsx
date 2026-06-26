'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { levelLabel } from '@/lib/matrix';
import {
  getCurrentUsername,
  fetchPeriods,
  fetchProfile,
  fetchEngineerAssessments,
} from '@/lib/api';
import type { Profile } from '@/lib/types';

import { AssessmentMatrix } from '@/components/AssessmentMatrix';
import { PeriodSelector } from '@/components/PeriodSelector';
import type { Assessment } from '@/lib/types';

interface Props {
  initialPeriod: string;
}

export function DashboardClient({ initialPeriod }: Props) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [adminAssessment, setAdminAssessment] = useState<Assessment | null>(
    null,
  );
  const [selfAssessment, setSelfAssessment] = useState<Assessment | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  // Bootstrap: get username + periods + profile
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
      setSelfAssessment(self);
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

  const isLoading = loadingInit || loadingAssessments;
  const isPrincipal = profile?.level === 'PRINCIPAL_IC';
  const engineerName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-2xl font-semibold text-white">
              My Assessments
            </h1>
            {profile?.level && (
              <span
                className={[
                  'text-xs font-semibold px-2.5 py-1 rounded-full',
                  isPrincipal
                    ? 'bg-[#e03030] text-white'
                    : 'bg-white/10 text-white/70',
                ].join(' ')}
              >
                {levelLabel(profile.level)}
              </span>
            )}
          </div>
          {engineerName && (
            <p className="text-sm text-white/60">{engineerName}</p>
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

      {/* No periods */}
      {!loadingInit && periods.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-white/20 py-16 text-center">
          <p className="text-white font-medium mb-1">
            No assessments available yet
          </p>
          <p className="text-sm text-white/60">
            Your manager hasn&apos;t created an assessment period yet.
          </p>
        </div>
      )}

      {/* Content: two stacked sections */}
      {(periods.length > 0 || isLoading) && (
        <div className="flex flex-col gap-8">
          {/* ── Manager Assessment ─────────────────────────────────────────── */}
          <section>
            <SectionHeader title="Manager Assessment" />
            {isLoading ? (
              <SkeletonMatrix />
            ) : adminAssessment && profile?.level ? (
              <>
                <AssessmentMatrix
                  level={profile.level}
                  ratings={adminAssessment.ratings}
                  mode="view"
                />
                {adminAssessment.overallNote && (
                  <div className="mt-3 bg-[#141414] rounded-lg border border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-white/60 mb-1">
                      Overall note
                    </p>
                    <p className="text-sm text-white">
                      {adminAssessment.overallNote}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="Your manager hasn't submitted an assessment for this period yet." />
            )}
          </section>

          {/* ── Your Self-Assessment ───────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Your Self-Assessment"
              action={
                selectedPeriod && (
                  <Link
                    href={`/dashboard/self-assessment?period=${encodeURIComponent(selectedPeriod)}`}
                    className="text-sm font-medium text-brand-red hover:underline"
                  >
                    {selfAssessment ? 'Edit →' : 'Start →'}
                  </Link>
                )
              }
            />
            {isLoading ? (
              <SkeletonMatrix />
            ) : selfAssessment && profile?.level ? (
              <>
                <AssessmentMatrix
                  level={profile.level}
                  ratings={selfAssessment.ratings}
                  mode="view"
                />
                {selfAssessment.overallNote && (
                  <div className="mt-3 bg-[#141414] rounded-lg border border-white/10 px-4 py-3">
                    <p className="text-xs font-semibold text-white/60 mb-1">
                      Overall note
                    </p>
                    <p className="text-sm text-white">
                      {selfAssessment.overallNote}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="You haven't submitted a self-assessment for this period yet.">
                {selectedPeriod && (
                  <Link
                    href={`/dashboard/self-assessment?period=${encodeURIComponent(selectedPeriod)}`}
                    className="mt-3 inline-block px-4 py-2 bg-[#e03030] hover:bg-[#c02525] text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Start Self-Assessment
                  </Link>
                )}
              </EmptyState>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ── Internal sub-components ────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-white/10">
      <h2 className="font-semibold text-white">{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-white/20 py-10 text-center">
      <p className="text-sm text-white/60">{text}</p>
      {children}
    </div>
  );
}

function SkeletonMatrix() {
  return <div className="h-64 bg-[#141414] rounded-lg animate-pulse" />;
}
