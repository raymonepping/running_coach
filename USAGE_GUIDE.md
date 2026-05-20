# Stress CSV Import - Usage Guide

## Accessing the Import Page

Navigate to: **http://localhost:5173/import/stress**

## What You'll See

### Page Header
- **Title**: "Stress import"
- **Description**: "Import daily stress pressure to correlate adaptation load with recovery capacity."

### Import Section

You'll see a stress upload card with:

```
┌─────────────────────────────────────────────────────────┐
│  Garmin stress CSV                    [Choose CSV]      │
│  Import Garmin stress CSV exports with daily stress     │
│  levels and time distribution.                          │
└─────────────────────────────────────────────────────────┘
```

### Steps to Import

1. **Click "Choose CSV"** button in the stress card
2. **Select your Garmin stress CSV file** from your computer
3. For smarter analysis, also use the **Stress + heart-rate CSV** card and select both `stress.csv` and `Heart.csv`.
4. The file will be automatically:
   - Uploaded to the backend
   - Parsed (converts your data format)
   - Joined by date when heart-rate data is present
   - Stored in the database
   - Analyzed by autonomous agents
5. **Success message appears** after the autonomous agents run.

## Your CSV Format

Your stress data format is supported:
```csv
Date;Average;Rest;Low;Medium;High
19/May;39;5h 9min;5h 16min;2h 20min;1h 33min
18/May;29;10h 13min;5h 51min;2h 28min;14min
17/May;31;9h 47min;8h 45min;1h 20min;43min
16/May;47;2h 56min;8h 35min;6h 24min;1h 41min
15/May;42;6h 48min;5h 15min;3h 25min;3h 7min
```

## What Happens After Import

1. **Data Storage**: Each row becomes a stress record in the database
2. **Heart Join**: If a heart CSV is provided, matching dates add resting HR, high HR, and heart-rate pressure
3. **Agent Analysis**: Autonomous agents analyze stress patterns
4. **Recommendations**: System generates coaching recommendations
5. **Dashboard Update**: View results at http://localhost:5173

## Comparison with Sleep Import

Both work the same way:

| Feature | Sleep Import | Stress Import |
|---------|-------------|---------------|
| Page URL | /import/sleep | /import/stress |
| Card Color | Yellow | Orange |
| Button Text | "Choose CSV" | "Choose CSV" |
| File Type | .csv | .csv |
| Auto-processing | ✅ Yes | ✅ Yes |
| Agent Pipeline | ✅ Runs | ✅ Runs |

## Troubleshooting

If the button doesn't appear:
1. Make sure you're on `/import/stress` (not `/import/sleep`)
2. Check browser console for errors
3. Verify the application is running: `docker compose up`

The button is implemented and ready to use!
