'use client';

import { Check } from 'lucide-react';

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

export function ChecklistItem({ label, checked, onToggle }: ChecklistItemProps) {
  return (
    <div
      onClick={onToggle}
      className={[
        'flex items-start gap-2.5 py-1.5 cursor-pointer border-b border-white/5 last:border-0',
        checked ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div
        className={[
          'w-4 h-4 rounded flex items-center justify-center mt-0.5 border transition-all',
          checked ? 'bg-[#e03030] border-[#e03030]' : 'border-white/20 bg-transparent',
        ].join(' ')}
      >
        {checked && <Check size={10} className="text-white" />}
      </div>
      <span
        className={[
          'text-[13px] leading-relaxed',
          checked ? 'line-through text-white/40' : 'text-white/70',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}
