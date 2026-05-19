Build a local-first autonomous AI running coach platform.

The system must NOT behave like a chatbot. It must behave like a proactive, event-driven coaching intelligence system.

Core idea:
When new Garmin-style running, sleep, stress, or recovery data is imported, the system automatically analyzes the data, detects meaningful patterns, stores findings, and creates coaching recommendations without the user asking a question.

Stack:
- Node.js / Express backend
- React or Nuxt frontend, choose the simpler maintainable option
- Couchbase as the NoSQL database
- Ollama for local AI reasoning
- HashiCorp Vault for secrets and service identity
- Docker Compose and Podman-compatible compose
- Optional mail container/client for later notification workflow

Use current official behavior where relevant:
- Ollama API runs by default on http://localhost:11434/api and supports local generation and embeddings.
- Vault AppRole is suitable for machine/application authentication.
- Docker Compose should use healthchecks and depends_on conditions where appropriate.
- Couchbase should store JSON documents for activities, sleep records, stress records, agent findings, recommendations, and audit events.

Important product principle:
This is not “ChatGPT for runners”.
This is “autonomous adaptation intelligence”.

The system should continuously answer:
“Is the athlete adapting well to training stress?”

MVP requirements:

1. Data import
Create import endpoints and sample JSON import files for:
- running activity
- sleep data
- stress data
- daily recovery/readiness data

Use the following example data as seed input:

Running activity:
- distance_km: 7.18
- avg_pace_sec_per_km: 488
- avg_moving_pace_sec_per_km: 487
- best_pace_sec_per_km: 328
- avg_speed_kmh: 7.4
- max_speed_kmh: 11.0
- total_time_sec: 3508
- moving_time_sec: 3500
- elapsed_time_sec: 3560
- run_time_sec: 2382
- walk_time_sec: 1126
- avg_hr: 140
- max_hr: 157
- beginning_stamina_pct: 99
- ending_stamina_pct: 82
- min_stamina_pct: 82
- primary_benefit: "Base (Low Aerobic)"
- aerobic_effect: 3.1
- anaerobic_effect: 0.0
- exercise_load: 83
- avg_power_w: 219
- max_power_w: 356
- avg_cadence_spm: 149
- max_cadence_spm: 181
- avg_stride_length_m: 0.82
- avg_vertical_ratio_pct: 9.1
- avg_vertical_oscillation_cm: 7.6
- avg_ground_contact_time_ms: 300
- avg_gc_time_balance_left_pct: 49.3
- avg_gc_time_balance_right_pct: 50.7
- total_ascent_m: 11
- total_descent_m: 10

Sleep:
- sleep_score: 73
- quality: "Fair"
- duration_min: 517
- summary: "Non-restorative"
- stress_avg: 28
- stress_rating: "Poor"
- deep_sleep_min: 61
- light_sleep_min: 386
- rem_sleep_min: 70
- awake_restless_min: 24
- restless_moments: 53
- breathing_variations: "Few"
- avg_overnight_hr: 67
- resting_hr: 62
- body_battery_change: 34
- avg_spo2_pct: 94
- lowest_spo2_pct: 83
- avg_respiration_brpm: 18
- lowest_respiration_brpm: 14
- avg_overnight_hrv_ms: 30
- hrv_status: "Balanced"

Stress:
- overall_stress: 29
- rest_min: 613
- low_stress_min: 351
- medium_stress_min: 148
- high_stress_min: 14

2. Database model
Use Couchbase with clear collections:
- athlete_profiles
- activities
- sleep_records
- stress_records
- recovery_snapshots
- agent_findings
- recommendations
- audit_events

Every document must include:
- id
- type
- athlete_id
- source
- created_at
- updated_at
- schema_version

3. Autonomous agent engine
Implement a backend agent runner that is triggered automatically after import.

Agents:
- Import Normalization Agent
- Session Classifier Agent
- Recovery Intelligence Agent
- Stress Correlation Agent
- Pattern Detection Agent
- Injury Risk Agent
- Adaptive Planning Agent
- Coach Insight Agent
- Safety Guardrail Agent

The first version can use deterministic rules first, then call Ollama to produce natural-language insight summaries.

Do not depend on the LLM for safety-critical classification. Use rule-based thresholds for MVP.

4. Agent behavior
After each import, automatically create:
- findings
- readiness classification
- training interpretation
- risk signals
- suggested next session
- coach-facing summary
- athlete-facing explanation

Example output:
“Recovery mismatch detected. Sleep duration was strong, but sleep quality was fair and marked non-restorative. Daytime stress was controlled, but overnight stress remained poor. Yesterday’s run was low-aerobic and moderate load, so the next session should stay easy unless subjective readiness is high.”

5. Readiness states
Implement these readiness states:
- BUILD
- MAINTAIN
- RECOVER
- REST

Initial logic:
- If sleep quality is poor or non-restorative and stress is high, recommend RECOVER or REST.
- If HRV is balanced, stress is low, sleep is good, and previous load was moderate, recommend BUILD.
- If signals are mixed, recommend MAINTAIN.
- If injury risk signals are present, recommend RECOVER.

