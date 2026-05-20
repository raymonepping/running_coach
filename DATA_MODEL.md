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

## Sleep CSV Metadata

Garmin sleep CSV imports are stored as normalized `sleep` documents in the `sleep_records` collection. The importer supports 1-day detail reports, daily rows from 7-day and 4-week reports, and aggregate rows from monthly or yearly reports. Each row becomes one sleep record with the available fields and optional provenance metadata:

- `source_file_name`
- `source_format`
- `source_period_label`
- `source_period_start`
- `source_period_end`
- `sleep_need_min`
- `avg_bedtime`
- `avg_wake_time`

The raw CSV body is not persisted by default. 1-day reports provide the richest detail. Daily 7-day and 4-week reports include recovery metrics such as resting heart rate, body battery, pulse ox, respiration, and HRV. Monthly and yearly summary exports are more aggregated, so unavailable fields remain `0` or `Unknown`.

## Stress And Heart CSV Metadata

Garmin stress CSV imports are stored as normalized `stress` documents in the `stress_records` collection. Each daily row stores average stress plus rest, low, medium, and high stress minutes. The importer also derives:

- `stress_load_min`
- `high_stress_ratio`
- `rest_ratio`
- `source_file_name`
- `source_format`
- `source_date`

When a heart-rate CSV is imported together with stress, rows are joined by `source_date` and the stress record is enriched with:

- `resting_hr_bpm`
- `high_hr_bpm`
- `heart_rate_pressure`
- `source_heart_file_name`

The raw CSV bodies are not persisted by default.

## Audit Events

Every autonomous action writes an audit event. Approval and rejection actions also write audit events with actor `coach`.
