'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Presentation, ChevronLeft, Lightbulb, GitBranch, Sparkles, CalendarPlus, Plus, X } from 'lucide-react';
import { KnowledgeShareBacklog, KnowledgeShareSession } from '@/lib/types';

const CATEGORIES = [
  'AI Tools & Workflows',
  'Frontend Concepts & Deep Dives',
  'Workflows & Engineering Practice',
];

const CATEGORY_ICONS: Record<string, typeof Lightbulb> = {
  'AI Tools & Workflows': Sparkles,
  'Frontend Concepts & Deep Dives': Lightbulb,
  'Workflows & Engineering Practice': GitBranch,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'AI Tools & Workflows': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  'Frontend Concepts & Deep Dives': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  'Workflows & Engineering Practice': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
};

interface NewTopicForm {
  category: string;
  title: string;
  description: string;
}

const EMPTY_FORM: NewTopicForm = { category: CATEGORIES[0], title: '', description: '' };

export default function BacklogPage() {
  const [backlog, setBacklog]     = useState<KnowledgeShareBacklog[]>([]);
  const [sessions, setSessions]   = useState<KnowledgeShareSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState<NewTopicForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [backlogRes, sessionsRes] = await Promise.all([
        fetch('/api/knowledge-share/backlog'),
        fetch('/api/knowledge-share/sessions'),
      ]);
      if (backlogRes.ok)  setBacklog((await backlogRes.json()).backlog || []);
      if (sessionsRes.ok) setSessions((await sessionsRes.json()).sessions || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const submitNewTopic = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/knowledge-share/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:    form.category,
          title:       form.title.trim(),
          description: form.description.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'Failed to add topic');
      }
      closeModal();
      await fetchAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add topic');
    } finally {
      setSubmitting(false);
    }
  };

  // Group by category
  const groupedBacklog = backlog.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeShareBacklog[]>);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e03030]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Presentation className="text-[#e03030]" size={28} />
            <h1 className="text-2xl font-semibold text-white">Topic Backlog</h1>
          </div>
          <p className="text-white/60">
            A running list to pull from. Mix categories week to week so it doesn&apos;t become all-AI or all-deep-dives in a row.
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#e03030] text-white text-sm font-medium rounded-lg hover:bg-[#c02525] transition-colors shrink-0 mt-1"
        >
          <Plus size={16} />
          Add Topic
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/fe-huddle"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 border border-transparent"
        >
          Rotation Schedule
        </Link>
        <Link
          href="/fe-huddle/backlog"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#e03030]/10 text-[#e03030] border border-[#e03030]/20"
        >
          Topic Backlog
        </Link>
      </div>

      {/* Backlog by Category */}
      <div className="space-y-8">
        {Object.entries(groupedBacklog).map(([category, items]) => {
          const colors = CATEGORY_COLORS[category] || { bg: 'bg-[#141414]', border: 'border-white/10', text: 'text-white/70' };
          const Icon = CATEGORY_ICONS[category] || Lightbulb;

          return (
            <div key={category}>
              <div className={`flex items-center gap-2 mb-4 ${colors.text}`}>
                <Icon size={20} />
                <h2 className="text-lg font-semibold">{category}</h2>
                <span className="text-sm text-white/40">({items.length})</span>
              </div>

              <div className="grid gap-3">
                {items.map((item) => {
                  const assignedSession = sessions.find((s) => s.backlogId === item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          <p className="text-sm mt-1 text-white/60">{item.description}</p>

                          {assignedSession && (
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <CalendarPlus size={14} className="text-green-400" />
                              <span className="text-green-400 font-medium">
                                Scheduled for Week {assignedSession.week}
                                {assignedSession.scheduledDate && (
                                  <span className="text-green-500/70 font-normal">
                                    {' '}({new Date(assignedSession.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {backlog.length === 0 && (
        <div className="text-center py-12 text-white/50">
          <Lightbulb size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-lg font-medium text-white">No topics in the backlog</p>
          <p className="text-sm mt-1 text-white/40">Add the first topic using the button above.</p>
        </div>
      )}

      {/* Back to Schedule */}
      <div className="mt-8">
        <Link
          href="/fe-huddle"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-[#e03030] transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Rotation Schedule
        </Link>
      </div>

      {/* Add Topic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-xl shadow-2xl w-full max-w-lg border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Add New Topic</h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 bg-[#0a0a0a] text-white text-sm focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Web Components from scratch"
                  className="w-full border border-white/20 rounded-lg px-3 py-2 bg-[#0a0a0a] text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A short summary of what will be covered"
                  rows={3}
                  className="w-full border border-white/20 rounded-lg px-3 py-2 bg-[#0a0a0a] text-white text-sm placeholder:text-white/30 focus:ring-2 focus:ring-[#e03030] focus:border-[#e03030] focus:outline-none resize-none"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitNewTopic}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#e03030] rounded-lg hover:bg-[#c02525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding…' : 'Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
