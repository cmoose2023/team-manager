'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Presentation, ChevronRight, CheckCircle2, Circle, Clock, Pencil, X, Trash2 } from 'lucide-react';
import { KnowledgeShareSession, KnowledgeShareBacklog } from '@/lib/types';

interface Engineer {
  id: string | null;  // Supabase UUID (null if user not found)
  username: string;   // matches ENGINEERS[].id e.g. 'steven.snyder'
  name: string;
}

interface EditDraft {
  scheduledDate: string;
  engineerId: string;      // Supabase UUID to persist
  engineerUsername: string; // username for select controlled value
  engineerName: string;
  backlogId: string;
  topicTitle: string;
  status: KnowledgeShareSession['status'];
}

const STATUS_STYLES: Record<string, { badge: string; text: string; icon: typeof Circle }> = {
  planned:   { badge: 'bg-white/10 text-white/60',      text: 'text-white/60',  icon: Circle },
  confirmed: { badge: 'bg-blue-500/20 text-blue-400',   text: 'text-blue-400',  icon: Clock },
  done:      { badge: 'bg-green-500/20 text-green-400', text: 'text-green-400', icon: CheckCircle2 },
};

export default function FeHuddlePage() {
  const [sessions, setSessions]     = useState<KnowledgeShareSession[]>([]);
  const [engineers, setEngineers]   = useState<Engineer[]>([]);
  const [backlog, setBacklog]       = useState<KnowledgeShareBacklog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [draft, setDraft]           = useState<EditDraft | null>(null);
  const [saving, setSaving]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [sessRes, engRes, backlogRes] = await Promise.all([
        fetch('/api/knowledge-share/sessions'),
        fetch('/api/knowledge-share/engineers'),
        fetch('/api/knowledge-share/backlog'),
      ]);
      if (sessRes.ok)    setSessions((await sessRes.json()).sessions || []);
      if (engRes.ok)     setEngineers((await engRes.json()).engineers || []);
      if (backlogRes.ok) setBacklog((await backlogRes.json()).backlog || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const startEdit = (session: KnowledgeShareSession, engList: Engineer[]) => {
    const existingEng = engList.find((e) => e.id === session.presenterId);
    setEditingId(session.id);
    setDraft({
      scheduledDate:    session.scheduledDate ?? '',
      engineerId:       session.presenterId ?? '',
      engineerUsername: existingEng?.username ?? '',
      engineerName:     session.presenterName ?? '',
      backlogId:        session.backlogId ?? '',
      topicTitle:       session.topicTitle ?? '',
      status:           session.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveField = async (sessionId: string, patch: Partial<EditDraft>) => {
    if (!draft) return;
    const merged = { ...draft, ...patch };
    setDraft(merged);
    setSaving(true);
    try {
      const res = await fetch(`/api/knowledge-share/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: merged.scheduledDate || null,
          presenterId:   merged.engineerId   || null,
          presenterName: merged.engineerName || null,
          backlogId:     merged.backlogId    || null,
          topicTitle:    merged.topicTitle   || null,
          status:        merged.status,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Error saving session field:', res.status, errBody);
      }
      await fetchAll();
    } catch (err) {
      console.error('Error saving session field:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/knowledge-share/sessions/${sessionId}`, { method: 'DELETE' });
      cancelEdit();
      await fetchAll();
    } catch (err) {
      console.error('Error deleting session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEngineerChange = (sessionId: string, username: string) => {
    const eng = engineers.find((e) => e.username === username);
    saveField(sessionId, {
      engineerId:       eng?.id ?? '',
      engineerUsername: username,
      engineerName:     eng?.name ?? '',
    });
  };

  const handleTopicChange = (sessionId: string, backlogId: string) => {
    const item = backlog.find((b) => b.id === backlogId);
    saveField(sessionId, { backlogId, topicTitle: item?.title ?? '' });
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
          <Presentation className="text-[#e03030]" size={28} />
          <h1 className="text-2xl font-semibold text-white">FE Huddle Knowledge Share</h1>
        </div>
        <p className="text-white/60">Weekly rotation schedule. One engineer. One new idea. Every week.</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/fe-huddle"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#e03030]/10 text-[#e03030] border border-[#e03030]/20"
        >
          Rotation Schedule
        </Link>
        <Link
          href="/fe-huddle/backlog"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 border border-transparent"
        >
          Topic Backlog
        </Link>
      </div>

      {/* Schedule Table */}
      <div className="bg-[#141414] rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider w-14">Week</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider w-40">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider w-44">Presenter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider w-44">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sessions.map((session) => {
              const isEditing = editingId === session.id;
              const statusStyle = STATUS_STYLES[session.status] ?? STATUS_STYLES.planned;
              const StatusIcon = statusStyle.icon;

              if (isEditing && draft) {
                return (
                  <tr key={session.id} className="bg-white/[0.03]">
                    {/* Week */}
                    <td className="px-4 py-3 text-sm font-medium text-white text-center">{session.week}</td>

                    {/* Date picker */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={draft.scheduledDate}
                        onChange={(e) => setDraft({ ...draft, scheduledDate: e.target.value })}
                        onBlur={(e) => saveField(session.id, { scheduledDate: e.target.value })}
                        className="w-full text-sm border border-white/20 rounded-lg px-2 py-1.5 bg-[#0a0a0a] text-white focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none [color-scheme:dark]"
                      />
                    </td>

                    {/* Presenter dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={draft.engineerUsername}
                        onChange={(e) => handleEngineerChange(session.id, e.target.value)}
                        className="w-full text-sm border border-white/20 rounded-lg px-2 py-1.5 bg-[#0a0a0a] text-white focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none"
                      >
                        <option value="">Select engineer…</option>
                        {engineers.map((eng) => (
                          <option key={eng.username} value={eng.username}>{eng.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Topic dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={draft.backlogId}
                        onChange={(e) => handleTopicChange(session.id, e.target.value)}
                        className="w-full text-sm border border-white/20 rounded-lg px-2 py-1.5 bg-[#0a0a0a] text-white focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none"
                      >
                        <option value="">Select topic…</option>
                        {backlog.map((b) => (
                          <option key={b.id} value={b.id}>{b.title}</option>
                        ))}
                      </select>
                    </td>

                    {/* Status + actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={draft.status}
                          onChange={(e) => saveField(session.id, { status: e.target.value as KnowledgeShareSession['status'] })}
                          className="flex-1 text-xs border border-white/20 rounded-lg px-2 py-1.5 bg-[#0a0a0a] text-white focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none"
                        >
                          <option value="planned">Planned</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="done">Done</option>
                        </select>
                        <button
                          onClick={cancelEdit}
                          title="Cancel"
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          title="Clear row"
                          disabled={saving}
                          className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={session.id} className="hover:bg-white/5 group">
                  {/* Week */}
                  <td className="px-4 py-4 text-sm font-medium text-white text-center">{session.week}</td>

                  {/* Date */}
                  <td className="px-4 py-4 text-sm text-white/70">
                    {session.scheduledDate ? (
                      new Date(session.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>

                  {/* Presenter */}
                  <td className="px-4 py-4 text-sm text-white">
                    {session.presenterName || <span className="text-white/30 italic">Not assigned</span>}
                  </td>

                  {/* Topic */}
                  <td className="px-4 py-4 text-sm text-white">
                    {session.topicTitle || <span className="text-white/30 italic">No topic selected</span>}
                  </td>

                  {/* Status + edit button */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.badge}`}>
                        <StatusIcon size={11} />
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      <button
                        onClick={() => startEdit(session, engineers)}
                        title="Edit row"
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Legend */}
      <div className="mt-4 flex gap-6 text-sm text-white/50">
        <span className="flex items-center gap-1.5">
          <Circle size={14} className="text-white/40" />
          Planned
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-blue-400" />
          Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-green-400" />
          Done
        </span>
      </div>

      {/* Backlog Link */}
      <div className="mt-8 p-4 bg-[#141414] rounded-lg border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Topic Backlog</h3>
            <p className="text-sm text-white/60 mt-1">Browse and claim topics for upcoming presentations.</p>
          </div>
          <Link
            href="/fe-huddle/backlog"
            className="flex items-center gap-1 px-4 py-2 bg-[#e03030] text-white text-sm font-medium rounded-lg hover:bg-[#c02525] transition-colors"
          >
            View Backlog
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
