#!/usr/bin/env bash
set -euo pipefail

HOST="${COUCHBASE_HOST:-couchbase}"
USER="${COUCHBASE_ADMINISTRATOR_USERNAME:-Administrator}"
PASSWORD="${COUCHBASE_ADMINISTRATOR_PASSWORD:-local-demo-password}"
BUCKET="${COUCHBASE_BUCKET:-running_coach}"
SCOPE="${COUCHBASE_SCOPE:-coach}"

until couchbase-cli server-list -c "$HOST" -u "$USER" -p "$PASSWORD" >/dev/null 2>&1; do
  if couchbase-cli cluster-init \
    -c "$HOST" \
    --cluster-username "$USER" \
    --cluster-password "$PASSWORD" \
    --services data,index,query \
    --cluster-ramsize 1024 \
    --cluster-index-ramsize 256 >/dev/null 2>&1; then
    break
  fi
  sleep 3
done

if ! couchbase-cli bucket-list -c "$HOST" -u "$USER" -p "$PASSWORD" | grep -q "^$BUCKET "; then
  couchbase-cli bucket-create \
    -c "$HOST" \
    -u "$USER" \
    -p "$PASSWORD" \
    --bucket "$BUCKET" \
    --bucket-type couchbase \
    --bucket-ramsize 256 \
    --enable-flush 1 || true
fi

sleep 8

couchbase-cli collection-manage -c "$HOST" -u "$USER" -p "$PASSWORD" --bucket "$BUCKET" --create-scope "$SCOPE" || true

for collection in athlete_profiles activities sleep_records stress_records heart_records recovery_snapshots agent_findings recommendations audit_events; do
  couchbase-cli collection-manage \
    -c "$HOST" \
    -u "$USER" \
    -p "$PASSWORD" \
    --bucket "$BUCKET" \
    --create-collection "$SCOPE.$collection" || true
done

for collection in activities sleep_records stress_records heart_records agent_findings recommendations audit_events; do
  cbq -e "http://$HOST:8091" -u "$USER" -p "$PASSWORD" \
    --script="CREATE PRIMARY INDEX IF NOT EXISTS ON \`$BUCKET\`.\`$SCOPE\`.\`$collection\`;"
done
