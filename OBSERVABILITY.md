# Observability

The local stack includes Grafana, Prometheus, Grafana Alloy, and Blackbox Exporter.

## Services

- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Prometheus targets: http://localhost:9090/targets
- Alloy: http://localhost:12345
- Backend metrics: http://localhost:8080/metrics

Grafana credentials are controlled by:

```bash
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=local-grafana-password
```

## Dashboards

Grafana provisions one dashboard automatically:

- `Running Coach / Running Coach Ops`

It includes:

- System Overview: backend, frontend, Couchbase, Vault, Ollama, and Grafana probes.
- Backend HTTP: request rate and p95 latency.
- Agent Runs: autonomous pipeline success/failure and recommendation creation.
- Security Events: Vault AppRole login and secret-read outcomes.
- Ollama Activity: local model calls and outcomes.
- Couchbase Activity: service probe health and latency.

## Privacy Boundary

Do not put raw athlete data into logs or metric labels.

Allowed observability metadata:

- import type
- import result
- row counts
- agent name
- finding severity
- readiness state
- recommendation review status
- Ollama model name
- Vault operation result
- HTTP route template and status code

Not allowed:

- raw sleep rows
- raw stress rows
- raw heart-rate rows
- raw activity tracks
- Vault tokens or secret IDs
- Couchbase passwords
- full LLM prompts

## Prometheus Is Not A Log Store

Prometheus stores metrics. It does not provide central log storage or log exploration.

Grafana Alloy is included as the modern collector foundation and publishes its own self-metrics to Prometheus. Container log collection should only be enabled after adding a real log backend such as Loki and after confirming the backend logs remain metadata-only.
