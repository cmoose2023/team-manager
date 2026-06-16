'use client';

import { POINTS_MAP, QA_BUMP, LEVEL_LABELS, QA_LABELS, Scores } from './constants';

interface ResultPanelProps {
  scores: Scores;
  testScore: number | null;
  depOpen: number;
  progress: number;
}

export function ResultPanel({ scores, testScore, depOpen, progress }: ResultPanelProps) {
  const { vol, cx, risk } = scores;

  const result = (() => {
    if (vol === null || cx === null || risk === null || testScore === null) return null;
    const total = Math.min(Math.max(vol + cx + risk + QA_BUMP[testScore], 4), 14);
    return POINTS_MAP[total];
  })();

  const dimensionValues = [
    { label: 'Volume', value: vol ? LEVEL_LABELS[vol] : '—', hasValue: vol !== null },
    { label: 'Complexity', value: cx ? LEVEL_LABELS[cx] : '—', hasValue: cx !== null },
    { label: 'Risk', value: risk ? LEVEL_LABELS[risk] : '—', hasValue: risk !== null },
    { label: 'Deps', value: depOpen === 0 ? 'Clear' : `${depOpen} open`, hasValue: true },
    { label: 'Testing', value: testScore ? QA_LABELS[testScore] : '—', hasValue: testScore !== null },
  ];

  return (
    <div
      className={[
        'rounded-xl border overflow-hidden mb-6',
        result ? 'border-white/20 bg-[#141414]' : 'border-white/10 bg-[#141414]',
      ].join(' ')}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-white/10 overflow-hidden">
        <div className="h-full bg-[#e03030] transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Main result */}
      <div className="p-6 flex items-start gap-6">
        <div
          className={[
            'text-[64px] font-mono font-medium leading-none min-w-[72px] pt-0.5 transition-colors',
            result ? 'text-[#e03030]' : 'text-white/40',
          ].join(' ')}
        >
          {result ? result.pts : '—'}
        </div>
        <div className="flex-1">
          {!result ? (
            <div className="text-[14px] text-white/40 py-2">
              Score all dimensions to generate estimate.
            </div>
          ) : (
            <>
              <div className="text-[16px] font-medium text-white mb-1">{result.size}</div>
              <div className="text-[13px] text-white/70 leading-relaxed mb-2">{result.desc}</div>
              <div className="flex flex-wrap gap-2">
                {result.pts >= 13 && (
                  <span className="text-[11px] px-2 py-1 rounded bg-[#e8a03a]/10 text-[#e8a03a] font-mono">
                    Consider breaking down
                  </span>
                )}
                {result.pts <= 2 && (
                  <span className="text-[11px] px-2 py-1 rounded bg-[#4caf82]/10 text-[#4caf82] font-mono">
                    Quick win
                  </span>
                )}
                {depOpen > 0 && (
                  <span className="text-[11px] px-2 py-1 rounded bg-[#e8a03a]/10 text-[#e8a03a] font-mono">
                    {depOpen} unresolved
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-5 gap-2 px-6 py-4 border-t border-white/10">
        {dimensionValues.map((dim) => (
          <div key={dim.label} className="text-center">
            <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider mb-1">
              {dim.label}
            </div>
            <div
              className={[
                'text-[14px] font-mono font-medium',
                dim.hasValue ? 'text-white' : 'text-white/40',
              ].join(' ')}
            >
              {dim.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
