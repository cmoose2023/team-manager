'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';

const LEVEL_OPTIONS = [
  { value: 'SENIOR_IC', label: 'Senior IC' },
  { value: 'PRINCIPAL_IC', label: 'Principal IC' },
] as const;

interface Props {
  profile: Profile;
  isSelf: boolean;
  isAdmin: boolean;
  adminProfiles: Profile[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ProfileForm({ profile, isSelf, isAdmin, adminProfiles }: Props) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin-only fields
  const [title, setTitle] = useState(profile.title ?? '');
  const [manager, setManager] = useState(profile.manager ?? '');
  const [startDate, setStartDate] = useState(profile.startDate ?? '');
  const [level, setLevel] = useState(profile.level ?? 'SENIOR_IC');

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canEdit = isSelf || isAdmin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSaveState('saving');
    setErrorMsg('');

    const body: Record<string, unknown> = {};

    if (firstName !== profile.firstName) body.firstName = firstName;
    if (lastName !== profile.lastName) body.lastName = lastName;
    if (email !== profile.email) body.email = email;
    if (password) body.password = password;

    if (isAdmin) {
      if (title !== (profile.title ?? '')) body.title = title;
      if (manager !== (profile.manager ?? '')) body.manager = manager || null;
      if (startDate !== (profile.startDate ?? '')) body.startDate = startDate || null;
      if (level !== profile.level) body.level = level;
    }

    if (Object.keys(body).length === 0) {
      setSaveState('idle');
      return;
    }

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(profile.username)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Failed to save');
      }

      setPassword('');
      setConfirmPassword('');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile');
      setSaveState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
        <h2 className="text-base font-semibold text-white mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={!canEdit}
              className={inputClass}
            />
          </Field>
          <Field label="Last Name" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={!canEdit}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Email Address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!canEdit}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
        <h2 className="text-base font-semibold text-white mb-1">
          {isSelf ? 'Change Password' : 'Reset Password'}
        </h2>
        <p className="text-sm text-white/50 mb-4">Leave blank to keep the current password.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={isSelf ? 'New Password' : 'New Password'}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!canEdit}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Confirm Password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!canEdit}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
        </div>
      </section>

      {/* Admin-only: Role Info */}
      {isAdmin && (
        <section className="bg-[#141414] rounded-lg border border-white/10 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Role Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Senior Engineer"
              />
            </Field>
            <Field label="Level">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Profile['level'] ?? 'SENIOR_IC')}
                className={inputClass}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#141414]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
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
        </section>
      )}

      {errorMsg && (
        <p className="text-sm text-[#e03030] bg-[#e03030]/10 rounded-md px-4 py-2">
          {errorMsg}
        </p>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveState === 'saving'}
            className={[
              'px-6 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
              saveState === 'saved'
                ? 'bg-green-600 text-white'
                : saveState === 'error'
                  ? 'bg-[#e03030] text-white'
                  : 'bg-[#e03030] hover:bg-[#c02525] text-white',
            ].join(' ')}
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

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
