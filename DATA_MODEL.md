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

## Activity File Metadata

GPX and TCX imports are stored as normalized `activity` documents in the `activities` collection. File imports add optional metadata fields:

- `source_file_name`
- `source_format`
- `source_started_at`
- `source_track_points`
- `source_laps`

The raw file body is not persisted by default. The stored document keeps the derived coaching metrics and enough provenance for audit review.

## Audit Events

Every autonomous action writes an audit event. Approval and rejection actions also write audit events with actor `coach`.
