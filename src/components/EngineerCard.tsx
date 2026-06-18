'use client';

import { type Engineer, type Assessment, type Category } from '@/lib/types';
import { computeCategoryAggregates } from './AssessmentMatrix';
import { RatingDot } from './RatingSelector';

interface EngineerCardProps {
  engineer: Engineer;
  period: string;
  adminAssessment: Assessment | null;
  selfAssessment: Assessment | null;
  onClick: () => void;
}

const CATEGORIES: Category[] = ['Impact', 'Influence', 'Operations'];

export function EngineerCard({
  engineer,
  period,
  adminAssessment,
  selfAssessment,
  onClick,
}: EngineerCardProps) {
  const aggregates = adminAssessment
    ? computeCategoryAggregates(engineer.level, adminAssessment.ratings)
    : null;

  const isPrincipal = engineer.level === 'PRINCIPAL_IC';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-[#141414] rounded-lg border border-white/10 p-5 transition-all hover:border-[#e03030] hover:shadow-lg hover:border-l-4 group focus:outline-none focus:ring-2 focus:ring-[#e03030]"
    >
      {/* Name + level badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-white text-base group-hover:text-[#e03030] transition-colors">
            {engineer.name}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {engineer.id}
          </p>
        </div>
        <span
          className={[
            'flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
            isPrincipal
              ? 'bg-[#e03030] text-white'
              : 'bg-white/10 text-white/70',
          ].join(' ')}
        >
          {isPrincipal ? 'Principal IC' : 'Senior IC'}
        </span>
      </div>

      {/* Category aggregates (from admin's assessment) */}
      {aggregates ? (
        <div className="flex gap-4 mb-4">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex flex-col items-center gap-1">
              <RatingDot value={aggregates[cat]} size="md" />
              <span className="text-[10px] text-white/50 font-medium">{cat}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 mb-4">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex flex-col items-center gap-1">
              <RatingDot value="unrated" size="md" />
              <span className="text-[10px] text-white/50 font-medium">{cat}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status chips + CTA */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-2">
          <StatusChip
            label="Manager rated"
            active={!!adminAssessment}
            period={period}
          />
          <StatusChip
            label="Self-rated"
            active={!!selfAssessment}
            period={period}
          />
        </div>
        <span className="text-sm font-medium text-[#e03030] group-hover:underline">
          {adminAssessment ? 'Edit →' : 'Start →'}
        </span>
      </div>
    </button>
  );
}

// ── Internal sub-component ─────────────────────────────────────────────────────

function StatusChip({
  label,
  active,
}: {
  label: string;
  active: boolean;
  period: string;
}) {
  return (
    <span
      className={[
        'text-[10px] font-medium px-2 py-0.5 rounded-full',
        active
          ? 'bg-green-500/20 text-green-400'
          : 'bg-white/10 text-white/40',
      ].join(' ')}
    >
      {active ? `✓ ${label}` : `– ${label}`}
    </span>
  );
}
