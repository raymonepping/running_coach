import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "../src/agents/readinessRules.js";
import type { ActivityRecord, SleepRecord, StressRecord } from "../src/domain/types.js";

const base = {
  id: "id",
  athlete_id: "athlete",
  source: "sample" as const,
  created_at: "2026-05-19T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z",
  schema_version: 1
};

const activity: ActivityRecord = {
  ...base,
  type: "activity",
  distance_km: 7.18,
  avg_pace_sec_per_km: 488,
  avg_moving_pace_sec_per_km: 487,
  best_pace_sec_per_km: 328,
  avg_speed_kmh: 7.4,
  max_speed_kmh: 11,
  total_time_sec: 3508,
  moving_time_sec: 3500,
  elapsed_time_sec: 3560,
  run_time_sec: 2382,
  walk_time_sec: 1126,
  avg_hr: 140,
  max_hr: 157,
  beginning_stamina_pct: 99,
  ending_stamina_pct: 82,
  min_stamina_pct: 82,
  primary_benefit: "Base (Low Aerobic)",
  aerobic_effect: 3.1,
  anaerobic_effect: 0,
  exercise_load: 83,
  avg_power_w: 219,
  max_power_w: 356,
  avg_cadence_spm: 149,
  max_cadence_spm: 181,
  avg_stride_length_m: 0.82,
  avg_vertical_ratio_pct: 9.1,
  avg_vertical_oscillation_cm: 7.6,
  avg_ground_contact_time_ms: 300,
  avg_gc_time_balance_left_pct: 49.3,
  avg_gc_time_balance_right_pct: 50.7,
  total_ascent_m: 11,
  total_descent_m: 10
};

const sleep: SleepRecord = {
  ...base,
  type: "sleep",
  sleep_score: 73,
  quality: "Fair",
  duration_min: 517,
  summary: "Non-restorative",
  stress_avg: 28,
  stress_rating: "Poor",
  deep_sleep_min: 61,
  light_sleep_min: 386,
  rem_sleep_min: 70,
  awake_restless_min: 24,
  restless_moments: 53,
  breathing_variations: "Few",
  avg_overnight_hr: 67,
  resting_hr: 62,
  body_battery_change: 34,
  avg_spo2_pct: 94,
  lowest_spo2_pct: 83,
  avg_respiration_brpm: 18,
  lowest_respiration_brpm: 14,
  avg_overnight_hrv_ms: 30,
  hrv_status: "Balanced"
};

const stress: StressRecord = {
  ...base,
  type: "stress",
  overall_stress: 29,
  rest_min: 613,
  low_stress_min: 351,
  medium_stress_min: 148,
  high_stress_min: 14
};

describe("evaluateReadiness", () => {
  it("recommends recover for the provided mismatch sample", () => {
    const result = evaluateReadiness({
      athleteId: "athlete",
      latestActivity: activity,
      latestSleep: sleep,
      latestStress: stress
    });

    expect(result.readinessState).toBe("RECOVER");
    expect(result.suggestedSession).toContain("Easy aerobic movement");
  });

  it("recommends build when recovery signals are strong", () => {
    const result = evaluateReadiness({
      athleteId: "athlete",
      latestActivity: activity,
      latestSleep: { ...sleep, quality: "Good", summary: "Restorative", stress_rating: "Good" },
      latestStress: stress
    });

    expect(result.readinessState).toBe("BUILD");
  });

  it("recommends recover when injury risk signals are present", () => {
    const result = evaluateReadiness({
      athleteId: "athlete",
      latestActivity: { ...activity, avg_ground_contact_time_ms: 360 },
      latestSleep: { ...sleep, quality: "Good", summary: "Restorative", stress_rating: "Good" },
      latestStress: stress
    });

    expect(result.readinessState).toBe("RECOVER");
  });
});
