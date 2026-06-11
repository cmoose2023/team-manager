'use client';

import { type RatingValue } from '@/lib/types';

interface RatingOption {
  value: Exclude<RatingValue, 'unrated'>;
  label: string;
  activeClass: string;
  inactiveClass: string;
}

const OPTIONS: RatingOption[] = [
  {
    value: 'red',
    label: 'Not Executing',
    activeClass: 'bg-rating-red text-white border-rating-red',
    inactiveClass: 'border-rating-red text-rating-red hover:bg-rating-red-light',
  },
  {
    value: 'yellow',
    label: 'Partial',
    activeClass: 'bg-rating-yellow text-amber-900 border-rating-yellow',
    inactiveClass: 'border-rating-yellow text-amber-700 hover:bg-rating-yellow-light',
  },
  {
    value: 'green',
    label: 'Executing',
    activeClass: 'bg-rating-green text-white border-rating-green',
    inactiveClass: 'border-rating-green text-rating-green hover:bg-rating-green-light',
  },
];

interface RatingSelectorProps {
  value: RatingValue;
  onChange?: (value: RatingValue) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function RatingSelector({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: RatingSelectorProps) {
  const sizeClass = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1.5 text-sm';

  function handleClick(rating: Exclude<RatingValue, 'unrated'>) {
    if (readonly || !onChange) return;
    // Clicking the active rating deselects it
    onChange(value === rating ? 'unrated' : rating);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {OPTIONS.map(({ value: optVal, label, activeClass, inactiveClass }) => {
        const isActive = value === optVal;
        return (
          <button
            key={optVal}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(optVal)}
            className={[
              sizeClass,
              'font-medium rounded-full border transition-colors whitespace-nowrap',
              isActive ? activeClass : inactiveClass,
              readonly ? 'cursor-default' : 'cursor-pointer',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Small colored dot for aggregate indicators ─────────────────────────────────

const DOT_CLASS: Record<RatingValue, string> = {
  red: 'bg-rating-red',
  yellow: 'bg-rating-yellow',
  green: 'bg-rating-green',
  unrated: 'bg-gray-300',
};

const DOT_LABEL: Record<RatingValue, string> = {
  red: 'Not Executing',
  yellow: 'Partial',
  green: 'Executing',
  unrated: 'Not yet rated',
};

interface RatingDotProps {
  value: RatingValue;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function RatingDot({ value, size = 'md', showLabel = false }: RatingDotProps) {
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${dotSize} rounded-full inline-block ${DOT_CLASS[value]}`}
        title={DOT_LABEL[value]}
      />
      {showLabel && (
        <span className="text-xs text-brand-grey">{DOT_LABEL[value]}</span>
      )}
    </span>
  );
}
