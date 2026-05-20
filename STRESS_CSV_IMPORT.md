# Stress CSV Import Feature

## Overview

Added support for importing Garmin stress CSV exports to track daily stress levels and time distribution across rest, low, medium, and high stress periods. Stress can also be imported together with Garmin heart-rate CSV data so daily stress records include resting heart rate, daily high heart rate, and a deterministic heart-rate pressure classification.

## CSV Format

The parser expects Garmin stress CSV files with the following format:

```csv
Date;Average;Rest;Low;Medium;High
19/May;39;5h 9min;5h 16min;2h 20min;1h 33min
18/May;29;10h 13min;5h 51min;2h 28min;14min
```

The paired heart-rate CSV format is:

```csv
Date;Resting;High
19/May;62 bpm;112 bpm
18/May;56 bpm;153 bpm
```

### Fields

- **Date**: Date in format `DD/MMM` or `DD/MMM/YYYY` (e.g., `19/May` or `19/May/2026`)
- **Average**: Overall stress level (0-100)
- **Rest**: Time spent in rest state (e.g., `5h 9min`)
- **Low**: Time spent in low stress (e.g., `5h 16min`)
- **Medium**: Time spent in medium stress (e.g., `2h 20min`)
- **High**: Time spent in high stress (e.g., `1h 33min`)

### Delimiter Support

The parser supports both semicolon (`;`) and comma (`,`) delimiters.

## Implementation

### Backend Components

1. **Parser**: `apps/backend/src/services/stressCsvParser.ts`
   - Parses Garmin stress CSV format
   - Converts duration strings to minutes
   - Handles date parsing with year inference
   - Supports semicolon and comma delimiters

2. **Import Service**: `apps/backend/src/services/importService.ts`
   - Added `importStressCsv()` method
   - Creates stress records with CSV metadata
   - Triggers autonomous agent pipeline
   - Writes audit events

3. **API Endpoint**: `/api/import/stress-csv`
   - POST endpoint for stress CSV uploads
   - Validates input with Zod schema
   - Returns agent run results

4. **Schema**: `apps/backend/src/domain/schemas.ts`
   - Added `stressCsvImportSchema` for validation
   - Accepts file_name and content (max 2MB)

5. **Type Extensions**: `apps/backend/src/domain/types.ts`
   - Extended `StressRecord` with optional CSV metadata:
     - `source_file_name`
     - `source_format`
     - `source_date`

### Frontend Components

1. **API Composable**: `apps/frontend/app/composables/useCoachApi.ts`
   - Added `importStressCsv()` method
   - Sends CSV content to backend

2. **Import Page**: `apps/frontend/app/pages/import/[kind].vue`
   - Added stress CSV file upload UI
   - Purple-themed upload card
   - File validation and error handling
   - Success feedback with agent confirmation

## Usage

### Via Web UI

1. Navigate to http://localhost:5173/import/stress
2. Use `Garmin stress CSV` for stress-only imports, or `Stress + heart-rate CSV` when both files are available.
3. Select your Garmin stress CSV export file and, for the paired flow, your heart-rate CSV export file.
4. The files are uploaded, parsed, joined by date, and processed automatically.
5. Autonomous agents run and create recommendations.

### Via API

```bash
curl -X POST http://localhost:8080/api/import/stress-csv \
  -H 'Content-Type: application/json' \
  -d '{
    "athlete_id": "demo-athlete",
    "file_name": "stress.csv",
    "content": "Date;Average;Rest;Low;Medium;High\n19/May;39;5h 9min;5h 16min;2h 20min;1h 33min"
  }'
```

## Sample Data

A sample stress CSV file is available at `samples/stress.sample.csv` with 5 days of stress data.

## Testing

Unit tests are available in `apps/backend/test/stressCsvParser.test.ts`:

```bash
npm test -- stressCsvParser.test.ts
```

Tests verify:
- CSV parsing with semicolon delimiter
- Duration conversion (hours and minutes to total minutes)
- Date parsing with year inference
- Error handling for empty files

## Data Storage

Each CSV row creates a `StressRecord` document in the `stress_records` collection with:

- Parsed stress metrics (overall_stress, rest_min, low_stress_min, medium_stress_min, high_stress_min)
- Source metadata (file_name, format, date)
- Standard document fields (id, type, athlete_id, source, timestamps, schema_version)

## Autonomous Processing

After import:
1. Records are stored in Couchbase
2. Audit event is created: `stress_csv.imported`
3. Agent pipeline loads latest athlete context
4. Agents analyze stress patterns
5. Findings and recommendations are generated
6. Results are available in the dashboard

## Derived Signals

- `stress_load_min`: medium plus high stress minutes.
- `high_stress_ratio`: high-stress minutes divided by observed stress minutes.
- `rest_ratio`: rest minutes divided by observed stress minutes.
- `heart_rate_pressure`: `normal`, `elevated_resting`, `high_peak`, or `elevated_resting_and_high_peak`.
