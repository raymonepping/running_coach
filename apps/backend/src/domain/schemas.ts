import { z } from "zod";

export const athleteIdSchema = z.string().min(1).default("demo-athlete");

const sourceSchema = z.enum(["sample", "api", "garmin_export", "system"]).default("api");

export const importEnvelopeSchema = z.object({
  athlete_id: athleteIdSchema,
  source: sourceSchema.optional()
});

export const activityImportSchema = importEnvelopeSchema.extend({
  distance_km: z.number(),
  avg_pace_sec_per_km: z.number(),
  avg_moving_pace_sec_per_km: z.number(),
  best_pace_sec_per_km: z.number(),
  avg_speed_kmh: z.number(),
  max_speed_kmh: z.number(),
  total_time_sec: z.number(),
  moving_time_sec: z.number(),
  elapsed_time_sec: z.number(),
  run_time_sec: z.number(),
  walk_time_sec: z.number(),
  avg_hr: z.number(),
  max_hr: z.number(),
  beginning_stamina_pct: z.number(),
  ending_stamina_pct: z.number(),
  min_stamina_pct: z.number(),
  primary_benefit: z.string(),
  aerobic_effect: z.number(),
  anaerobic_effect: z.number(),
  exercise_load: z.number(),
  avg_power_w: z.number(),
  max_power_w: z.number(),
  avg_cadence_spm: z.number(),
  max_cadence_spm: z.number(),
  avg_stride_length_m: z.number(),
  avg_vertical_ratio_pct: z.number(),
  avg_vertical_oscillation_cm: z.number(),
  avg_ground_contact_time_ms: z.number(),
  avg_gc_time_balance_left_pct: z.number(),
  avg_gc_time_balance_right_pct: z.number(),
  total_ascent_m: z.number(),
  total_descent_m: z.number()
});

export const activityFileImportSchema = importEnvelopeSchema.extend({
  file_name: z.string().min(1),
  file_type: z.enum(["gpx", "tcx"]),
  content: z.string().min(1).max(8_000_000)
});

export const sleepImportSchema = importEnvelopeSchema.extend({
  sleep_score: z.number(),
  quality: z.string(),
  duration_min: z.number(),
  summary: z.string(),
  stress_avg: z.number(),
  stress_rating: z.string(),
  deep_sleep_min: z.number(),
  light_sleep_min: z.number(),
  rem_sleep_min: z.number(),
  awake_restless_min: z.number(),
  restless_moments: z.number(),
  breathing_variations: z.string(),
  avg_overnight_hr: z.number(),
  resting_hr: z.number(),
  body_battery_change: z.number(),
  avg_spo2_pct: z.number(),
  lowest_spo2_pct: z.number(),
  avg_respiration_brpm: z.number(),
  lowest_respiration_brpm: z.number(),
  avg_overnight_hrv_ms: z.number(),
  hrv_status: z.string()
});

export const stressImportSchema = importEnvelopeSchema.extend({
  overall_stress: z.number(),
  rest_min: z.number(),
  low_stress_min: z.number(),
  medium_stress_min: z.number(),
  high_stress_min: z.number()
});

export const recoveryImportSchema = importEnvelopeSchema.extend({
  readiness_state: z.enum(["BUILD", "MAINTAIN", "RECOVER", "REST"]).default("MAINTAIN"),
  subjective_readiness: z.enum(["low", "moderate", "high"]).optional(),
  notes: z.string().optional()
});
