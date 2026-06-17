'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Presentation, ChevronLeft, User, Check, X, Lightbulb, Wrench, GitBranch, Sparkles, CalendarPlus, Calendar } from 'lucide-react';
import { KnowledgeShareBacklog, KnowledgeShareSession } from '@/lib/types';

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
  const [sessions, setSessions] = useState<KnowledgeShareSession[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedulingItem, setSchedulingItem] = useState<string | null>(null);
  const [claimingItem, setClaimingItem] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchBacklog();
    fetchCurrentUser();
    fetchSessions();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/knowledge-share/sessions');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
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

  const startClaim = (id: string) => {
    setClaimingItem(id);
    setSelectedWeek('');
    setSelectedDate('');
  };

  const cancelClaim = () => {
    setClaimingItem(null);
    setSelectedWeek('');
    setSelectedDate('');
  };

  const claimTopic = async () => {
    if (!claimingItem || !selectedWeek || !selectedDate || !currentUser) return;
    
    try {
      // Claim the topic first
      const res = await fetch(`/api/knowledge-share/backlog/${claimingItem}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' }),
      });
      if (!res.ok) throw new Error('Failed to claim');
      
      // Get the updated backlog item
      const backlogRes = await fetch('/api/knowledge-share/backlog');
      if (!backlogRes.ok) throw new Error('Failed to fetch backlog');
      const backlogData = await backlogRes.json();
      const updatedItem = (backlogData.backlog || []).find((b: KnowledgeShareBacklog) => b.id === claimingItem);
      
      if (!updatedItem) {
        fetchBacklog();
        setClaimingItem(null);
        return;
      }
      
      // Schedule with selected date
      const scheduleRes = await fetch(`/api/knowledge-share/sessions/${selectedWeek}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterId: currentUser.id,
          presenterName: updatedItem.claimedByName,
          backlogId: updatedItem.id,
          topicTitle: updatedItem.title,
          scheduledDate: selectedDate,
          status: 'confirmed',
        }),
      });
      
      if (scheduleRes.ok) {
        fetchSessions();
      }
      
      setClaimingItem(null);
      setSelectedWeek('');
      setSelectedDate('');
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

  const scheduleTopic = async (backlogId: string, sessionId: string) => {
    try {
      const item = backlog.find((b) => b.id === backlogId);
      if (!item || !currentUser) return;

      const res = await fetch(`/api/knowledge-share/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenterId: currentUser.id,
          presenterName: item.claimedByName,
          backlogId: item.id,
          topicTitle: item.title,
          status: 'confirmed',
        }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      fetchSessions();
      setSchedulingItem(null);
    } catch (err) {
      console.error('Error scheduling topic:', err);
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
                  const isMine = item.claimedBy === currentUser?.id;
                  const isScheduling = schedulingItem === item.id;

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
                          
                          {/* Show scheduled week if assigned */}
                          {(() => {
                            const assignedSession = sessions.find((s) => s.backlogId === item.id);
                            if (assignedSession) {
                              return (
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <CalendarPlus size={14} className="text-green-500" />
                                  <span className="text-green-600 font-medium">
                                    Scheduled for Week {assignedSession.week}
                                    {assignedSession.scheduledDate && (
                                      <span className="text-green-500 font-normal">
                                        {' '}({new Date(assignedSession.scheduledDate).toLocaleDateString()})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="shrink-0">
                          {!isClaimed ? (
                            <button
                              onClick={() => startClaim(item.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#E4002B] rounded-lg hover:bg-[#c40025] transition-colors"
                            >
                              <CalendarPlus size={14} />
                              Claim & Schedule
                            </button>
                          ) : isMine ? (
                            <div className="flex gap-2">
                              {/* Manual Schedule Button - only show if not already scheduled */}
                              {(() => {
                                const assignedSession = sessions.find((s) => s.backlogId === item.id);
                                if (!assignedSession) {
                                  const availableSlots = sessions.filter((s) => !s.backlogId).length;
                                  return (
                                    <>
                                      {isScheduling ? (
                                        <select
                                          autoFocus
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              scheduleTopic(item.id, e.target.value);
                                            } else {
                                              setSchedulingItem(null);
                                            }
                                          }}
                                          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                                        >
                                          <option value="">
                                            {availableSlots === 0 ? 'No slots available' : 'Select week...'}
                                          </option>
                                          {sessions
                                            .filter((s) => !s.backlogId)
                                            .map((s) => (
                                              <option key={s.id} value={s.id}>
                                                Week {s.week}
                                                {s.scheduledDate ? ` (${new Date(s.scheduledDate).toLocaleDateString()})` : ''}
                                              </option>
                                            ))}
                                        </select>
                                      ) : (
                                        <button
                                          onClick={() => setSchedulingItem(item.id)}
                                          disabled={availableSlots === 0}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                            availableSlots === 0
                                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                              : 'text-white bg-[#E4002B] hover:bg-[#c40025]'
                                          }`}
                                        >
                                          <CalendarPlus size={14} />
                                          {availableSlots === 0 ? 'No Slots' : 'Schedule'}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => unclaimTopic(item.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                      >
                                        <X size={14} />
                                        Unclaim
                                      </button>
                                    </>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => unclaimTopic(item.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <X size={14} />
                                    Unclaim
                                  </button>
                                );
                              })()}
                            </div>
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

      {/* Claim & Schedule Modal */}
      {claimingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule Your Presentation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a week and date for your knowledge share.
            </p>
            
            <div className="space-y-4">
              {/* Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Week
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                >
                  <option value="">Select a week...</option>
                  {sessions
                    .filter((s) => !s.backlogId)
                    .sort((a, b) => a.week - b.week)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        Week {s.week}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presentation Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E4002B] focus:border-[#E4002B]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelClaim}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={claimTopic}
                disabled={!selectedWeek || !selectedDate}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !selectedWeek || !selectedDate
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-[#E4002B] hover:bg-[#c40025]'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
