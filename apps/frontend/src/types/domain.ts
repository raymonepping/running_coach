export type ReadinessState = "BUILD" | "MAINTAIN" | "RECOVER" | "REST";

export interface ActivityRecord {
  distance_km: number;
  avg_hr: number;
  exercise_load: number;
  primary_benefit: string;
  aerobic_effect: number;
  anaerobic_effect: number;
}

export interface SleepRecord {
  sleep_score: number;
  quality: string;
  duration_min: number;
  summary: string;
  stress_rating: string;
  hrv_status: string;
  restless_moments: number;
}

export interface StressRecord {
  overall_stress: number;
  rest_min: number;
  high_stress_min: number;
}

export interface AgentFinding {
  id: string;
  agent_name: string;
  severity: "info" | "watch" | "risk";
  title: string;
  detail: string;
  created_at: string;
}

export interface Recommendation {
  id: string;
  readiness_state: ReadinessState;
  suggested_session: string;
  coach_summary: string;
  athlete_explanation: string;
  status: "pending" | "approved" | "rejected";
}

export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  detail: string;
  created_at: string;
}

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
