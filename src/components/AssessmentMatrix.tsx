'use client';

import { type EngineerLevel, type Ratings, type RatingValue, type Category } from '@/lib/types';
import { MATRIX, getCriteriaByCategory } from '@/lib/matrix';
import { CriterionRow } from './CriterionRow';
import { RatingDot } from './RatingSelector';

interface AssessmentMatrixProps {
  level: EngineerLevel;
  /** Primary ratings — displayed and/or edited */
  ratings: Ratings;
  /**
   * Reference ratings shown as read-only context notes.
   * In self-edit mode, pass admin ratings here so their notes appear inline.
   */
  adminRatings?: Ratings;
  mode: 'admin-edit' | 'self-edit' | 'view';
  onChange?: (newRatings: Ratings) => void;
}

const CATEGORIES: Category[] = ['Impact', 'Influence', 'Operations'];

function getDefaultRating() {
  return { rating: 'unrated' as RatingValue, note: '' };
}

function getCategoryAggregate(
  criteriaKeys: string[],
  ratings: Ratings,
): RatingValue {
  const values = criteriaKeys.map((k) => ratings[k]?.rating ?? 'unrated');
  if (values.includes('red')) return 'red';
  if (values.includes('yellow')) return 'yellow';
  if (values.includes('unrated')) return 'unrated';
  return 'green';
}

export function AssessmentMatrix({
  level,
  ratings,
  adminRatings,
  mode,
  onChange,
}: AssessmentMatrixProps) {
  const criteriaByCategory = getCriteriaByCategory(level);

  function handleCriterionChange(key: string, updated: { rating: RatingValue; note: string }) {
    onChange?.({ ...ratings, [key]: updated });
  }

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {CATEGORIES.map((category) => {
        const criteria = criteriaByCategory[category] ?? [];
        if (criteria.length === 0) return null;

        const aggregate = getCategoryAggregate(
          criteria.map((c) => c.key),
          ratings,
        );

        return (
          <section key={category} className="last:border-b-0">
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-l-4 border-[#e03030] border-b border-white/10">
              <h3 className="font-semibold text-white">{category}</h3>
              <div className="flex items-center gap-1.5">
                <RatingDot value={aggregate} size="md" showLabel />
              </div>
            </div>

            {/* Criterion rows */}
            {criteria.map((criterion, i) => {
              const rating = ratings[criterion.key] ?? getDefaultRating();
              const adminNote = adminRatings?.[criterion.key]?.note;
              return (
                <CriterionRow
                  key={criterion.key}
                  index={i + 1}
                  criterion={criterion}
                  rating={rating}
                  adminNote={adminNote}
                  mode={mode}
                  isEven={i % 2 === 1}
                  onChange={
                    onChange
                      ? (updated) => handleCriterionChange(criterion.key, updated)
                      : undefined
                  }
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

// ── Exported helper: compute per-category aggregates for a full ratings set ───

export function computeCategoryAggregates(
  level: EngineerLevel,
  ratings: Ratings,
): Record<Category, RatingValue> {
  const criteriaByCategory = getCriteriaByCategory(level);
  return {
    Impact: getCategoryAggregate(
      (criteriaByCategory['Impact'] ?? []).map((c) => c.key),
      ratings,
    ),
    Influence: getCategoryAggregate(
      (criteriaByCategory['Influence'] ?? []).map((c) => c.key),
      ratings,
    ),
    Operations: getCategoryAggregate(
      (criteriaByCategory['Operations'] ?? []).map((c) => c.key),
      ratings,
    ),
  };
}

// Re-export for convenience in pages that import from this module
export { MATRIX };
