'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, X } from 'lucide-react';
import { ENGINEERS } from '@/lib/engineers';

const CHANNELS = ['Auction', 'Retail', 'Marketplace'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];

export default function NewSessionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Session details
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [ticketRef, setTicketRef] = useState('');
  const [goal, setGoal] = useState('');
  const [notes, setNotes] = useState('');

  // Attendees
  const [attendees, setAttendees] = useState<string[]>([]);

  // Test cases
  const [testCases, setTestCases] = useState<string[]>(['']);

  // Permutations
  const [permutations, setPermutations] = useState<Array<{ label: string; channel: string; browser: string }>>([
    { label: '', channel: CHANNELS[0], browser: BROWSERS[0] },
  ]);

  const toggleAttendee = (id: string) => {
    setAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const addTestCase = () => setTestCases([...testCases, '']);
  const updateTestCase = (index: number, value: string) => {
    const updated = [...testCases];
    updated[index] = value;
    setTestCases(updated);
  };
  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const addPermutation = () =>
    setPermutations([...permutations, { label: '', channel: CHANNELS[0], browser: BROWSERS[0] }]);
  const updatePermutation = (index: number, field: string, value: string) => {
    const updated = [...permutations];
    updated[index] = { ...updated[index], [field]: value };
    setPermutations(updated);
  };
  const removePermutation = (index: number) => {
    setPermutations(permutations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const validTestCases = testCases.filter((t) => t.trim() !== '');
    const validPermutations = permutations.filter((p) => p.label.trim() !== '');

    try {
      const res = await fetch('/api/group-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduledDate,
          ticketRef: ticketRef || undefined,
          goal: goal || undefined,
          notes: notes || undefined,
          attendees,
          testCases: validTestCases,
          permutations: validPermutations,
        }),
      });

      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      router.push(`/group-testing/${data.item.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create session');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">New Group Testing Session</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Session Details */}
        <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Session Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Title <span className="text-[#e03030]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                placeholder="e.g., Sprint 23 Regression Testing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Scheduled Date <span className="text-[#e03030]">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Ticket Reference
                </label>
                <input
                  type="text"
                  value={ticketRef}
                  onChange={(e) => setTicketRef(e.target.value)}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                  placeholder="e.g., PL-1543"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Goal</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                placeholder="What is the purpose of this testing session?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </section>

        {/* Attendees */}
        <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Attendees</h2>
          <div className="flex flex-wrap gap-3">
            {ENGINEERS.map((engineer) => (
              <button
                key={engineer.id}
                type="button"
                onClick={() => toggleAttendee(engineer.id)}
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  attendees.includes(engineer.id)
                    ? 'bg-[#e03030] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20',
                ].join(' ')}
              >
                {engineer.name}
              </button>
            ))}
          </div>
          {attendees.length === 0 && (
            <p className="text-sm text-white/50 mt-2">Select at least one attendee</p>
          )}
        </section>

        {/* Test Cases */}
        <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="inline-flex items-center gap-1 text-sm text-[#e03030] hover:text-[#ff4040] font-medium"
            >
              <Plus size={16} />
              Add Test Case
            </button>
          </div>
          <div className="space-y-3">
            {testCases.map((testCase, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={testCase}
                  onChange={(e) => updateTestCase(index, e.target.value)}
                  placeholder={`Test case ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                />
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="p-2 text-white/50 hover:text-[#e03030] transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Permutations */}
        <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Permutations</h2>
            <button
              type="button"
              onClick={addPermutation}
              className="inline-flex items-center gap-1 text-sm text-[#e03030] hover:text-[#ff4040] font-medium"
            >
              <Plus size={16} />
              Add Permutation
            </button>
          </div>
          <div className="space-y-3">
            {permutations.map((perm, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={perm.label}
                  onChange={(e) => updatePermutation(index, 'label', e.target.value)}
                  placeholder="Label (e.g., Homepage)"
                  className="flex-1 px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white placeholder-white/40"
                />
                <select
                  value={perm.channel}
                  onChange={(e) => updatePermutation(index, 'channel', e.target.value)}
                  className="px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white"
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c} className="bg-[#141414]">
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={perm.browser}
                  onChange={(e) => updatePermutation(index, 'browser', e.target.value)}
                  className="px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent bg-[#0a0a0a] text-white"
                >
                  {BROWSERS.map((b) => (
                    <option key={b} value={b} className="bg-[#141414]">
                      {b}
                    </option>
                  ))}
                </select>
                {permutations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePermutation(index)}
                    className="p-2 text-white/50 hover:text-[#e03030] transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting || !title || !scheduledDate}
            className="px-6 py-2.5 bg-[#e03030] text-white rounded-lg hover:bg-[#c02525] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Session'}
          </button>
          <Link
            href="/group-testing"
            className="px-6 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
