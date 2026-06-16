'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Users, CheckCircle } from 'lucide-react';
import type { TestSession } from '@/lib/types';

export default function GroupTestingPage() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/group-testing');
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading sessions: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-brand-grey-dark">Group Testing Sessions</h1>
        <Link
          href="/group-testing/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <Plus size={18} />
          New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-brand-grey mb-4">No testing sessions scheduled yet.</p>
          <Link
            href="/group-testing/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Schedule First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/group-testing/${session.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-brand-grey-dark truncate">
                      {session.title}
                    </h2>
                    {session.signedOff && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle size={12} />
                        Signed Off
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-brand-grey">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(session.scheduledDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} />
                      {session.attendees.length} attendee{session.attendees.length !== 1 ? 's' : ''}
                    </span>
                    {session.ticketRef && (
                      <span className="text-brand-grey-dark">Ticket: {session.ticketRef}</span>
                    )}
                  </div>

                  {session.goal && (
                    <p className="mt-2 text-sm text-brand-grey-dark line-clamp-2">{session.goal}</p>
                  )}
                </div>

                <div className="ml-4 text-brand-red">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
