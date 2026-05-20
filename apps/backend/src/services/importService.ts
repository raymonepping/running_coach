import { createBaseDocument } from "../domain/documents.js";
import type {
  ActivityRecord,
  AgentRunResult,
  HeartRateRecord,
  RecoverySnapshot,
  SleepRecord,
  StressRecord
} from "../domain/types.js";
import { runAgentPipeline, type InsightGenerator } from "../agents/agentPipeline.js";
import type { DataStore } from "../db/dataStore.js";
import { parseActivityFile, type ActivityFileInput } from "./activityFileParser.js";
import { parseSleepCsv, type SleepCsvInput } from "./sleepCsvParser.js";
import {
  parseHeartCsv,
  parseStressCsv,
  parseStressHeartCsv,
  type HeartCsvInput,
  type StressCsvInput,
  type StressHeartCsvInput
} from "./stressCsvParser.js";

export class ImportService {
  constructor(
    private readonly store: DataStore,
    private readonly insightGenerator?: InsightGenerator
  ) {}

  async importActivity(input: Omit<ActivityRecord, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: ActivityRecord["source"] }): Promise<AgentRunResult> {
    const document = { ...createBaseDocument("activity", input.athlete_id, input.source ?? "api"), ...input } as ActivityRecord;
    await this.store.save("activities", document);
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importActivityFile(input: ActivityFileInput): Promise<AgentRunResult> {
    const activity = parseActivityFile(input);
    const document = { ...createBaseDocument("activity", input.athlete_id, "garmin_export"), ...activity } as ActivityRecord;
    await this.store.save("activities", document);
    await this.store.save("audit_events", {
      ...createBaseDocument("audit_event", input.athlete_id, "system"),
      action: "activity_file.imported",
      actor: "system",
      target_id: document.id,
      detail: `Imported ${input.file_type.toUpperCase()} file ${input.file_name} with ${document.source_track_points ?? 0} track points.`
    });
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importSleep(input: Omit<SleepRecord, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: SleepRecord["source"] }): Promise<AgentRunResult> {
    const document = { ...createBaseDocument("sleep", input.athlete_id, input.source ?? "api"), ...input } as SleepRecord;
    await this.store.save("sleep_records", document);
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importSleepCsv(input: SleepCsvInput): Promise<AgentRunResult> {
    const records = parseSleepCsv(input);
    for (const record of records) {
      const document = {
        ...createBaseDocument("sleep", input.athlete_id, "garmin_export"),
        ...record
      } as SleepRecord;
      if (record.source_period_end) {
        document.created_at = toEndOfDayIso(record.source_period_end);
        document.updated_at = document.created_at;
        document.id = sleepDocumentId(input.athlete_id, record);
      }
      await this.store.save("sleep_records", document);
    }
    await this.store.save("audit_events", {
      ...createBaseDocument("audit_event", input.athlete_id, "system"),
      action: "sleep_csv.imported",
      actor: "system",
      detail: `Imported ${records.length} Garmin sleep summary rows from ${input.file_name}.`
    });
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importStress(input: Omit<StressRecord, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: StressRecord["source"] }): Promise<AgentRunResult> {
    const document = { ...createBaseDocument("stress", input.athlete_id, input.source ?? "api"), ...input } as StressRecord;
    await this.store.save("stress_records", document);
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importHeart(input: Omit<HeartRateRecord, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: HeartRateRecord["source"] }): Promise<AgentRunResult> {
    const document = { ...createBaseDocument("heart_rate", input.athlete_id, input.source ?? "api"), ...input } as HeartRateRecord;
    await this.store.save("heart_records", document);
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importStressCsv(input: StressCsvInput): Promise<AgentRunResult> {
    const records = parseStressCsv(input);
    await this.saveStressRecords(input.athlete_id, records);
    await this.store.save("audit_events", {
      ...createBaseDocument("audit_event", input.athlete_id, "system"),
      action: "stress_csv.imported",
      actor: "system",
      detail: `Imported ${records.length} Garmin stress summary rows from ${input.file_name}.`
    });
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importStressHeartCsv(input: StressHeartCsvInput): Promise<AgentRunResult> {
    const records = parseStressHeartCsv(input);
    const heartRecords = parseHeartCsv({
      athlete_id: input.athlete_id,
      content: input.heart_content,
      file_name: input.heart_file_name,
      source: input.source
    });
    await this.saveHeartRecords(input.athlete_id, heartRecords);
    await this.saveStressRecords(input.athlete_id, records);
    await this.store.save("audit_events", {
      ...createBaseDocument("audit_event", input.athlete_id, "system"),
      action: "stress_heart_csv.imported",
      actor: "system",
      detail: `Imported ${records.length} Garmin stress rows enriched with heart-rate data from ${input.heart_file_name}.`
    });
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importHeartCsv(input: HeartCsvInput): Promise<AgentRunResult> {
    const records = parseHeartCsv(input);
    await this.saveHeartRecords(input.athlete_id, records);
    await this.store.save("audit_events", {
      ...createBaseDocument("audit_event", input.athlete_id, "system"),
      action: "heart_csv.imported",
      actor: "system",
      detail: `Imported ${records.length} Garmin heart-rate rows from ${input.file_name}.`
    });
    return this.runAutonomousAgents(input.athlete_id);
  }

  async importRecovery(input: Omit<RecoverySnapshot, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: RecoverySnapshot["source"] }): Promise<AgentRunResult> {
    const document = {
      ...createBaseDocument("recovery_snapshot", input.athlete_id, input.source ?? "api"),
      ...input
    } as RecoverySnapshot;
    await this.store.save("recovery_snapshots", document);
    return this.runAutonomousAgents(input.athlete_id);
  }

  private async runAutonomousAgents(athleteId: string): Promise<AgentRunResult> {
    const context = await this.store.getAthleteContext(athleteId);
    const result = await runAgentPipeline(context, this.insightGenerator);
    for (const finding of result.findings) {
      await this.store.save("agent_findings", finding);
    }
    await this.store.save("recommendations", result.recommendation);
    for (const event of result.auditEvents) {
      await this.store.save("audit_events", event);
    }
    return result;
  }

  private async saveStressRecords(athleteId: string, records: Array<Omit<StressRecord, keyof ReturnType<typeof createBaseDocument>>>): Promise<void> {
    for (const record of records) {
      const document = {
        ...createBaseDocument("stress", athleteId, "garmin_export"),
        ...record
      } as StressRecord;
      if (record.source_date) {
        document.created_at = toEndOfDayIso(record.source_date);
        document.updated_at = document.created_at;
        document.id = documentId(athleteId, "stress", record.source_date);
      }
      await this.store.save("stress_records", document);
    }
  }

  private async saveHeartRecords(athleteId: string, records: Array<Omit<HeartRateRecord, keyof ReturnType<typeof createBaseDocument>>>): Promise<void> {
    for (const record of records) {
      const document = {
        ...createBaseDocument("heart_rate", athleteId, "garmin_export"),
        ...record
      } as HeartRateRecord;
      if (record.source_date) {
        document.created_at = toEndOfDayIso(record.source_date);
        document.updated_at = document.created_at;
        document.id = documentId(athleteId, "heart", record.source_date);
      }
      await this.store.save("heart_records", document);
    }
  }
}

function toEndOfDayIso(value: string): string {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

function documentId(athleteId: string, signal: "heart" | "sleep" | "stress", date: string): string {
  return `${athleteId}:${signal}:${date.slice(0, 10)}`;
}

function sleepDocumentId(
  athleteId: string,
  record: Omit<SleepRecord, keyof ReturnType<typeof createBaseDocument>>
): string {
  const start = record.source_period_start?.slice(0, 10);
  const end = record.source_period_end?.slice(0, 10);
  if (start && end && start !== end) {
    return `${athleteId}:sleep-period:${start}:${end}`;
  }
  return documentId(athleteId, "sleep", record.source_period_end ?? new Date().toISOString());
}
