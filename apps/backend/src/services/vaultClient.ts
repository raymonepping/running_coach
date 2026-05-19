import type { AppEnv } from "../config/env.js";
import { logger } from "./logger.js";

interface VaultLoginResponse {
  auth?: {
    client_token?: string;
  };
}

interface VaultSecretResponse {
  data?: {
    data?: Record<string, string>;
  };
}

export interface RuntimeSecrets {
  couchbaseUsername?: string;
  couchbasePassword?: string;
}

export async function loadVaultSecrets(env: AppEnv): Promise<RuntimeSecrets> {
  if (!env.VAULT_ADDR || !env.VAULT_BACKEND_ROLE_ID || !env.VAULT_BACKEND_SECRET_ID) {
    logger.warn("Vault AppRole credentials not provided; falling back to environment variables.");
    return {};
  }

  const loginResponse = await fetch(`${env.VAULT_ADDR}/v1/auth/approle/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      role_id: env.VAULT_BACKEND_ROLE_ID,
      secret_id: env.VAULT_BACKEND_SECRET_ID
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Vault AppRole login failed with ${loginResponse.status}`);
  }

  const login = (await loginResponse.json()) as VaultLoginResponse;
  const token = login.auth?.client_token;
  if (!token) {
    throw new Error("Vault AppRole login did not return a client token.");
  }

  const secretResponse = await fetch(`${env.VAULT_ADDR}/v1/${env.VAULT_SECRET_PATH}`, {
    headers: { "X-Vault-Token": token }
  });

  if (!secretResponse.ok) {
    throw new Error(`Vault secret read failed with ${secretResponse.status}`);
  }

  const secret = (await secretResponse.json()) as VaultSecretResponse;
  return {
    couchbaseUsername: secret.data?.data?.COUCHBASE_USERNAME,
    couchbasePassword: secret.data?.data?.COUCHBASE_PASSWORD
  };
}
