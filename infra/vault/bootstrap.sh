#!/usr/bin/env sh
set -eu

vault auth enable approle >/dev/null 2>&1 || true
vault secrets enable -path=secret kv-v2 >/dev/null 2>&1 || true
vault secrets enable transit >/dev/null 2>&1 || true

vault policy write running-coach-backend /infra/vault/backend-policy.hcl
vault policy write running-coach-agent /infra/vault/agent-policy.hcl

vault write -f transit/keys/running-coach type=aes256-gcm96 >/dev/null 2>&1 || true

vault kv put secret/running-coach/backend \
  COUCHBASE_USERNAME="$COUCHBASE_ADMINISTRATOR_USERNAME" \
  COUCHBASE_PASSWORD="$COUCHBASE_ADMINISTRATOR_PASSWORD"

vault kv put secret/running-coach/agent \
  OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

vault write auth/approle/role/running-coach-backend \
  token_policies="running-coach-backend" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=24h

vault write auth/approle/role/running-coach-agent \
  token_policies="running-coach-agent" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=24h

vault write auth/approle/role/running-coach-backend/role-id role_id="$VAULT_BACKEND_ROLE_ID"
vault write auth/approle/role/running-coach-agent/role-id role_id="$VAULT_AGENT_ROLE_ID"

vault write auth/approle/role/running-coach-backend/custom-secret-id secret_id="$VAULT_BACKEND_SECRET_ID" >/dev/null 2>&1 || true
vault write auth/approle/role/running-coach-agent/custom-secret-id secret_id="$VAULT_AGENT_SECRET_ID" >/dev/null 2>&1 || true

echo "Vault AppRole, KV, transit, and least-privilege policies initialized."
