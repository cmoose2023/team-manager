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
  engineerName: string;
  engineerLevel: EngineerLevel;
  /** Supabase user id (UUID) of whoever submitted this assessment */
  assessorId: string;
  assessorType: AssessorType;
  period: string;
  ratings: Ratings;
  overallNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Engineer {
  /** matches user_metadata.username, e.g. "steven.snyder" */
  id: string;
  name: string;
  level: EngineerLevel;
  /** Jira Cloud account ID — find in Jira user management or profile URL */
  jiraAccountId?: string;
}

export interface AuthPayload {
  username: string;
  groups: string[];
  isAdmin: boolean;
}

export interface Profile {
  username: string;
  authUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  title: string | null;
  manager: string | null;
  startDate: string | null;
  level: EngineerLevel | null;
  jiraAccountId: string | null;
  isAdmin: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Group Testing Scheduler ────────────────────────────────────────────────────

export type TestResultStatus = 'pending' | 'pass' | 'fail' | 'skip';

export interface TestSession {
  id: string;
  title: string;
  scheduledDate: string;
  ticketRef?: string;
  goal?: string;
  notes?: string;
  signedOff: boolean;
  createdBy: string;
  attendees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  sessionId: string;
  label: string;
  category?: string;
  sortOrder: number;
}

export interface TestPermutation {
  id: string;
  sessionId: string;
  label: string;
  channel: string;
  browser: string;
  sortOrder: number;
}

export interface TestResult {
  testCaseId: string;
  permutationId: string;
  status: TestResultStatus;
  notes?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface TestSessionDetail extends TestSession {
  testCases: TestCase[];
  permutations: TestPermutation[];
  results: TestResult[];
}

// ── FE Huddle Knowledge Share ─────────────────────────────────────────────────

export type KnowledgeShareStatus = 'planned' | 'confirmed' | 'done';

export interface KnowledgeShareBacklog {
  id: string;
  category: string;
  title: string;
  description: string;
  claimedBy?: string;
  claimedByName?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface KnowledgeShareSession {
  id: string;
  week: number;
  scheduledDate?: string;
  presenterId?: string;
  presenterName?: string;
  backlogId?: string;
  topicTitle?: string;
  status: KnowledgeShareStatus;
  createdAt: string;
  updatedAt: string;
}
