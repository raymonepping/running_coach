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

interface GarminSleepDailyCsvRow {
  date: string;
  sleep_score: number;
  quality: string;
  duration_min: number;
  sleep_need_min: number;
  avg_bedtime: string;
  avg_wake_time: string;
  resting_hr: number;
  body_battery_change: number;
  avg_spo2_pct: number;
  avg_respiration_brpm: number;
  avg_overnight_hrv_ms: number;
  source_period_label: string;
}

export function parseSleepCsv(input: SleepCsvInput, referenceDate = new Date()): SleepImport[] {
  const lines = normalizedLines(input.content);
  const headers = splitCsvLine(lines[0] ?? "");

  if (headers[0]?.startsWith("Sleep Score 1 Day")) {
    return [parseOneDayReport(input, lines)];
  }

  if (headers[0]?.startsWith("Sleep Score 7 Days") || headers[0]?.startsWith("Sleep Score 4 Weeks")) {
    return parseDailyRows(input, lines);
  }

  return parseAggregateRows(input, referenceDate);
}

function parseAggregateRows(input: SleepCsvInput, referenceDate: Date): SleepImport[] {
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

function parseDailyRows(input: SleepCsvInput, lines: string[]): SleepImport[] {
  const rows = parseCsvLines(lines).map(toDailySleepRow);
  if (rows.length === 0) {
    throw new Error("Sleep CSV does not contain data rows.");
  }

  return rows.map((row) => fromDailyRow(input, row));
}

function parseOneDayReport(input: SleepCsvInput, lines: string[]): SleepImport {
  const values = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const [key, value] = splitCsvLine(line);
    if (key && value) {
      values.set(key, value);
    }
  }

  const date = values.get("Date");
  if (!date) {
    throw new Error("Sleep CSV one-day report is missing Date.");
  }

  return fromDailyRow(input, {
    date,
    sleep_score: numberFrom(values.get("Sleep Score") ?? ""),
    quality: values.get("Quality") ?? "",
    duration_min: parseDuration(values.get("Sleep Duration") ?? ""),
    sleep_need_min: 0,
    avg_bedtime: "",
    avg_wake_time: "",
    resting_hr: numberFrom(values.get("Resting Heart Rate") ?? ""),
    body_battery_change: numberFrom(values.get("Body Battery Change") ?? ""),
    avg_spo2_pct: numberFrom(values.get("Avg SpO₂") ?? ""),
    avg_respiration_brpm: numberFrom(values.get("Avg Respiration") ?? ""),
    avg_overnight_hrv_ms: numberFrom(values.get("Avg Overnight HRV") ?? ""),
    source_period_label: date
  }, {
    awake_restless_min: parseDuration(values.get("Awake Time") ?? ""),
    breathing_variations: values.get("Breathing Variations") ?? "Unknown",
    deep_sleep_min: parseDuration(values.get("Deep Sleep Duration") ?? ""),
    hrv_status: values.get("7d Avg HRV") ?? "Unknown",
    light_sleep_min: parseDuration(values.get("Light Sleep Duration") ?? ""),
    lowest_respiration_brpm: numberFrom(values.get("Lowest Respiration") ?? ""),
    lowest_spo2_pct: numberFrom(values.get("Lowest SpO2") ?? ""),
    rem_sleep_min: parseDuration(values.get("REM Duration") ?? ""),
    restless_moments: numberFrom(values.get("Restless Moments") ?? ""),
    stress_avg: numberFrom(values.get("Stress Avg") ?? "")
  });
}

function fromDailyRow(
  input: SleepCsvInput,
  row: GarminSleepDailyCsvRow,
  details: Partial<SleepImport> = {}
): SleepImport {
  const date = new Date(`${row.date}T00:00:00.000Z`).toISOString();
  const quality = row.quality || classifyQuality(row.sleep_score);
  const sleepNeedMin = row.sleep_need_min;

  return {
    athlete_id: input.athlete_id,
    source: input.source ?? "garmin_export",
    sleep_score: row.sleep_score,
    quality,
    duration_min: row.duration_min,
    summary: sleepNeedMin > 0 && row.duration_min + 20 < sleepNeedMin ? "Below sleep need" : "Daily sleep summary",
    stress_avg: details.stress_avg ?? 0,
    stress_rating: classifyStress(details.stress_avg ?? 0),
    deep_sleep_min: details.deep_sleep_min ?? 0,
    light_sleep_min: details.light_sleep_min ?? row.duration_min,
    rem_sleep_min: details.rem_sleep_min ?? 0,
    awake_restless_min: details.awake_restless_min ?? 0,
    restless_moments: details.restless_moments ?? 0,
    breathing_variations: details.breathing_variations ?? "Unknown",
    avg_overnight_hr: details.avg_overnight_hr ?? 0,
    resting_hr: row.resting_hr,
    body_battery_change: row.body_battery_change,
    avg_spo2_pct: row.avg_spo2_pct,
    lowest_spo2_pct: details.lowest_spo2_pct ?? 0,
    avg_respiration_brpm: row.avg_respiration_brpm,
    lowest_respiration_brpm: details.lowest_respiration_brpm ?? 0,
    avg_overnight_hrv_ms: row.avg_overnight_hrv_ms,
    hrv_status: details.hrv_status ?? "Unknown",
    source_file_name: input.file_name,
    source_format: "csv",
    source_period_label: row.source_period_label,
    source_period_start: date,
    source_period_end: date,
    sleep_need_min: sleepNeedMin,
    avg_bedtime: row.avg_bedtime,
    avg_wake_time: row.avg_wake_time
  };
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
  return parseCsvLines(normalizedLines(content));
}

function parseCsvLines(lines: string[]): Array<Record<string, string>> {
  const headers = splitCsvLine(lines[0]);
  return lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

function normalizedLines(content: string): string[] {
  return content.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
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
  const minutes = Number(value.match(/(\d+)\s*m(?:in)?/)?.[1] ?? 0);
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
  const number = Number(value.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function classifyQuality(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

function classifyStress(stressAvg: number): string {
  if (stressAvg === 0) return "Unknown";
  if (stressAvg <= 25) return "Good";
  if (stressAvg <= 40) return "Fair";
  return "Poor";
}

function toDailySleepRow(row: Record<string, string>): GarminSleepDailyCsvRow {
  const date = row["Sleep Score 7 Days"] || row["Sleep Score 4 Weeks"];
  return {
    date,
    sleep_score: numberFrom(row.Score ?? ""),
    resting_hr: numberFrom(row["Resting Heart Rate"] ?? ""),
    body_battery_change: numberFrom(row["Body Battery"] ?? ""),
    avg_spo2_pct: numberFrom(row["Pulse Ox"] ?? ""),
    avg_respiration_brpm: numberFrom(row.Respiration ?? ""),
    avg_overnight_hrv_ms: numberFrom(row["HRV Status"] ?? ""),
    quality: row.Quality ?? "",
    duration_min: parseDuration(row.Duration ?? ""),
    sleep_need_min: parseDuration(row["Sleep Need"] ?? ""),
    avg_bedtime: row.Bedtime ?? "",
    avg_wake_time: row["Wake Time"] ?? "",
    source_period_label: date
  };
}
