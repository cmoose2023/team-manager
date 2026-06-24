'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  EstimatorHeader,
  DimensionSection,
  DependenciesSection,
  TestingSection,
  ResultPanel,
  FibonacciScale,
  HistorySection,
  Scores,
  HistoryEntry,
  QA_BUMP,
  POINTS_MAP,
  LEVEL_LABELS,
  QA_LABELS,
} from './_components';

export default function StoryPointsEstimator() {
  // State
  const [scores, setScores] = useState<Scores>({ vol: null, cx: null, risk: null });
  const [checks, setChecks] = useState({ vol: 0, cx: 0, risk: 0 });
  const [depChecked, setDepChecked] = useState<boolean[]>(new Array(10).fill(false));
  const [qaChecked, setQaChecked] = useState<boolean[]>(new Array(9).fill(false));
  const [testScore, setTestScore] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  // Derived values
  const depOpen = depChecked.filter((c) => !c).length;
  const resolvedCount = [scores.vol, scores.cx, scores.risk].filter((v) => v !== null).length + (testScore !== null ? 1 : 0);
  const progress = (resolvedCount / 4) * 100;

  const result = (() => {
    const { vol, cx, risk } = scores;
    if (vol === null || cx === null || risk === null || testScore === null) return null;
    const total = Math.min(Math.max(vol + cx + risk + QA_BUMP[testScore], 4), 14);
    return POINTS_MAP[total];
  })();

  // Handlers
  const pickDimension = (dim: keyof Scores, val: number) => {
    setScores((p) => ({ ...p, [dim]: val }));
  };

  const bumpCheck = (dim: keyof typeof checks) => {
    setChecks((p) => ({ ...p, [dim]: (p[dim] + 1) % 4 }));
  };

  const toggleDep = (i: number) => {
    setDepChecked((p) => {
      const n = [...p];
      n[i] = !n[i];
      return n;
    });
  };

  const toggleQa = (i: number) => {
    setQaChecked((p) => {
      const n = [...p];
      n[i] = !n[i];
      return n;
    });
  };

  const addToHistory = () => {
    if (!result) return;
    const entry: HistoryEntry = {
      id: nextId,
      pts: result.pts,
      size: result.size,
      vol: LEVEL_LABELS[scores.vol!],
      cx: LEVEL_LABELS[scores.cx!],
      risk: LEVEL_LABELS[scores.risk!],
      qa: QA_LABELS[testScore!],
      dep: depOpen === 0 ? 'Clear' : `${depOpen} open`,
    };
    setNextId((n) => n + 1);
    setHistory((p) => [entry, ...p]);
    resetAll();
  };

  const resetAll = () => {
    setScores({ vol: null, cx: null, risk: null });
    setChecks({ vol: 0, cx: 0, risk: 0 });
    setDepChecked(new Array(10).fill(false));
    setQaChecked(new Array(9).fill(false));
    setTestScore(null);
  };

  const clearHistory = () => setHistory([]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a] text-white -mx-4 -my-8 px-6 py-8">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(224,48,48,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(224,48,48,0.03) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        <EstimatorHeader />

        {/* Dimensions */}
        <DimensionSection
          dimension="vol"
          score={scores.vol}
          checkCount={checks.vol}
          onPick={(v) => pickDimension('vol', v)}
          onToggleCheck={() => bumpCheck('vol')}
        />
        <DimensionSection
          dimension="cx"
          score={scores.cx}
          checkCount={checks.cx}
          onPick={(v) => pickDimension('cx', v)}
          onToggleCheck={() => bumpCheck('cx')}
        />
        <DimensionSection
          dimension="risk"
          score={scores.risk}
          checkCount={checks.risk}
          onPick={(v) => pickDimension('risk', v)}
          onToggleCheck={() => bumpCheck('risk')}
        />

        <div className="h-px bg-white/10 my-8" />

        {/* Dependencies */}
        <DependenciesSection checked={depChecked} onToggle={toggleDep} />

        {/* Testing */}
        <TestingSection
          checked={qaChecked}
          testScore={testScore}
          onToggleCheck={toggleQa}
          onPickTest={setTestScore}
        />

        {/* Result */}
        <ResultPanel scores={scores} testScore={testScore} depOpen={depOpen} progress={progress} />

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={addToHistory}
            disabled={!result}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#e03030]/10 text-[#e03030] border border-[#e03030] hover:bg-[#e03030]/20 disabled:opacity-35 transition-all"
          >
            Add to session
          </button>
          <button
            onClick={resetAll}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-[#141414] text-white/70 border border-white/10 hover:bg-[#1e1e1e] hover:text-white transition-all flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Fibonacci Scale */}
        <FibonacciScale currentPoints={result?.pts ?? null} />

        {/* History */}
        <HistorySection history={history} onClear={clearHistory} />
      </div>
    </div>
  );
}
