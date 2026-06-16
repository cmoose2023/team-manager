'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Presentation, Calendar, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { KnowledgeShareSession } from '@/lib/types';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  planned: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Circle },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-600', icon: Clock },
  done: { bg: 'bg-green-100', text: 'text-green-600', icon: CheckCircle2 },
};

export default function FeHuddlePage() {
  const [sessions, setSessions] = useState<KnowledgeShareSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/knowledge-share/sessions');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (id: string, status: KnowledgeShareSession['status']) => {
    try {
      const res = await fetch(`/api/knowledge-share/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchSessions();
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E4002B]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Presentation className="text-[#E4002B]" size={28} />
          <h1 className="text-2xl font-semibold text-gray-900">FE Huddle Knowledge Share</h1>
        </div>
        <p className="text-gray-600">Weekly rotation schedule. One engineer. One new idea. Every week.</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/fe-huddle"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E4002B]/10 text-[#E4002B] border border-[#E4002B]/20"
        >
          Rotation Schedule
        </Link>
        <Link
          href="/fe-huddle/backlog"
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-transparent"
        >
          Topic Backlog
        </Link>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Week</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Presenter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.map((session) => {
              const statusStyle = STATUS_STYLES[session.status];
              const StatusIcon = statusStyle.icon;
              
              return (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 text-center">{session.week}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {session.scheduledDate ? (
                      new Date(session.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {session.presenterName || (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {session.topicTitle || (
                      <span className="text-gray-400 italic">No topic selected</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={session.status}
                      onChange={(e) => updateSessionStatus(session.id, e.target.value as KnowledgeShareSession['status'])}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <option value="planned">Planned</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Legend */}
      <div className="mt-4 flex gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Circle size={14} className="text-gray-400" />
          Planned
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-blue-500" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-green-500" />
          Done
        </span>
      </div>

      {/* Backlog Link */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Topic Backlog</h3>
            <p className="text-sm text-gray-600 mt-1">Browse and claim topics for upcoming presentations.</p>
          </div>
          <Link
            href="/fe-huddle/backlog"
            className="flex items-center gap-1 px-4 py-2 bg-[#E4002B] text-white text-sm font-medium rounded-lg hover:bg-[#c40025] transition-colors"
          >
            View Backlog
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
