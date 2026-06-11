'use client';

import { useState } from 'react';

interface PeriodSelectorProps {
  periods: string[];
  selected: string;
  onChange: (period: string) => void;
  /** Show "New period" option and creation UI — admin only */
  canCreate?: boolean;
  onCreatePeriod?: (period: string) => Promise<void> | void;
}

const NEW_PERIOD_SENTINEL = '__new__';

export function PeriodSelector({
  periods,
  selected,
  onChange,
  canCreate = false,
  onCreatePeriod,
}: PeriodSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [newPeriodValue, setNewPeriodValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === NEW_PERIOD_SENTINEL) {
      setCreating(true);
      setNewPeriodValue('');
      setError('');
    } else {
      onChange(e.target.value);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newPeriodValue.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');
    try {
      await onCreatePeriod?.(trimmed);
      onChange(trimmed);
      setCreating(false);
      setNewPeriodValue('');
    } catch {
      setError('Could not create period. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelCreate() {
    setCreating(false);
    setNewPeriodValue('');
    setError('');
  }

  if (creating) {
    return (
      <form onSubmit={handleCreate} className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-brand-grey-dark whitespace-nowrap">
          New period
        </label>
        <input
          type="text"
          value={newPeriodValue}
          onChange={(e) => setNewPeriodValue(e.target.value)}
          placeholder="e.g. 2026-Q3"
          autoFocus
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent w-36"
        />
        <button
          type="submit"
          disabled={saving || !newPeriodValue.trim()}
          className="px-3 py-1.5 bg-brand-red text-white text-sm font-medium rounded-md hover:bg-brand-red-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={handleCancelCreate}
          className="px-3 py-1.5 bg-white border border-gray-300 text-brand-grey-dark text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {error && <p className="w-full text-xs text-rating-red">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="period-selector"
        className="text-sm font-medium text-brand-grey-dark whitespace-nowrap"
      >
        Review period
      </label>
      <select
        id="period-selector"
        value={selected}
        onChange={handleSelectChange}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
      >
        {periods.length === 0 && (
          <option value="" disabled>
            No periods yet
          </option>
        )}
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
        {canCreate && (
          <option value={NEW_PERIOD_SENTINEL}>+ New period…</option>
        )}
      </select>
    </div>
  );
}
