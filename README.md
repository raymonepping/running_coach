# Running Coach

Local-first autonomous adaptation intelligence for runners.

This is not ChatGPT for runners. The primary workflow is event-driven: when activity, sleep, stress, or recovery data is imported, the backend stores the record, runs deterministic coaching agents, writes audit events, and creates explainable recommendations without waiting for a chat prompt.

## What It Does

- Imports Garmin-style activity, sleep, stress, and recovery JSON.
- Imports Garmin GPX/TCX activity files, normalizes run metrics, and triggers agents automatically.
- Imports Garmin sleep CSV summary exports and stores each period as a sleep record.
- Stores JSON documents in Couchbase using one bucket, one scope, and domain collections.
- Runs an autonomous agent pipeline after every import.
- Uses rule-based readiness classification before any LLM summary.
- Uses Ollama locally for natural-language insight writing.
- Uses HashiCorp Vault AppRole for backend identity and Vault KV for Couchbase credentials.
- Enables Vault transit for encryption workflows.
- Requires human approval before a recommendation is accepted.

## Start The Stack

```bash
cp .env.example .env
docker compose -f compose.yml up --build
```

Podman-compatible compose:

```bash
podman-compose -f compose.yml up --build
```

The first run pulls the configured Ollama model. The default is `llama3.1:8b`.

Services:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/health
- Couchbase UI: http://localhost:8091
- Vault: http://localhost:8200
- Mailpit: http://localhost:8025

## Import Sample Data

```bash
curl -sS -X POST http://localhost:8080/api/import/activity \
  -H 'content-type: application/json' \
  --data @samples/activity.sample.json

curl -sS -X POST http://localhost:8080/api/import/sleep \
  -H 'content-type: application/json' \
  --data @samples/sleep.sample.json

curl -sS -X POST http://localhost:8080/api/import/stress \
  -H 'content-type: application/json' \
  --data @samples/stress.sample.json
```

You can also import a Garmin activity file from the web UI:

1. Open http://localhost:5173/import/activity
2. Choose a `.tcx` or `.gpx` file.
3. The backend stores a normalized `activity` document with source file metadata, writes audit events, and runs the agent pipeline.

TCX is preferred when available because it usually contains lap, heart-rate, speed, cadence, and power fields. GPX is supported and derives distance from track coordinates.

Garmin sleep CSV exports can be imported from the web UI:

1. Open http://localhost:5173/import/sleep
2. Choose a `.csv` file exported from Garmin sleep reports.
3. The backend stores each CSV row as a `sleep` document, records source period metadata, writes an audit event, and runs the agent pipeline.

Yearly, monthly, and seven-day Garmin summary exports are supported when they use the columns `Date`, `Avg Score`, `Avg Quality`, `Avg Duration`, `Avg Sleep Need`, `Avg Bedtime`, and `Avg Wake Time`. These exports are aggregate summaries, so detailed sleep-stage, HRV, SpO2, and overnight stress fields remain unavailable unless imported through richer sleep JSON later.

Then open:

```bash
curl -sS http://localhost:8080/api/athletes/demo-athlete/dashboard
```

## Local Development

```bash
npm install
npm run dev:backend
npm run dev:frontend
npm test
npm run lint
npm run build
```

## Security Notes

Local demo credentials live only in `.env.example`. Production secrets should be written to Vault and read through AppRole. The backend redacts sensitive values in logs and does not hardcode production credentials.

This system provides coaching support, not diagnosis or medical advice.
