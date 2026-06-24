'use client';

import { type CriterionRating } from '@/lib/types';
import { type Criterion } from '@/lib/matrix';
import { RatingSelector } from './RatingSelector';

interface CriterionRowProps {
  /** 1-based display number within its category */
  index: number;
  criterion: Criterion;
  rating: CriterionRating;
  /** Admin's note shown read-only in self-edit mode */
  adminNote?: string;
  mode: 'admin-edit' | 'self-edit' | 'view';
  isEven?: boolean;
  onChange?: (updated: CriterionRating) => void;
}

export function CriterionRow({
  index,
  criterion,
  rating,
  adminNote,
  mode,
  isEven = false,
  onChange,
}: CriterionRowProps) {
  const isEditable = mode === 'admin-edit' || mode === 'self-edit';
  const rowBg = isEven ? 'bg-[#0a0a0a]' : 'bg-[#141414]';

  function handleRatingChange(newRating: CriterionRating['rating']) {
    onChange?.({ ...rating, rating: newRating });
  }

  function handleNoteChange(note: string) {
    onChange?.({ ...rating, note });
  }

  return (
    <div className={`${rowBg} px-4 py-4 border-b border-white/10`}>
      {/* Criterion text */}
      <div className="flex gap-3 min-w-0">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 text-white/70 text-xs font-semibold flex items-center justify-center mt-0.5">
          {index}
        </span>
        <p className="text-sm text-white/90 leading-relaxed">{criterion.text}</p>
      </div>

      {/* Note areas */}
      <div className="mt-3 pl-9 flex flex-col gap-2">
        {/* Admin's note (read-only context in self-edit mode) */}
        {mode === 'self-edit' && adminNote && (
          <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 px-3 py-2">
            <p className="text-xs font-semibold text-yellow-400 mb-1">Manager&apos;s notes</p>
            <p className="text-sm text-yellow-200/80">{adminNote}</p>
          </div>
        )}

        {/* Editable note textarea */}
        {isEditable && (
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">
              {mode === 'admin-edit' ? 'Notes for engineer' : 'Your self-assessment notes'}
            </label>
            <textarea
              value={rating.note}
              onChange={(e) => handleNoteChange(e.target.value)}
              rows={2}
              placeholder={
                mode === 'admin-edit'
                  ? 'Add context or improvement notes…'
                  : 'Reflect on your performance here…'
              }
              className={[
                'w-full px-3 py-2 text-sm border border-white/20 rounded-md resize-none bg-[#0a0a0a] text-white placeholder-white/30',
                'focus:outline-none focus:ring-2 focus:ring-[#e03030] focus:border-transparent',
                mode === 'admin-edit' ? 'bg-yellow-500/5' : '',
              ].join(' ')}
            />
          </div>
        )}

        {/* Read-only note in view mode */}
        {mode === 'view' && rating.note && (
          <p className="text-sm text-white/60 italic bg-[#0a0a0a] rounded-md px-3 py-2 border border-white/10">
            {rating.note}
          </p>
        )}

        {/* Rating selector */}
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1">
            {mode === 'view' ? 'Rating' : 'Select rating'}
          </label>
          <RatingSelector
            value={rating.rating}
            onChange={isEditable ? handleRatingChange : undefined}
            readonly={!isEditable}
          />
        </div>
      </div>
    </div>
  );
}
