'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Profile } from '@/lib/types';

const LEVEL_OPTIONS = [
  { value: 'SENIOR_IC', label: 'Senior IC' },
  { value: 'PRINCIPAL_IC', label: 'Principal IC' },
] as const;

interface Props {
  adminProfiles: Profile[];
  onClose: () => void;
  onCreated: (profile: Profile) => void;
}

export function AddEngineerModal({ adminProfiles, onClose, onCreated }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState<'SENIOR_IC' | 'PRINCIPAL_IC'>('SENIOR_IC');
  const [title, setTitle] = useState('');
  const [manager, setManager] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          level,
          title: title || undefined,
          manager: manager || undefined,
          startDate: startDate || undefined,
        }),
      });

      const data = await res.json() as { item?: Profile; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to create engineer');
      onCreated(data.item!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create engineer');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#141414] rounded-xl border border-white/10 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Add Engineer</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={inputClass}
                placeholder="Jane"
              />
            </Field>
            <Field label="Last Name" required>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={inputClass}
                placeholder="Smith"
              />
            </Field>
          </div>

          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="jsmith@invaluable.com"
            />
          </Field>

          <Field label="Temporary Password" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
              placeholder="Min. 8 characters"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Level" required>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as typeof level)}
                className={inputClass}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#141414]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Senior Engineer"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Manager">
              <select
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-[#141414]">— No manager —</option>
                {adminProfiles.map((admin) => (
                  <option key={admin.username} value={admin.username} className="bg-[#141414]">
                    {`${admin.firstName} ${admin.lastName}`.trim()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-[#e03030] bg-[#e03030]/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-[#e03030] hover:bg-[#c02525] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create Engineer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1">
        {label}
        {required && <span className="text-[#e03030] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
