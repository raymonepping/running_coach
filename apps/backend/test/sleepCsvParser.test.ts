import { describe, expect, it } from "vitest";
import { parseSleepCsv } from "../src/services/sleepCsvParser.js";

const csv = `Date,Avg Score,Avg Quality,Avg Duration,Avg Sleep Need,Avg Bedtime,Avg Wake Time
13-19 May,66,Fair,7h 50min,7h 43min,23:12,7:22
25 Jun - 1 Jul 2025,69,Fair,6h 28min,8h 16min,0:10,6:54`;

const sevenDayCsv = `Sleep Score 7 Days,Score,Resting Heart Rate,Body Battery,Pulse Ox,Respiration,HRV Status,Quality,Duration,Sleep Need,Bedtime,Wake Time
2026-05-19,73,62,34,94.02,18.19,31,Fair,8h 37min,7h 40min,22:10,7:11
2026-05-18,79,56,59,--,17.98,32,Fair,9h 3min,7h 0min,22:10,7:33`;

const oneDayCsv = `Sleep Score 1 Day,
Date,2026-05-19
Sleep Duration,8h 37m
Sleep Score,73
Quality,Fair

Sleep Score Factors,
Sleep Duration,8h 37m
Stress Avg,28
Deep Sleep Duration,1h 1m
Light Sleep Duration,6h 26m
REM Duration,1h 10m
Awake Time,24m

Sleep Timeline Metrics,
Breathing Variations,Few
Restless Moments,53
Avg Overnight Heart Rate,67 bpm
Resting Heart Rate,62 bpm
Body Battery Change,+34
Avg SpO₂,94%
Lowest SpO2,83%
Avg Respiration,18 brpm
Lowest Respiration,14 brpm
Avg Overnight HRV,30 ms
7d Avg HRV,Balanced`;

describe("parseSleepCsv", () => {
  it("normalizes Garmin sleep summary CSV rows", () => {
    const records = parseSleepCsv(
      {
        athlete_id: "demo-athlete",
        content: csv,
        file_name: "Sleep.csv"
      },
      new Date("2026-05-19T00:00:00.000Z")
    );

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      sleep_score: 66,
      quality: "Fair",
      duration_min: 470,
      sleep_need_min: 463,
      source_period_start: "2026-05-13T00:00:00.000Z",
      source_period_end: "2026-05-19T00:00:00.000Z"
    });
    expect(records[1]).toMatchObject({
      duration_min: 388,
      sleep_need_min: 496,
      summary: "Below sleep need",
      source_period_start: "2025-06-25T00:00:00.000Z",
      source_period_end: "2025-07-01T00:00:00.000Z"
    });
  });

  it("normalizes Garmin daily sleep rows from 7-day and 4-week exports", () => {
    const records = parseSleepCsv({
      athlete_id: "demo-athlete",
      content: sevenDayCsv,
      file_name: "Sleep 7 Days.csv"
    });

    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      sleep_score: 73,
      resting_hr: 62,
      body_battery_change: 34,
      avg_spo2_pct: 94.02,
      avg_respiration_brpm: 18.19,
      avg_overnight_hrv_ms: 31,
      duration_min: 517,
      sleep_need_min: 460,
      source_period_start: "2026-05-19T00:00:00.000Z",
      source_period_end: "2026-05-19T00:00:00.000Z"
    });
    expect(records[1]?.avg_spo2_pct).toBe(0);
  });

  it("normalizes Garmin one-day sleep report details", () => {
    const records = parseSleepCsv({
      athlete_id: "demo-athlete",
      content: oneDayCsv,
      file_name: "Sleep 1 Day.csv"
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      sleep_score: 73,
      duration_min: 517,
      stress_avg: 28,
      stress_rating: "Fair",
      deep_sleep_min: 61,
      light_sleep_min: 386,
      rem_sleep_min: 70,
      awake_restless_min: 24,
      restless_moments: 53,
      breathing_variations: "Few",
      resting_hr: 62,
      body_battery_change: 34,
      avg_spo2_pct: 94,
      lowest_spo2_pct: 83,
      avg_respiration_brpm: 18,
      lowest_respiration_brpm: 14,
      avg_overnight_hrv_ms: 30,
      hrv_status: "Balanced"
    });
  });
});
