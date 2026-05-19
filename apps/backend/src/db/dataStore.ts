import type {
  ActivityRecord,
  AgentFinding,
  AthleteContext,
  AuditEvent,
  BaseDocument,
  Recommendation,
  SleepRecord,
  StressRecord
} from "../domain/types.js";

export type CollectionName =
  | "athlete_profiles"
  | "activities"
  | "sleep_records"
  | "stress_records"
  | "recovery_snapshots"
  | "agent_findings"
  | "recommendations"
  | "audit_events";

export interface DashboardData {
  athleteId: string;
  latestActivity?: ActivityRecord;
  latestSleep?: SleepRecord;
  latestStress?: StressRecord;
  latestRecommendation?: Recommendation;
  findings: AgentFinding[];
  recommendations: Recommendation[];
  auditEvents: AuditEvent[];
}

export interface DataStore {
  save<T extends BaseDocument>(collection: CollectionName, document: T): Promise<T>;
  getAthleteContext(athleteId: string): Promise<AthleteContext>;
  getDashboard(athleteId: string): Promise<DashboardData>;
  listFindings(athleteId: string): Promise<AgentFinding[]>;
  listRecommendations(athleteId: string): Promise<Recommendation[]>;
  updateRecommendationStatus(id: string, status: "approved" | "rejected"): Promise<Recommendation>;
}
