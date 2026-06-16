'use client';

import { HistoryEntry, LEVEL_LABELS, QA_LABELS } from './constants';

interface HistorySectionProps {
  history: HistoryEntry[];
  onClear: () => void;
}

export function HistorySection({ history, onClear }: HistorySectionProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[11px] text-white/40 font-mono uppercase tracking-wider">
          Session estimates
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-[12px] text-white/40 hover:text-[#e03030] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-white/40 border border-dashed border-white/10 rounded-lg">
          Estimates you add will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-4 p-3 bg-[#141414] border border-white/10 rounded-lg"
            >
              <div className="text-[22px] font-mono font-medium text-[#e03030] min-w-[36px]">
                {h.pts}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white truncate">{h.size}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60">
                    V:{h.vol}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60">
                    C:{h.cx}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60">
                    R:{h.risk}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60">
                    D:{h.dep}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/60">
                    Q:{h.qa}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
