'use client';

import { ChecklistItem } from './ChecklistItem';
import { DEPENDENCIES } from './constants';

interface DependenciesSectionProps {
  checked: boolean[];
  onToggle: (index: number) => void;
}

export function DependenciesSection({ checked, onToggle }: DependenciesSectionProps) {
  const resolved = checked.filter(Boolean).length;
  const open = DEPENDENCIES.length - resolved;

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[11px] text-white/40 font-mono">04</span>
        <span className="text-[13px] font-medium text-white/70 uppercase tracking-wider">
          Dependencies
        </span>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-lg p-4">
        <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-3">
          Check all that apply
        </div>
        {DEPENDENCIES.map((item, i) => (
          <ChecklistItem key={i} label={item} checked={checked[i]} onToggle={() => onToggle(i)} />
        ))}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          <span className="text-[11px] text-white/40 font-mono">
            {resolved} / {DEPENDENCIES.length} resolved
          </span>
          <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e03030] rounded-full transition-all"
              style={{ width: `${(resolved / DEPENDENCIES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {open > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-[#e8a03a]/10 border border-[#e8a03a]/25 text-[12px] text-[#e8a03a]">
          <strong className="font-medium block mb-1">Unresolved dependencies detected</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-[#e8a03a]/30">
              Increase estimate
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-[#e8a03a]/30">
              Split discovery + implementation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
