'use client';

import { ChecklistItem } from './ChecklistItem';
import { QA_ITEMS, TEST_OPTIONS, QA_LABELS } from './constants';

interface TestingSectionProps {
  checked: boolean[];
  testScore: number | null;
  onToggleCheck: (index: number) => void;
  onPickTest: (value: number) => void;
}

export function TestingSection({ checked, testScore, onToggleCheck, onPickTest }: TestingSectionProps) {
  const checkedCount = checked.filter(Boolean).length;

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[11px] text-white/40 font-mono">05</span>
        <span className="text-[13px] font-medium text-white/70 uppercase tracking-wider">
          Testing / QA effort
        </span>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-lg p-4 mb-3">
        <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-3">
          Consider what validation is required
        </div>
        {QA_ITEMS.map((item, i) => (
          <ChecklistItem key={i} label={item} checked={checked[i]} onToggle={() => onToggleCheck(i)} />
        ))}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          <span className="text-[11px] text-white/40 font-mono">
            {checkedCount} / {QA_ITEMS.length} checked
          </span>
          <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e03030] rounded-full transition-all"
              style={{ width: `${(checkedCount / QA_ITEMS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {TEST_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPickTest(opt.value)}
            className={[
              'text-center p-3 rounded-lg border transition-all',
              testScore === opt.value
                ? 'border-[#e03030] bg-[#e03030]/10'
                : 'border-white/10 bg-[#141414] hover:border-white/20',
            ].join(' ')}
          >
            <div
              className={[
                'text-[11px] font-medium mb-1',
                testScore === opt.value ? 'text-[#e03030]' : 'text-white/40',
              ].join(' ')}
            >
              {opt.level}
            </div>
            <div className="text-[12px] font-medium text-white">{opt.label}</div>
            <div className="text-[11px] text-white/60 mt-1">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
