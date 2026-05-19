import type { SleepRecord } from "../domain/types.js";

type SleepImport = Omit<SleepRecord, "id" | "type" | "created_at" | "updated_at" | "schema_version">;

export interface SleepCsvInput {
  athlete_id: string;
  source?: SleepRecord["source"];
  file_name: string;
  content: string;
}

interface GarminSleepCsvRow {
  "Date": string;
  "Avg Score": string;
  "Avg Quality": string;
  "Avg Duration": string;
  "Avg Sleep Need": string;
  "Avg Bedtime": string;
  "Avg Wake Time": string;
}

export function parseSleepCsv(input: SleepCsvInput, referenceDate = new Date()): SleepImport[] {
  const rows = parseCsv(input.content).map(toGarminSleepRow);
  if (rows.length === 0) {
    throw new Error("Sleep CSV does not contain data rows.");
  }

  return rows.map((row) => {
    const sleepScore = numberFrom(row["Avg Score"]);
    const durationMin = parseDuration(row["Avg Duration"]);
    const sleepNeedMin = parseDuration(row["Avg Sleep Need"]);
    const period = parsePeriod(row.Date, referenceDate);
    const quality = row["Avg Quality"] || classifyQuality(sleepScore);

    return {
      athlete_id: input.athlete_id,
      source: input.source ?? "garmin_export",
      sleep_score: sleepScore,
      quality,
      duration_min: durationMin,
      summary: durationMin + 20 < sleepNeedMin ? "Below sleep need" : "Aggregate sleep summary",
      stress_avg: 0,
      stress_rating: "Unknown",
      deep_sleep_min: 0,
      light_sleep_min: durationMin,
      rem_sleep_min: 0,
      awake_restless_min: 0,
      restless_moments: 0,
      breathing_variations: "Unknown",
      avg_overnight_hr: 0,
      resting_hr: 0,
      body_battery_change: 0,
      avg_spo2_pct: 0,
      lowest_spo2_pct: 0,
      avg_respiration_brpm: 0,
      lowest_respiration_brpm: 0,
      avg_overnight_hrv_ms: 0,
      hrv_status: "Unknown",
      source_file_name: input.file_name,
      source_format: "csv",
      source_period_label: row.Date,
      source_period_start: period.start,
      source_period_end: period.end,
      sleep_need_min: sleepNeedMin,
      avg_bedtime: row["Avg Bedtime"],
      avg_wake_time: row["Avg Wake Time"]
    };
  });
}

function toGarminSleepRow(row: Record<string, string>): GarminSleepCsvRow {
  return {
    "Date": row.Date ?? "",
    "Avg Score": row["Avg Score"] ?? "",
    "Avg Quality": row["Avg Quality"] ?? "",
    "Avg Duration": row["Avg Duration"] ?? "",
    "Avg Sleep Need": row["Avg Sleep Need"] ?? "",
    "Avg Bedtime": row["Avg Bedtime"] ?? "",
    "Avg Wake Time": row["Avg Wake Time"] ?? ""
  };
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseDuration(value: string): number {
  const hours = Number(value.match(/(\d+)\s*h/)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*min/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

function parsePeriod(label: string, referenceDate: Date): { start: string; end: string } {
  const yearMatch = label.match(/\b(20\d{2})\b/);
  const explicitYear = yearMatch ? Number(yearMatch[1]) : undefined;
  const sanitized = label.replace(/\s+20\d{2}\b/, "");
  const [startPart, endPart] = sanitized.split(/\s*-\s*/);
  const endYear = explicitYear ?? referenceDate.getUTCFullYear();
  const end = parseDayMonth(endPart, endYear);
  const startMonth = monthFromText(startPart) ?? end.month;
  const startDay = Number(startPart.match(/\d+/)?.[0]);
  const startYear = startMonth > end.month ? endYear - 1 : endYear;

  return {
    start: toIsoDate(startYear, startMonth, startDay),
    end: toIsoDate(endYear, end.month, end.day)
  };
}

function parseDayMonth(value: string, fallbackYear: number): { day: number; month: number; year: number } {
  const day = Number(value.match(/\d+/)?.[0]);
  const month = monthFromText(value);
  if (!day || !month) {
    throw new Error(`Unable to parse sleep CSV period: ${value}`);
  }
  return { day, month, year: fallbackYear };
}

function monthFromText(value: string): number | undefined {
  const text = value.toLowerCase();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const index = months.findIndex((month) => text.includes(month));
  return index >= 0 ? index + 1 : undefined;
}

function toIsoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

function numberFrom(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function classifyQuality(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}
