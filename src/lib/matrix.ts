import { type Category, type EngineerLevel } from './types';

export interface Criterion {
  /** stable identifier used as the DynamoDB ratings map key, e.g. "impact_1" */
  key: string;
  category: Category;
  text: string;
}

// ── Senior Engineer (IC) ──────────────────────────────────────────────────────

const SENIOR_IC_CRITERIA: Criterion[] = [
  // Impact — 3 criteria
  {
    key: 'impact_1',
    category: 'Impact',
    text: 'Delivers complex features or systems that materially improve product functionality, performance, or reliability',
  },
  {
    key: 'impact_2',
    category: 'Impact',
    text: 'Owns projects end-to-end, from technical design through implementation and launch',
  },
  {
    key: 'impact_3',
    category: 'Impact',
    text: 'Drives improvements in team velocity, code quality, or system performance',
  },

  // Influence — 6 criteria
  {
    key: 'influence_1',
    category: 'Influence',
    text: 'Acts as a technical leader within the team, guiding design and implementation decisions',
  },
  {
    key: 'influence_2',
    category: 'Influence',
    text: 'Mentors engineers through pairing, design discussions, and feedback',
  },
  {
    key: 'influence_3',
    category: 'Influence',
    text: 'Coordinates proactively with adjacent teams, raising dependencies and conflicts before they block work',
  },
  {
    key: 'influence_4',
    category: 'Influence',
    text: 'Collaborates closely with Product to identify tradeoffs and design solutions, not just execute requirements',
  },
  {
    key: 'influence_5',
    category: 'Influence',
    text: 'Communicates technical concepts, trade-offs, and risks clearly to both technical and non-technical stakeholders',
  },
  {
    key: 'influence_6',
    category: 'Influence',
    text: 'Seeks out and applies critical feedback; gives clear, constructive feedback to peers',
  },

  // Operations — 7 criteria
  {
    key: 'ops_1',
    category: 'Operations',
    text: "Strong proficiency across the team's tech stack",
  },
  {
    key: 'ops_2',
    category: 'Operations',
    text: 'Designs and implements scalable, maintainable solutions with appropriate trade-offs',
  },
  {
    key: 'ops_3',
    category: 'Operations',
    text: 'Thoroughly understands and applies best principles in automated testing',
  },
  {
    key: 'ops_4',
    category: 'Operations',
    text: 'Enforces engineering best practices through code reviews',
  },
  {
    key: 'ops_5',
    category: 'Operations',
    text: 'Breaks down ambiguous problems into clear technical approaches',
  },
  {
    key: 'ops_6',
    category: 'Operations',
    text: 'Proactively addresses technical debt',
  },
  {
    key: 'ops_7',
    category: 'Operations',
    text: 'Looks for opportunities to build or adopt tooling, including AI, that improves team quality and velocity',
  },
];

// ── Principal Engineer (IC) ───────────────────────────────────────────────────

const PRINCIPAL_IC_CRITERIA: Criterion[] = [
  // Impact — 4 criteria
  {
    key: 'impact_1',
    category: 'Impact',
    text: 'Leads development of complex, high-impact systems that span multiple teams or domains',
  },
  {
    key: 'impact_2',
    category: 'Impact',
    text: 'Delivers outcomes that would not have happened without their technical leadership',
  },
  {
    key: 'impact_3',
    category: 'Impact',
    text: 'Drives technical initiatives that meaningfully improve product or engineering outcomes at the org level',
  },
  {
    key: 'impact_4',
    category: 'Impact',
    text: 'Identifies critical work that has gone unnoticed and brings it into focus for the team',
  },

  // Influence — 5 criteria
  {
    key: 'influence_1',
    category: 'Influence',
    text: 'Serves as a technical leader and mentor across the engineering team',
  },
  {
    key: 'influence_2',
    category: 'Influence',
    text: 'Builds cross-team relationships that anticipate and de-risk dependencies',
  },
  {
    key: 'influence_3',
    category: 'Influence',
    text: 'Guides architectural decisions and technical direction',
  },
  {
    key: 'influence_4',
    category: 'Influence',
    text: 'Partners with product and leadership to shape technical strategy',
  },
  {
    key: 'influence_5',
    category: 'Influence',
    text: 'Raises the overall technical bar of the organization',
  },

  // Operations — 4 criteria
  {
    key: 'ops_1',
    category: 'Operations',
    text: 'Deep expertise in system architecture, engineering best practices, risk reduction, and change management',
  },
  {
    key: 'ops_2',
    category: 'Operations',
    text: 'Designs scalable, maintainable systems across multiple services or domains',
  },
  {
    key: 'ops_3',
    category: 'Operations',
    text: 'Establishes and improves engineering standards (code quality, testing, observability, performance)',
  },
  {
    key: 'ops_4',
    category: 'Operations',
    text: 'Identifies and trials new tools and technologies, including AI, and recommends adoption across the team',
  },
];

// ── Exports ───────────────────────────────────────────────────────────────────

export const MATRIX: Record<EngineerLevel, Criterion[]> = {
  SENIOR_IC: SENIOR_IC_CRITERIA,
  PRINCIPAL_IC: PRINCIPAL_IC_CRITERIA,
};

/** Returns criteria grouped by category for a given level. */
export function getCriteriaByCategory(level: EngineerLevel): Record<Category, Criterion[]> {
  const criteria = MATRIX[level];
  return {
    Impact: criteria.filter((c) => c.category === 'Impact'),
    Influence: criteria.filter((c) => c.category === 'Influence'),
    Operations: criteria.filter((c) => c.category === 'Operations'),
  };
}

/** Returns the display label for an engineer level. */
export function levelLabel(level: EngineerLevel): string {
  return level === 'SENIOR_IC' ? 'Senior Engineer (IC)' : 'Principal Engineer (IC)';
}
