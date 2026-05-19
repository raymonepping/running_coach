import type {
  ActivityRecord,
  AgentFinding,
  AthleteContext,
  AuditEvent,
  BaseDocument,
  Recommendation,
  SleepRecord,
  StressRecord
} from "../domain/types.js";
import type { CollectionName, DashboardData, DataStore } from "./dataStore.js";

export class MemoryStore implements DataStore {
  private readonly collections = new Map<CollectionName, BaseDocument[]>();

  async save<T extends BaseDocument>(collection: CollectionName, document: T): Promise<T> {
    const items = this.collections.get(collection) ?? [];
    items.push(document);
    this.collections.set(collection, items);
    return document;
  }

  async getAthleteContext(athleteId: string): Promise<AthleteContext> {
    return {
      athleteId,
      latestActivity: this.latest<ActivityRecord>("activities", athleteId),
      latestSleep: this.latest<SleepRecord>("sleep_records", athleteId),
      latestStress: this.latest<StressRecord>("stress_records", athleteId)
    };
  }

  async getDashboard(athleteId: string): Promise<DashboardData> {
    const context = await this.getAthleteContext(athleteId);
    const findings = await this.listFindings(athleteId);
    const recommendations = await this.listRecommendations(athleteId);
    return {
      athleteId,
      latestActivity: context.latestActivity,
      latestSleep: context.latestSleep,
      latestStress: context.latestStress,
      latestRecommendation: recommendations[0],
      findings,
      recommendations,
      auditEvents: this.byAthlete<AuditEvent>("audit_events", athleteId)
    };
  }

  async listFindings(athleteId: string): Promise<AgentFinding[]> {
    return this.byAthlete<AgentFinding>("agent_findings", athleteId);
  }

  async listRecommendations(athleteId: string): Promise<Recommendation[]> {
    return this.byAthlete<Recommendation>("recommendations", athleteId);
  }

  async updateRecommendationStatus(id: string, status: "approved" | "rejected"): Promise<Recommendation> {
    const recommendations = (this.collections.get("recommendations") ?? []) as Recommendation[];
    const recommendation = recommendations.find((item) => item.id === id);
    if (!recommendation) {
      throw new Error("Recommendation not found.");
    }
    recommendation.status = status;
    recommendation.updated_at = new Date().toISOString();
    return recommendation;
  }

  private latest<T extends BaseDocument>(collection: CollectionName, athleteId: string): T | undefined {
    return this.byAthlete<T>(collection, athleteId)[0];
  }

  private byAthlete<T extends BaseDocument>(collection: CollectionName, athleteId: string): T[] {
    return ((this.collections.get(collection) ?? []) as T[])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.athlete_id === athleteId)
      .sort((a, b) => {
        const byDate = b.item.created_at.localeCompare(a.item.created_at);
        return byDate === 0 ? b.index - a.index : byDate;
      })
      .map(({ item }) => item);
  }
}
