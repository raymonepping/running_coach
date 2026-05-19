# Data Model

Every document includes:

- `id`
- `type`
- `athlete_id`
- `source`
- `created_at`
- `updated_at`
- `schema_version`

## Collections

- `athlete_profiles`
- `activities`
- `sleep_records`
- `stress_records`
- `recovery_snapshots`
- `agent_findings`
- `recommendations`
- `audit_events`

## Recommendation Status

Recommendations start as `pending`. They can only become `approved` or `rejected` through explicit human review endpoints.

## Audit Events

Every autonomous action writes an audit event. Approval and rejection actions also write audit events with actor `coach`.
