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

export interface CouchbaseStoreConfig {
  connectionString: string;
  username: string;
  password: string;
  bucketName: string;
  scopeName: string;
}

interface QueryResponse<T> {
  results?: T[];
  errors?: Array<{ msg: string }>;
}

export class CouchbaseStore implements DataStore {
  private readonly queryUrl: string;
  private readonly authorization: string;

  private constructor(private readonly config: CouchbaseStoreConfig) {
    const host = config.connectionString.replace("couchbase://", "http://").replace("http://", "");
    this.queryUrl = `http://${host}:8093/query/service`;
    this.authorization = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
  }

  static async connect(config: CouchbaseStoreConfig): Promise<CouchbaseStore> {
    const store = new CouchbaseStore(config);
    await store.query("SELECT 1 AS ok", {});
    return store;
  }

  async save<T extends BaseDocument>(collection: CollectionName, document: T): Promise<T> {
    await this.query(
      `UPSERT INTO ${this.path(collection)} (KEY, VALUE)
       VALUES ($id, $document)`,
      { id: document.id, document }
    );
    return document;
  }

  async getAthleteContext(athleteId: string): Promise<AthleteContext> {
    return {
      athleteId,
      latestActivity: await this.latest<ActivityRecord>("activities", athleteId),
      latestSleep: await this.latest<SleepRecord>("sleep_records", athleteId),
      latestStress: await this.latest<StressRecord>("stress_records", athleteId)
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
      auditEvents: await this.byAthlete<AuditEvent>("audit_events", athleteId)
    };
  }

  async listFindings(athleteId: string): Promise<AgentFinding[]> {
    return this.byAthlete<AgentFinding>("agent_findings", athleteId);
  }

  async listRecommendations(athleteId: string): Promise<Recommendation[]> {
    return this.byAthlete<Recommendation>("recommendations", athleteId);
  }

  async updateRecommendationStatus(id: string, status: "approved" | "rejected"): Promise<Recommendation> {
    const rows = await this.query<{ item: Recommendation }>(
      `UPDATE ${this.path("recommendations")} AS item
       USE KEYS $id
       SET item.status = $status, item.updated_at = $updatedAt
       RETURNING item`,
      { id, status, updatedAt: new Date().toISOString() }
    );
    const recommendation = rows[0]?.item;
    if (!recommendation) {
      throw new Error("Recommendation not found.");
    }
    return recommendation;
  }

  private async latest<T extends BaseDocument>(collection: CollectionName, athleteId: string): Promise<T | undefined> {
    const items = await this.byAthlete<T>(collection, athleteId, 1);
    return items[0];
  }

  private async byAthlete<T extends BaseDocument>(
    collection: CollectionName,
    athleteId: string,
    limit = 25
  ): Promise<T[]> {
    const rows = await this.query<{ item: T }>(
      `SELECT item
       FROM ${this.path(collection)} AS item
       WHERE item.athlete_id = $athleteId
       ORDER BY item.created_at DESC, IFMISSINGORNULL(item.source_period_start, "") DESC, item.updated_at DESC
       LIMIT $limit`,
      { athleteId, limit }
    );
    return rows.map((row) => row.item);
  }

  private path(collection: CollectionName): string {
    return `\`${this.config.bucketName}\`.\`${this.config.scopeName}\`.\`${collection}\``;
  }

  private async query<T>(statement: string, parameters: Record<string, unknown>): Promise<T[]> {
    const namedParameters = Object.fromEntries(Object.entries(parameters).map(([key, value]) => [`$${key}`, value]));
    const body = JSON.stringify({
      statement,
      scan_consistency: "request_plus",
      timeout: "20s",
      ...namedParameters
    });

    const response = await fetch(this.queryUrl, {
      method: "POST",
      headers: {
        authorization: this.authorization,
        "content-type": "application/json"
      },
      body
    });

    const payload = (await response.json()) as QueryResponse<T>;
    if (!response.ok || payload.errors?.length) {
      throw new Error(payload.errors?.map((error) => error.msg).join("; ") || `Couchbase query failed: ${response.status}`);
    }

    return payload.results ?? [];
  }
}
