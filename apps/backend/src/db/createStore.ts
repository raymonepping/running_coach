import type { AppEnv } from "../config/env.js";
import { logger } from "../services/logger.js";
import type { RuntimeSecrets } from "../services/vaultClient.js";
import { CouchbaseStore } from "./couchbaseStore.js";
import type { DataStore } from "./dataStore.js";
import { MemoryStore } from "./memoryStore.js";

export async function createStore(env: AppEnv, secrets: RuntimeSecrets): Promise<DataStore> {
  if (env.NODE_ENV === "test") {
    return new MemoryStore();
  }

  const username = secrets.couchbaseUsername ?? env.COUCHBASE_USERNAME;
  const password = secrets.couchbasePassword ?? env.COUCHBASE_PASSWORD;

  if (!username || !password) {
    throw new Error("Couchbase credentials are required. Provide them through Vault or environment variables.");
  }

  try {
    return await CouchbaseStore.connect({
      connectionString: env.COUCHBASE_CONNECTION_STRING,
      username,
      password,
      bucketName: env.COUCHBASE_BUCKET,
      scopeName: env.COUCHBASE_SCOPE
    });
  } catch (error) {
    logger.error({ error }, "Failed to connect to Couchbase.");
    throw error;
  }
}
