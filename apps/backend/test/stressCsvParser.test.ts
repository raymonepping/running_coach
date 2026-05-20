import { describe, expect, it } from "vitest";
import { parseHeartCsv, parseStressCsv, parseStressHeartCsv } from "../src/services/stressCsvParser.js";

describe("parseStressCsv", () => {
  it("should parse Garmin stress CSV with semicolon delimiter", () => {
    const csvContent = `Date;Average;Rest;Low;Medium;High
19/May;39;5h 9min;5h 16min;2h 20min;1h 33min
18/May;29;10h 13min;5h 51min;2h 28min;14min`;

    const result = parseStressCsv({
      athlete_id: "test-athlete",
      file_name: "stress.csv",
      content: csvContent
    });

    expect(result).toHaveLength(2);
    
    const firstRecord = result[0];
    expect(firstRecord.athlete_id).toBe("test-athlete");
    expect(firstRecord.overall_stress).toBe(39);
    expect(firstRecord.rest_min).toBe(309); // 5h 9min = 309 minutes
    expect(firstRecord.low_stress_min).toBe(316); // 5h 16min = 316 minutes
    expect(firstRecord.medium_stress_min).toBe(140); // 2h 20min = 140 minutes
    expect(firstRecord.high_stress_min).toBe(93); // 1h 33min = 93 minutes
    expect(firstRecord.source_file_name).toBe("stress.csv");
    expect(firstRecord.source_format).toBe("csv");
    expect(firstRecord.source_date).toContain("2026-05-19");
    expect(firstRecord.stress_load_min).toBe(233);
    expect(firstRecord.high_stress_ratio).toBe(0.108);
    expect(firstRecord.rest_ratio).toBe(0.36);

    const secondRecord = result[1];
    expect(secondRecord.overall_stress).toBe(29);
    expect(secondRecord.rest_min).toBe(613); // 10h 13min
    expect(secondRecord.high_stress_min).toBe(14); // 14min
  });

  it("should handle minutes-only duration format", () => {
    const csvContent = `Date;Average;Rest;Low;Medium;High
19/May;39;309min;316min;140min;93min`;

    const result = parseStressCsv({
      athlete_id: "test-athlete",
      file_name: "stress.csv",
      content: csvContent
    });

    expect(result[0].rest_min).toBe(309);
    expect(result[0].low_stress_min).toBe(316);
  });

  it("should throw error for empty CSV", () => {
    expect(() => {
      parseStressCsv({
        athlete_id: "test-athlete",
        file_name: "empty.csv",
        content: "Date;Average;Rest;Low;Medium;High"
      });
    }).toThrow("Stress CSV does not contain data rows");
  });

  it("joins Garmin stress and heart CSV rows by date", () => {
    const stressContent = `Date;Average;Rest;Low;Medium;High
19/May;39;5h 9min;5h 16min;2h 20min;1h 33min
18/May;29;10h 13min;5h 51min;2h 28min;14min`;
    const heartContent = `Date;Resting;High
19/May;62 bpm;112 bpm
18/May;56 bpm;153 bpm`;

    const result = parseStressHeartCsv({
      athlete_id: "test-athlete",
      heart_content: heartContent,
      heart_file_name: "Heart.csv",
      stress_content: stressContent,
      stress_file_name: "stress.csv"
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      heart_rate_pressure: "normal",
      high_hr_bpm: 112,
      resting_hr_bpm: 62,
      source_heart_file_name: "Heart.csv"
    });
  });

  it("normalizes Garmin heart-rate CSV rows", () => {
    const heartContent = `Date;Resting;High
19/May;62 bpm;112 bpm
15/May;68 bpm;187 bpm`;

    const result = parseHeartCsv({
      athlete_id: "test-athlete",
      content: heartContent,
      file_name: "Heart.csv"
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      heart_rate_pressure: "normal",
      high_hr_bpm: 112,
      resting_hr_bpm: 62,
      source_date: "2026-05-19T00:00:00.000Z",
      source_file_name: "Heart.csv"
    });
    expect(result[1].heart_rate_pressure).toBe("elevated_resting_and_high_peak");
  });
});
