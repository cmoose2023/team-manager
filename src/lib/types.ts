export type RatingValue = 'red' | 'yellow' | 'green' | 'unrated';
export type EngineerLevel = 'SENIOR_IC' | 'PRINCIPAL_IC';
export type AssessorType = 'admin' | 'self';
export type Category = 'Impact' | 'Influence' | 'Operations';

export interface CriterionRating {
  rating: RatingValue;
  note: string;
}

/** keyed by criterion key, e.g. "impact_1" */
export type Ratings = Record<string, CriterionRating>;

export interface Assessment {
  engineerId: string;
  /** composite sort key: `{period}#{assessorType}` e.g. "2026-Q2#admin" */
  periodType: string;
  engineerName: string;
  engineerLevel: EngineerLevel;
  /** Cognito username of whoever submitted this assessment */
  assessorId: string;
  assessorType: AssessorType;
  /** standalone copy for GSI queries, e.g. "2026-Q2" */
  period: string;
  ratings: Ratings;
  overallNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Engineer {
  /** matches Cognito username, e.g. "steven.snyder" */
  id: string;
  name: string;
  level: EngineerLevel;
}

export interface AuthPayload {
  username: string;
  groups: string[];
  isAdmin: boolean;
}
