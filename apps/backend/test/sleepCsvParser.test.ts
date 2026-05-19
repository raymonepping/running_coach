import { describe, expect, it } from "vitest";
import { parseSleepCsv } from "../src/services/sleepCsvParser.js";

const csv = `Date,Avg Score,Avg Quality,Avg Duration,Avg Sleep Need,Avg Bedtime,Avg Wake Time
13-19 May,66,Fair,7h 50min,7h 43min,23:12,7:22
25 Jun - 1 Jul 2025,69,Fair,6h 28min,8h 16min,0:10,6:54`;

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
});
