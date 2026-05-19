import { loadEnv } from "./config/env.js";
import { createStore } from "./db/createStore.js";
import { createApp } from "./api/app.js";
import { ImportService } from "./services/importService.js";
import { logger } from "./services/logger.js";
import { OllamaInsightGenerator } from "./services/ollamaClient.js";
import { loadVaultSecrets } from "./services/vaultClient.js";

async function main() {
  const env = loadEnv();
  const secrets = await loadVaultSecrets(env);
  const store = await createStore(env, secrets);
  const insightGenerator = new OllamaInsightGenerator(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL);
  const importService = new ImportService(store, insightGenerator);
  const app = createApp({ store, importService });

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Running coach backend listening.");
  });
}

main().catch((error) => {
  logger.fatal({ error }, "Backend startup failed.");
  process.exit(1);
});
