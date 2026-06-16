'use client';

import { FIB } from './constants';

interface FibonacciScaleProps {
  currentPoints: number | null;
}

const FIB_LABELS = ['trivial', 'simple', 'small', 'medium', 'large', 'epic'];
const FIB_HEIGHTS = [20, 32, 44, 64, 88, 120];

export function FibonacciScale({ currentPoints }: FibonacciScaleProps) {
  return (
    <div className="p-5 rounded-xl border border-white/10 bg-[#141414] mb-8">
      <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-4">
        Fibonacci scale
      </div>
      <div className="flex gap-2 items-end">
        {FIB.map((n, i) => (
          <div
            key={n}
            className={['flex-1 text-center transition-all', currentPoints === n ? '' : 'opacity-50'].join(
              ' '
            )}
          >
            <div
              className="rounded-t mx-auto mb-1.5 transition-all"
              style={{
                height: FIB_HEIGHTS[i],
                maxWidth: 44,
                background: currentPoints === n ? '#e03030' : 'rgba(255,255,255,0.1)',
              }}
            />
            <div
              className={[
                'text-[13px] font-mono font-medium transition-colors',
                currentPoints === n ? 'text-[#e03030]' : 'text-white/40',
              ].join(' ')}
            >
              {n}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">{FIB_LABELS[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
