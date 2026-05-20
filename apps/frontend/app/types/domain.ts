export type ReadinessState = "BUILD" | "MAINTAIN" | "RECOVER" | "REST";

export interface ActivityRecord {
  id?: string;
  created_at?: string;
  distance_km: number;
  avg_pace_sec_per_km?: number;
  avg_hr: number;
  max_hr?: number;
  exercise_load: number;
  primary_benefit: string;
  aerobic_effect: number;
  anaerobic_effect: number;
  source_file_name?: string;
  source_format?: "gpx" | "tcx";
  source_started_at?: string;
  source_track_points?: number;
  source_laps?: number;
}

export interface SleepRecord {
  id?: string;
  created_at?: string;
  sleep_score: number;
  quality: string;
  duration_min: number;
  summary: string;
  stress_rating: string;
  hrv_status: string;
  restless_moments: number;
  source_file_name?: string;
  source_format?: "csv";
  source_period_label?: string;
  source_period_start?: string;
  source_period_end?: string;
  sleep_need_min?: number;
  avg_bedtime?: string;
  avg_wake_time?: string;
}

export interface StressRecord {
  id?: string;
  created_at?: string;
  overall_stress: number;
  rest_min: number;
  high_stress_min: number;
  stress_load_min?: number;
  high_stress_ratio?: number;
  rest_ratio?: number;
  resting_hr_bpm?: number;
  high_hr_bpm?: number;
  heart_rate_pressure?: string;
  source_file_name?: string;
  source_heart_file_name?: string;
  source_format?: "csv";
  source_date?: string;
}

export interface HeartRateRecord {
  id?: string;
  created_at?: string;
  resting_hr_bpm: number;
  high_hr_bpm: number;
  heart_rate_pressure: string;
  source_file_name?: string;
  source_format?: "csv";
  source_date?: string;
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
  rationale: string[];
  created_at: string;
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
  latestHeartRate?: HeartRateRecord;
  latestRecommendation?: Recommendation;
  findings: AgentFinding[];
  recommendations: Recommendation[];
  auditEvents: AuditEvent[];
}
