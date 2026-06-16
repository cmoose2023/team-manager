export type Dimension = 'vol' | 'cx' | 'risk';
export type Scores = { vol: number | null; cx: number | null; risk: number | null };

export interface HistoryEntry {
  id: number;
  pts: number;
  size: string;
  vol: string;
  cx: string;
  risk: string;
  qa: string;
  dep: string;
}

export const LEVEL_LABELS: Record<number, string> = { 1: 'Low', 2: 'Med', 3: 'High' };
export const QA_LABELS: Record<number, string> = { 1: 'Low', 2: 'Med', 3: 'High', 4: 'Crit' };
export const QA_BUMP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5 };
export const FIB = [1, 2, 3, 5, 8, 13];

export const POINTS_MAP: Record<number, { pts: number; size: string; desc: string }> = {
  4: { pts: 1, size: 'Trivial', desc: 'Config change, copy update.' },
  5: { pts: 2, size: 'Simple', desc: 'Small bug fix or UI change.' },
  6: { pts: 3, size: 'Small', desc: 'Form field, minor API call.' },
  7: { pts: 5, size: 'Medium', desc: 'New component, moderate integration.' },
  8: { pts: 5, size: 'Medium', desc: 'Component with some uncertainty.' },
  9: { pts: 8, size: 'Large', desc: 'Multi-step feature, touches multiple systems.' },
  10: { pts: 8, size: 'Large', desc: 'Feature with substantial QA overhead.' },
  11: { pts: 13, size: 'Epic', desc: 'New subsystem or architectural change.' },
  12: { pts: 13, size: 'Epic', desc: 'Complex scope plus critical QA.' },
  13: { pts: 13, size: 'Epic', desc: 'Maximum complexity. Break this down.' },
  14: { pts: 13, size: 'Epic', desc: 'Maximum complexity. Break this down.' },
};

export const DEPENDENCIES = [
  'Backend API ready?',
  'API contract documented?',
  'Test data available?',
  'Designs finalized?',
  'Product acceptance criteria complete?',
  'Third-party service involved?',
  'Feature flag needed?',
  'Copy / legal / security approval needed?',
  'QA environment stable?',
  'Deployment order known?',
];

export const QA_ITEMS = [
  'Unit tests',
  'Integration tests',
  'Manual QA pass',
  'Cross-browser testing',
  'Mobile / responsive testing',
  'Accessibility checks',
  'Regression testing',
  'Production monitoring / Sentry review',
  'Customer Care validation',
];

export const DIMENSION_CONFIG = {
  vol: {
    number: '01',
    title: 'Amount of work',
    questions: [
      'How many files, components, or endpoints need to be touched?',
      'How many distinct steps does the implementation require?',
      'Does this cross multiple repos, teams, or surfaces?',
    ],
    options: [
      { value: 1, level: 'LOW', label: 'Self-contained', desc: 'Few steps, one area' },
      { value: 2, level: 'MEDIUM', label: 'Multiple parts', desc: 'Several steps' },
      { value: 3, level: 'HIGH', label: 'Cross-cutting', desc: 'Spans repos' },
    ],
  },
  cx: {
    number: '02',
    title: 'Complexity',
    questions: [
      'Does this involve non-obvious logic or edge cases?',
      'Are there difficult architectural decisions?',
      'Does this require research or prototyping?',
    ],
    options: [
      { value: 1, level: 'LOW', label: 'Known patterns', desc: 'Straightforward' },
      { value: 2, level: 'MEDIUM', label: 'Some branching', desc: 'Moderate logic' },
      { value: 3, level: 'HIGH', label: 'Non-obvious', desc: 'Intricate logic' },
    ],
  },
  risk: {
    number: '03',
    title: 'Risk & uncertainty',
    questions: [
      'Are requirements fully defined?',
      'Does this involve external systems not yet vetted?',
      'Risk of hidden scope mid-sprint?',
    ],
    options: [
      { value: 1, level: 'LOW', label: 'Well understood', desc: 'Clear requirements' },
      { value: 2, level: 'MEDIUM', label: 'Some unknowns', desc: 'May need investigation' },
      { value: 3, level: 'HIGH', label: 'Significant gaps', desc: 'External deps unclear' },
    ],
  },
};

export const TEST_OPTIONS = [
  { value: 1, level: 'LOW', label: 'Local only', desc: 'Dev validates' },
  { value: 2, level: 'MED', label: 'QA pass', desc: 'QA + responsive' },
  { value: 3, level: 'HIGH', label: 'Full suite', desc: 'Cross-browser' },
  { value: 4, level: 'CRIT', label: 'Staged rollout', desc: 'Revenue-critical' },
];
