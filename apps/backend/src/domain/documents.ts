import type { BaseDocument, RecordSource } from "./types.js";

export function createBaseDocument<T extends string>(
  type: T,
  athleteId: string,
  source: RecordSource
): BaseDocument & { type: T } {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    type,
    athlete_id: athleteId,
    source,
    created_at: now,
    updated_at: now,
    schema_version: 1
  };
}
