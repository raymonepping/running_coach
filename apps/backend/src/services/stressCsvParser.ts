import type { StressRecord } from "../domain/types.js";

type StressImport = Omit<StressRecord, "id" | "type" | "created_at" | "updated_at" | "schema_version">;

export interface StressCsvInput {
  athlete_id: string;
  source?: StressRecord["source"];
  file_name: string;
  content: string;
}

export interface StressHeartCsvInput {
  athlete_id: string;
  source?: StressRecord["source"];
  stress_file_name: string;
  stress_content: string;
  heart_file_name: string;
  heart_content: string;
}

interface GarminStressCsvRow {
  Date: string;
  Average: string;
  Rest: string;
  Low: string;
  Medium: string;
  High: string;
}

interface GarminHeartCsvRow {
  Date: string;
  Resting: string;
  High: string;
}

interface HeartImport {
  source_date: string;
  resting_hr_bpm: number;
  high_hr_bpm: number;
}

export function parseStressCsv(input: StressCsvInput): StressImport[] {
  const rows = parseCsv(input.content).map(toGarminStressRow);
  if (rows.length === 0) {
    throw new Error("Stress CSV does not contain data rows.");
  }

  return rows.map((row) => toStressImport(input, row));
}

export function parseStressHeartCsv(input: StressHeartCsvInput): StressImport[] {
  const stressRecords = parseStressCsv({
    athlete_id: input.athlete_id,
    content: input.stress_content,
    file_name: input.stress_file_name,
    source: input.source
  });
  const heartRecords = parseHeartCsv({
    content: input.heart_content,
    file_name: input.heart_file_name
  });
  const heartByDate = new Map(heartRecords.map((record) => [record.source_date, record]));

  return stressRecords.map((record) => {
    const heart = heartByDate.get(record.source_date ?? "");
    if (!heart) return record;

    return {
      ...record,
      heart_rate_pressure: classifyHeartRatePressure(heart),
      high_hr_bpm: heart.high_hr_bpm,
      resting_hr_bpm: heart.resting_hr_bpm,
      source_heart_file_name: input.heart_file_name
    };
  });
}

function toGarminStressRow(row: Record<string, string>): GarminStressCsvRow {
  return {
    Date: row.Date ?? "",
    Average: row.Average ?? "",
    Rest: row.Rest ?? "",
    Low: row.Low ?? "",
    Medium: row.Medium ?? "",
    High: row.High ?? ""
  };
}

function toStressImport(input: StressCsvInput, row: GarminStressCsvRow): StressImport {
  const date = parseDate(row.Date);
  const restMin = parseDuration(row.Rest);
  const lowStressMin = parseDuration(row.Low);
  const mediumStressMin = parseDuration(row.Medium);
  const highStressMin = parseDuration(row.High);
  const observedMin = restMin + lowStressMin + mediumStressMin + highStressMin;

  return {
    athlete_id: input.athlete_id,
    source: input.source ?? "garmin_export",
    overall_stress: numberFrom(row.Average),
    rest_min: restMin,
    low_stress_min: lowStressMin,
    medium_stress_min: mediumStressMin,
    high_stress_min: highStressMin,
    high_stress_ratio: ratio(highStressMin, observedMin),
    rest_ratio: ratio(restMin, observedMin),
    stress_load_min: mediumStressMin + highStressMin,
    source_file_name: input.file_name,
    source_format: "csv",
    source_date: date
  };
}

function parseHeartCsv(input: Pick<StressHeartCsvInput, "heart_content" | "heart_file_name"> | { content: string; file_name: string }): HeartImport[] {
  const content = "content" in input ? input.content : input.heart_content;
  const rows = parseCsv(content).map(toGarminHeartRow);
  if (rows.length === 0) {
    throw new Error("Heart CSV does not contain data rows.");
  }

  return rows.map((row) => ({
    high_hr_bpm: numberFrom(row.High),
    resting_hr_bpm: numberFrom(row.Resting),
    source_date: parseDate(row.Date)
  }));
}

function toGarminHeartRow(row: Record<string, string>): GarminHeartCsvRow {
  return {
    Date: row.Date ?? "",
    High: row.High ?? "",
    Resting: row.Resting ?? ""
  };
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = normalizedLines(content);
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
    if ((char === "," || char === ";") && !quoted) {
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

function numberFrom(value: string): number {
  const number = Number(value.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function parseDate(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length < 2) {
    throw new Error(`Unable to parse stress CSV date: ${dateStr}`);
  }

  const day = Number(parts[0]);
  const monthText = parts[1].toLowerCase();
  const year = parts.length === 3 ? Number(parts[2]) : new Date().getFullYear();

  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const monthIndex = months.findIndex((m) => monthText.includes(m));
  
  if (monthIndex === -1 || !day) {
    throw new Error(`Unable to parse stress CSV date: ${dateStr}`);
  }

  return new Date(Date.UTC(year, monthIndex, day)).toISOString();
}

function ratio(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 1000;
}

function classifyHeartRatePressure(record: HeartImport): string {
  if (record.resting_hr_bpm >= 65 && record.high_hr_bpm >= 180) return "elevated_resting_and_high_peak";
  if (record.resting_hr_bpm >= 65) return "elevated_resting";
  if (record.high_hr_bpm >= 180) return "high_peak";
  return "normal";
}
