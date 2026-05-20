# Architecture

The platform is split into clear service boundaries:

- `apps/backend`: Express API, import service, agent pipeline, Vault integration, Couchbase persistence.
- `apps/frontend`: Nuxt 4, Vue 3, Tailwind CSS cockpit UI.
- `infra/couchbase`: local bucket, scope, collection, and index bootstrap.
- `infra/vault`: AppRole, policy, KV, and transit bootstrap.
- `infra/prometheus`: metrics scrape configuration.
- `infra/grafana`: provisioned Prometheus datasource and ops dashboard.
- `infra/alloy`: Grafana Alloy collector configuration.
- `infra/blackbox`: HTTP probe configuration for service health.
- `samples`: sample Garmin-style JSON imports.

## Event Flow

1. Import endpoint receives a typed JSON payload.
2. Backend validates payload with Zod.
3. Record is stored in the matching Couchbase collection.
4. Import service loads latest athlete context.
5. Autonomous agent pipeline runs deterministic analysis.
6. Findings, recommendation, and audit events are stored.
7. UI reads dashboard state from the backend.
8. Coach approves or rejects pending recommendation.

## LLM Boundary

Ollama is used only for explanation writing. Readiness state, risk signals, and suggested session are produced by deterministic rules first.

## Persistence

Couchbase uses:

- Bucket: `running_coach`
- Scope: `coach`
- Collections: one collection per domain object.

The backend uses Couchbase Query API over HTTP to avoid native SDK build requirements in local environments.

## Observability Boundary

Prometheus is the metrics store. It scrapes backend application metrics and blackbox service probes for backend, frontend, Couchbase, Vault, Ollama, and Grafana health. Grafana visualizes those signals in the `Running Coach Ops` dashboard.

Grafana Alloy is included as the modern collector foundation and currently publishes Alloy self-metrics into Prometheus. Container log collection is intentionally not enabled because Prometheus is not a log store. Adding log exploration should use Loki or another log backend with strict redaction rules and metadata-only events.

Backend metrics are designed to avoid personal athlete payloads. Labels use bounded metadata such as import type, result, readiness state, agent name, severity, Ollama model, and Vault operation.
