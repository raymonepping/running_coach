export type ReadinessState = "BUILD" | "MAINTAIN" | "RECOVER" | "REST";

export type RecordSource = "sample" | "api" | "garmin_export" | "system";

export interface BaseDocument {
  id: string;
  type: string;
  athlete_id: string;
  source: RecordSource;
  created_at: string;
  updated_at: string;
  schema_version: number;
}

export interface AthleteProfile extends BaseDocument {
  type: "athlete_profile";
  display_name: string;
  timezone: string;
}

export interface ActivityRecord extends BaseDocument {
  type: "activity";
  distance_km: number;
  avg_pace_sec_per_km: number;
  avg_moving_pace_sec_per_km: number;
  best_pace_sec_per_km: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  total_time_sec: number;
  moving_time_sec: number;
  elapsed_time_sec: number;
  run_time_sec: number;
  walk_time_sec: number;
  avg_hr: number;
  max_hr: number;
  beginning_stamina_pct: number;
  ending_stamina_pct: number;
  min_stamina_pct: number;
  primary_benefit: string;
  aerobic_effect: number;
  anaerobic_effect: number;
  exercise_load: number;
  avg_power_w: number;
  max_power_w: number;
  avg_cadence_spm: number;
  max_cadence_spm: number;
  avg_stride_length_m: number;
  avg_vertical_ratio_pct: number;
  avg_vertical_oscillation_cm: number;
  avg_ground_contact_time_ms: number;
  avg_gc_time_balance_left_pct: number;
  avg_gc_time_balance_right_pct: number;
  total_ascent_m: number;
  total_descent_m: number;
  source_file_name?: string;
  source_format?: "gpx" | "tcx";
  source_started_at?: string;
  source_track_points?: number;
  source_laps?: number;
}

export interface SleepRecord extends BaseDocument {
  type: "sleep";
  sleep_score: number;
  quality: string;
  duration_min: number;
  summary: string;
  stress_avg: number;
  stress_rating: string;
  deep_sleep_min: number;
  light_sleep_min: number;
  rem_sleep_min: number;
  awake_restless_min: number;
  restless_moments: number;
  breathing_variations: string;
  avg_overnight_hr: number;
  resting_hr: number;
  body_battery_change: number;
  avg_spo2_pct: number;
  lowest_spo2_pct: number;
  avg_respiration_brpm: number;
  lowest_respiration_brpm: number;
  avg_overnight_hrv_ms: number;
  hrv_status: string;
}

export interface StressRecord extends BaseDocument {
  type: "stress";
  overall_stress: number;
  rest_min: number;
  low_stress_min: number;
  medium_stress_min: number;
  high_stress_min: number;
}

export interface RecoverySnapshot extends BaseDocument {
  type: "recovery_snapshot";
  readiness_state: ReadinessState;
  subjective_readiness?: "low" | "moderate" | "high";
  notes?: string;
}

export interface AgentFinding extends BaseDocument {
  type: "agent_finding";
  agent_name: string;
  severity: "info" | "watch" | "risk";
  title: string;
  detail: string;
  signals: string[];
}

export interface Recommendation extends BaseDocument {
  type: "recommendation";
  readiness_state: ReadinessState;
  suggested_session: string;
  coach_summary: string;
  athlete_explanation: string;
  rationale: string[];
  status: "pending" | "approved" | "rejected";
}

export interface AuditEvent extends BaseDocument {
  type: "audit_event";
  action: string;
  actor: "system" | "coach" | "athlete";
  target_id?: string;
  detail: string;
}

export interface AthleteContext {
  athleteId: string;
  latestActivity?: ActivityRecord;
  latestSleep?: SleepRecord;
  latestStress?: StressRecord;
  latestRecovery?: RecoverySnapshot;
}

export interface AgentRunResult {
  findings: AgentFinding[];
  recommendation: Recommendation;
  auditEvents: AuditEvent[];
}
