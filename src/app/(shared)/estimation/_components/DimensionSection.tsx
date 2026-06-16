'use client';

import { ChecklistItem } from './ChecklistItem';
import { Dimension, Scores, DIMENSION_CONFIG, LEVEL_LABELS } from './constants';

interface DimensionSectionProps {
  dimension: Dimension;
  score: number | null;
  checkCount: number;
  onPick: (value: number) => void;
  onToggleCheck: () => void;
}

export function DimensionSection({
  dimension,
  score,
  checkCount,
  onPick,
  onToggleCheck,
}: DimensionSectionProps) {
  const config = DIMENSION_CONFIG[dimension];

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] text-white/40 font-mono">{config.number}</span>
        <span className="text-[13px] font-medium text-white/70 uppercase tracking-wider">
          {config.title}
        </span>
      </div>

      {/* Checklist */}
      <div className="bg-[#141414] border border-white/10 rounded-lg p-4 mb-3">
        <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-2">
          Ask yourself
        </div>
        {config.questions.map((q, i) => (
          <ChecklistItem key={i} label={q} checked={checkCount > i} onToggle={onToggleCheck} />
        ))}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          <span className="text-[11px] text-white/40 font-mono">
            {Math.min(checkCount, 3)} / 3 checked
          </span>
          <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e03030] rounded-full transition-all"
              style={{ width: `${(Math.min(checkCount, 3) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-2">
        {config.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPick(opt.value)}
            className={[
              'text-left p-3 rounded-lg border transition-all',
              score === opt.value
                ? 'border-[#e03030] bg-[#e03030]/10'
                : 'border-white/10 bg-[#141414] hover:border-white/20',
            ].join(' ')}
          >
            <div
              className={[
                'text-[11px] font-medium mb-1',
                score === opt.value ? 'text-[#e03030]' : 'text-white/40',
              ].join(' ')}
            >
              {opt.level}
            </div>
            <div className="text-[13px] font-medium text-white mb-1">{opt.label}</div>
            <div className="text-[12px] text-white/60">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
