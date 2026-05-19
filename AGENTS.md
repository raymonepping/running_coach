# Agents

The MVP agent pipeline runs after every import.

## Agents

- Import Normalization Agent: validates and normalizes imported records.
- Session Classifier Agent: classifies the latest run using training benefit, aerobic effect, anaerobic effect, heart rate, and load.
- Recovery Intelligence Agent: evaluates sleep score, restoration summary, HRV, and overnight stress.
- Stress Correlation Agent: compares daytime stress with recovery signals.
- Pattern Detection Agent: records cross-signal adaptation patterns.
- Injury Risk Agent: checks stamina, ground contact time, and left/right balance signals.
- Adaptive Planning Agent: selects BUILD, MAINTAIN, RECOVER, or REST.
- Coach Insight Agent: produces coach and athlete explanations.
- Safety Guardrail Agent: keeps recommendations explainable and conservative.

## Readiness Logic

- `RECOVER` or `REST`: poor/non-restorative sleep plus high stress, or injury risk.
- `BUILD`: balanced HRV, low stress, good sleep, and moderate previous load.
- `MAINTAIN`: mixed signals.

Safety-critical decisions do not depend on an LLM.
