'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  X,
  Minus,
  ChevronLeft,
  Calendar,
  Users,
  Ticket,
  Target,
  FileText,
  Signature,
} from 'lucide-react';
import type { TestSessionDetail, TestResultStatus, TestCase, TestPermutation } from '@/lib/types';

const STATUS_CONFIG: Record<
  TestResultStatus,
  { label: string; icon: React.ComponentType<{ size?: number }>; color: string; bg: string }
> = {
  pending: { label: 'Pending', icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' },
  pass: { label: 'Pass', icon: Check, color: 'text-green-600', bg: 'bg-green-100' },
  fail: { label: 'Fail', icon: X, color: 'text-red-600', bg: 'bg-red-100' },
  skip: { label: 'Skip', icon: Minus, color: 'text-amber-600', bg: 'bg-amber-100' },
};

const STATUS_ORDER: TestResultStatus[] = ['pending', 'pass', 'fail', 'skip'];

export default function SessionRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TestSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [isCreator, setIsCreator] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/group-testing/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      const data = await res.json();
      setSession(data.item);
      setIsCreator(data.item.createdBy === data.currentUser);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const getResult = (testCaseId: string, permutationId: string): TestResultStatus => {
    if (!session) return 'pending';
    const result = session.results.find(
      (r) => r.testCaseId === testCaseId && r.permutationId === permutationId,
    );
    return result?.status ?? 'pending';
  };

  const cycleStatus = async (testCaseId: string, permutationId: string) => {
    const currentStatus = getResult(testCaseId, permutationId);
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];

    const key = `${testCaseId}-${permutationId}`;
    setUpdating((prev) => new Set(prev).add(key));

    try {
      const res = await fetch(`/api/group-testing/${sessionId}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseId, permutationId, status: nextStatus }),
      });

      if (!res.ok) throw new Error('Failed to update result');

      // Optimistic update
      setSession((prev) => {
        if (!prev) return prev;
        const existingIndex = prev.results.findIndex(
          (r) => r.testCaseId === testCaseId && r.permutationId === permutationId,
        );
        const newResults = [...prev.results];
        const newResult = {
          testCaseId,
          permutationId,
          status: nextStatus,
          updatedBy: 'current-user',
          updatedAt: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          newResults[existingIndex] = newResult;
        } else {
          newResults.push(newResult);
        }
        return { ...prev, results: newResults };
      });
    } catch (err) {
      alert('Failed to update result');
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const toggleSignOff = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/group-testing/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedOff: !session.signedOff }),
      });
      if (!res.ok) throw new Error('Failed to update session');
      setSession((prev) => (prev ? { ...prev, signedOff: !prev.signedOff } : prev));
    } catch {
      alert('Failed to update sign-off status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Session not found'}
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/group-testing"
          className="inline-flex items-center gap-1 text-sm text-brand-grey hover:text-brand-red mb-3"
        >
          <ChevronLeft size={16} />
          Back to Sessions
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-brand-grey-dark">{session.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-brand-grey">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {formatDate(session.scheduledDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                {session.attendees.length} attendee{session.attendees.length !== 1 ? 's' : ''}
              </span>
              {session.ticketRef && (
                <span className="inline-flex items-center gap-1.5">
                  <Ticket size={14} />
                  {session.ticketRef}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session.signedOff && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <Check size={14} />
                Signed Off
              </span>
            )}
            {isCreator && (
              <button
                onClick={toggleSignOff}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-brand-grey-dark rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Signature size={16} />
                {session.signedOff ? 'Unsign' : 'Sign Off'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      {(session.goal || session.notes) && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          {session.goal && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-brand-grey-dark mb-1 flex items-center gap-1.5">
                <Target size={14} />
                Goal
              </h3>
              <p className="text-sm text-brand-grey">{session.goal}</p>
            </div>
          )}
          {session.notes && (
            <div>
              <h3 className="text-sm font-semibold text-brand-grey-dark mb-1 flex items-center gap-1.5">
                <FileText size={14} />
                Notes
              </h3>
              <p className="text-sm text-brand-grey">{session.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Test Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-brand-grey-dark uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                  Test Case
                </th>
                {session.permutations.map((perm) => (
                  <th
                    key={perm.id}
                    className="px-3 py-3 text-center text-xs font-semibold text-brand-grey-dark uppercase tracking-wider min-w-[100px]"
                  >
                    <div>{perm.label}</div>
                    <div className="text-[10px] font-normal text-brand-grey mt-0.5">
                      {perm.channel} · {perm.browser}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {session.testCases.map((testCase) => (
                <tr key={testCase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-brand-grey-dark sticky left-0 bg-white hover:bg-gray-50 z-10 font-medium border-r border-gray-200">
                    {testCase.label}
                  </td>
                  {session.permutations.map((perm) => {
                    const status = getResult(testCase.id, perm.id);
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isUpdating = updating.has(`${testCase.id}-${perm.id}`);
                    return (
                      <td key={perm.id} className="px-2 py-2 text-center">
                        <button
                          onClick={() => cycleStatus(testCase.id, perm.id)}
                          disabled={isUpdating}
                          className={[
                            'w-full py-2 rounded-md flex items-center justify-center transition-colors',
                            config.bg,
                            config.color,
                            isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80',
                          ].join(' ')}
                          title={`Click to cycle status (current: ${config.label})`}
                        >
                          <Icon size={16} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {session.testCases.length === 0 && (
          <div className="text-center py-12 text-brand-grey">
            No test cases defined for this session.
          </div>
        )}

        {session.permutations.length === 0 && (
          <div className="text-center py-12 text-brand-grey">
            No permutations defined for this session.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${config.bg} ${config.color}`}>
                <Icon size={14} />
              </span>
              <span className="text-brand-grey">{config.label}</span>
            </div>
          );
        })}
        <span className="text-brand-grey text-xs ml-auto">Click any cell to cycle through statuses</span>
      </div>
    </div>
  );
}