6. API endpoints
Create:
- POST /api/import/activity
- POST /api/import/sleep
- POST /api/import/stress
- GET /api/athletes/:id/dashboard
- GET /api/athletes/:id/findings
- GET /api/athletes/:id/recommendations
- POST /api/recommendations/:id/approve
- POST /api/recommendations/:id/reject
- GET /api/health

7. Frontend
Create a dashboard with:
- latest readiness state
- latest run summary
- latest sleep summary
- latest stress summary
- autonomous insights
- recommended next session
- approval/reject buttons
- audit timeline

Keep the UI clean and simple.

8. Vault integration
Create Vault setup files/scripts:
- enable AppRole
- create backend policy
- create agent policy
- create role IDs and secret IDs for backend and agents
- store Couchbase credentials in Vault KV
- backend reads secrets from Vault at startup

Use least privilege by default.
No hardcoded production secrets.
Local demo secrets are allowed only in .env.example.

9. Docker/Podman Compose
Create compose.yml with:
- backend
- frontend
- couchbase
- vault
- ollama
- optional mailhog or mailpit for later notification testing

Include:
- healthchecks
- named volumes
- separate networks if useful
- .env.example
- README instructions

10. Documentation
Create:
- README.md
- ARCHITECTURE.md
- AGENTS.md
- DATA_MODEL.md
- VAULT.md
- ROADMAP.md

README must explain:
- what the project does
- why it is not a chatbot
- how autonomous triggers work
- how to start the stack
- how to import sample data
- how to view generated insights

11. Design constraints
- Keep code modular.
- Use clear service boundaries.
- Use TypeScript if practical.
- No unnecessary dependencies.
- No medical claims.
- The system provides coaching support, not diagnosis.
- All recommendations must be explainable.
- Every autonomous action must write an audit event.
- Human approval is required before any recommendation is marked as accepted.

12. Initial sample insight
When the provided running, sleep, and stress data is imported, the system should generate a finding similar to:

“Controlled aerobic session detected. The run was primarily low-aerobic with moderate heart rate and no anaerobic load. However, sleep was non-restorative despite long duration, with poor overnight stress and elevated restless moments. Daytime stress was relatively balanced. Recommendation: maintain or recover today, avoid intervals, and prioritize easy aerobic movement or mobility.”

Deliverables:
- full repository structure
- working source code
- compose.yml
- sample import JSON files
- Vault bootstrap script
- Couchbase initialization script if needed
- complete documentation
- clear run commands

Frontend and product experience requirements:

The app must be web-based and feel like a modern “tomorrow app”, not a dated admin panel.

Use latest stable frontend technologies at build time:
- Prefer Nuxt 4 with TypeScript, because Nuxt 4 is the current active Nuxt version.
- Alternative: React with Vite, TypeScript, and a modern component architecture.
- Use Tailwind CSS v4 for styling.
- Use responsive, mobile-first design.
- Use reusable UI components, cards, panels, timelines, badges, and status indicators.

Look and feel:
- Stylish, premium, clean, energetic.
- Color palette: orange, warm yellow, white, soft grey, dark grey.
- Use orange/yellow for energy, readiness, highlights, and positive momentum.
- Use grey/white for calm structure and readability.
- Avoid a medical/hospital look.
- Avoid boring enterprise dashboard styling.

UI inspiration:
- Garmin-like clarity
- Apple Fitness-like polish
- Linear/Vercel-style modern SaaS minimalism
- Futuristic but practical coaching cockpit

Key pages:
- Dashboard
- Athlete profile
- Activity import
- Sleep/recovery import
- Stress import
- Agent insights
- Recommendations
- Audit timeline
- Settings

Dashboard must show:
- Readiness state: BUILD, MAINTAIN, RECOVER, REST
- Latest autonomous insight
- Next recommended session
- Recovery explanation
- Training load summary
- Sleep/stress correlation
- Recent agent actions
- Coach approval controls

Important:
The UI must reinforce that the system is proactive.
Do not design it around a chat box.
Chat may exist later, but it must not be the primary interface.
The primary UX is cards, signals, timelines, insights, and autonomous recommendations.

Code quality and maintainability requirements:

The project must not look or behave like rushed AI-generated code.

Avoid:
- oversized files
- vague helper functions
- generic naming
- duplicated logic
- unused abstractions
- fake comments
- inconsistent patterns
- untested business rules
- hidden magic
- hardcoded credentials
- “demo-only” shortcuts outside clearly marked sample files

Required:
- small focused modules
- clear domain naming
- typed interfaces
- deterministic rule engine before LLM summaries
- readable folder structure
- meaningful tests for readiness logic
- linting and formatting
- explicit error handling
- clear logging
- clean README instructions
- documented design decisions
- human-review-friendly code

Quality gates:
- TypeScript strict mode
- ESLint
- Prettier
- unit tests for agent rules
- integration test for import → agent run → recommendation
- no secrets committed
- no unused dependencies
- Docker/Podman healthchecks
- clear separation between backend, frontend, agents, database, and Vault logic

Important:
Do not optimize for “AI detection avoidance”.
Optimize for professional software engineering quality, maintainability, explainability, and human review readiness.