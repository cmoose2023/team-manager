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
  const rowBg = isEven ? 'bg-gray-50' : 'bg-white';

  function handleRatingChange(newRating: CriterionRating['rating']) {
    onChange?.({ ...rating, rating: newRating });
  }

  function handleNoteChange(note: string) {
    onChange?.({ ...rating, note });
  }

  return (
    <div className={`${rowBg} px-4 py-4 border-b border-gray-100`}>
      {/* Criterion text + rating selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Index + text */}
        <div className="flex gap-3 min-w-0 flex-1">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-grey-light text-brand-grey text-xs font-semibold flex items-center justify-center mt-0.5">
            {index}
          </span>
          <p className="text-sm text-brand-grey-dark leading-relaxed">{criterion.text}</p>
        </div>

        {/* Rating selector */}
        <div className="sm:flex-shrink-0 pl-9 sm:pl-0">
          <RatingSelector
            value={rating.rating}
            onChange={isEditable ? handleRatingChange : undefined}
            readonly={!isEditable}
          />
        </div>
      </div>

      {/* Note areas */}
      <div className="mt-3 pl-9 flex flex-col gap-2">
        {/* Admin's note (read-only context in self-edit mode) */}
        {mode === 'self-edit' && adminNote && (
          <div className="rounded-md bg-rating-yellow-light border border-rating-yellow px-3 py-2">
            <p className="text-xs font-semibold text-amber-800 mb-1">Manager&apos;s notes</p>
            <p className="text-sm text-amber-900">{adminNote}</p>
          </div>
        )}

        {/* Editable note textarea */}
        {isEditable && (
          <div>
            <label className="block text-xs font-medium text-brand-grey mb-1">
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
                'w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none',
                'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent',
                mode === 'admin-edit' ? 'bg-rating-yellow-light' : 'bg-white',
              ].join(' ')}
            />
          </div>
        )}

        {/* Read-only note in view mode */}
        {mode === 'view' && rating.note && (
          <p className="text-sm text-brand-grey italic bg-gray-50 rounded-md px-3 py-2 border border-gray-100">
            {rating.note}
          </p>
        )}
      </div>
    </div>
  );
}
