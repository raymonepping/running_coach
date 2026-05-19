import { createBaseDocument } from "../domain/documents.js";
import type {
  ActivityRecord,
  AgentRunResult,
  RecoverySnapshot,
  SleepRecord,
  StressRecord
} from "../domain/types.js";
import { runAgentPipeline, type InsightGenerator } from "../agents/agentPipeline.js";
import type { DataStore } from "../db/dataStore.js";
import { parseActivityFile, type ActivityFileInput } from "./activityFileParser.js";

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

  async importStress(input: Omit<StressRecord, keyof ReturnType<typeof createBaseDocument>> & { athlete_id: string; source?: StressRecord["source"] }): Promise<AgentRunResult> {
    const document = { ...createBaseDocument("stress", input.athlete_id, input.source ?? "api"), ...input } as StressRecord;
    await this.store.save("stress_records", document);
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
}
