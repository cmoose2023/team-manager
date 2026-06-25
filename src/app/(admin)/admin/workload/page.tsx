'use client';

import { useState } from 'react';
import { SprintView } from '@/components/workload/SprintView';
import { MonthlyView } from '@/components/workload/MonthlyView';
import { VelocityView } from '@/components/workload/VelocityView';

type Tab = 'sprint' | 'monthly' | 'velocity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'sprint', label: 'Current Sprint' },
  { id: 'monthly', label: 'Monthly History' },
  { id: 'velocity', label: 'Velocity' },
];

export default function WorkloadPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sprint');

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Team Workload</h1>

      <div className="flex gap-1 mb-8 bg-white/5 rounded-lg p-1 w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={[
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-[#e03030] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'sprint' && <SprintView />}
      {activeTab === 'monthly' && <MonthlyView />}
      {activeTab === 'velocity' && <VelocityView />}
    </div>
  );
}
