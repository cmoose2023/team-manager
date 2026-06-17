'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Presentation, ChevronLeft, User, Check, X, Lightbulb, Wrench, GitBranch, Sparkles } from 'lucide-react';
import { KnowledgeShareBacklog } from '@/lib/types';

const CATEGORY_ICONS: Record<string, typeof Lightbulb> = {
  'AI Tools & Workflows': Sparkles,
  'Frontend Concepts & Deep Dives': Lightbulb,
  'Workflows & Engineering Practice': GitBranch,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'AI Tools & Workflows': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  'Frontend Concepts & Deep Dives': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Workflows & Engineering Practice': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
};

export default function BacklogPage() {
  const [backlog, setBacklog] = useState<KnowledgeShareBacklog[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBacklog();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user?.email || '');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchBacklog = async () => {
    try {
      const res = await fetch('/api/knowledge-share/backlog');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBacklog(data.backlog || []);
    } catch (err) {
      console.error('Error fetching backlog:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimTopic = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge-share/backlog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' }),
      });
      if (!res.ok) throw new Error('Failed to claim');
      fetchBacklog();
    } catch (err) {
      console.error('Error claiming topic:', err);
    }
  };

  const unclaimTopic = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge-share/backlog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unclaim' }),
      });
      if (!res.ok) throw new Error('Failed to unclaim');
      fetchBacklog();
    } catch (err) {
      console.error('Error unclaiming topic:', err);
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
          <h1 className="text-2xl font-semibold text-gray-900">Topic Backlog</h1>
        </div>
        <p className="text-gray-600">
          A running list to pull from. Mix categories week to week so it doesn't become all-AI or all-deep-dives in a row.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/fe-huddle"
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-transparent"
        >
          Rotation Schedule
        </Link>
        <Link
          href="/fe-huddle/backlog"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E4002B]/10 text-[#E4002B] border border-[#E4002B]/20"
        >
          Topic Backlog
        </Link>
      </div>

      {/* Backlog by Category */}
      <div className="space-y-8">
        {Object.entries(groupedBacklog).map(([category, items]) => {
          const colors = CATEGORY_COLORS[category] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
          const Icon = CATEGORY_ICONS[category] || Lightbulb;

          return (
            <div key={category}>
              <div className={`flex items-center gap-2 mb-4 ${colors.text}`}>
                <Icon size={20} />
                <h2 className="text-lg font-semibold">{category}</h2>
                <span className="text-sm text-gray-400">({items.length})</span>
              </div>

              <div className="grid gap-3">
                {items.map((item) => {
                  const isClaimed = !!item.claimedBy;
                  const isMine = item.claimedBy === currentUser;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${colors.bg} ${colors.border} ${
                        isClaimed ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${isClaimed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.title}
                          </h3>
                          <p className={`text-sm mt-1 ${isClaimed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.description}
                          </p>

                          {isClaimed && (
                            <div className="flex items-center gap-2 mt-3 text-sm">
                              <User size={14} className="text-gray-400" />
                              <span className="text-gray-600">Claimed by</span>
                              <span className="font-medium text-gray-900">
                                {item.claimedByName || 'Unknown'}
                              </span>
                              {item.claimedAt && (
                                <span className="text-gray-400">
                                  on {new Date(item.claimedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {!isClaimed ? (
                            <button
                              onClick={() => claimTopic(item.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#E4002B] bg-white border border-[#E4002B] rounded-lg hover:bg-[#E4002B]/5 transition-colors"
                            >
                              <Check size={14} />
                              Claim
                            </button>
                          ) : isMine ? (
                            <button
                              onClick={() => unclaimTopic(item.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <X size={14} />
                              Unclaim
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg">
                              <Check size={14} />
                              Claimed
                            </span>
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
        <div className="text-center py-12 text-gray-500">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No topics in the backlog</p>
          <p className="text-sm mt-1">Topics will be auto-populated on first load.</p>
        </div>
      )}

      {/* Back to Schedule */}
      <div className="mt-8">
        <Link
          href="/fe-huddle"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#E4002B] transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Rotation Schedule
        </Link>
      </div>
    </div>
  );
}
