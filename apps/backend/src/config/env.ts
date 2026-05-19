import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8080),
  COUCHBASE_CONNECTION_STRING: z.string().default("couchbase://localhost"),
  COUCHBASE_BUCKET: z.string().default("running_coach"),
  COUCHBASE_SCOPE: z.string().default("coach"),
  COUCHBASE_USERNAME: z.string().optional(),
  COUCHBASE_PASSWORD: z.string().optional(),
  VAULT_ADDR: z.string().optional(),
  VAULT_BACKEND_ROLE_ID: z.string().optional(),
  VAULT_BACKEND_SECRET_ID: z.string().optional(),
  VAULT_SECRET_PATH: z.string().default("secret/data/running-coach/backend"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1:8b")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(): AppEnv {
  return envSchema.parse(process.env);
}
