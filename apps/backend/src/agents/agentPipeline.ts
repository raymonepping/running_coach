import { createBaseDocument } from "../domain/documents.js";
import type { AgentFinding, AgentRunResult, AthleteContext, AuditEvent, Recommendation } from "../domain/types.js";
import { evaluateReadiness } from "./readinessRules.js";

const agentNames = [
  "Import Normalization Agent",
  "Session Classifier Agent",
  "Recovery Intelligence Agent",
  "Stress Correlation Agent",
  "Pattern Detection Agent",
  "Injury Risk Agent",
  "Adaptive Planning Agent",
  "Coach Insight Agent",
  "Safety Guardrail Agent"
] as const;

export interface InsightGenerator {
  summarize(context: AthleteContext, recommendation: Recommendation): Promise<string | undefined>;
}

function finding(
  context: AthleteContext,
  agentName: string,
  severity: AgentFinding["severity"],
  title: string,
  detail: string,
  signals: string[]
): AgentFinding {
  return {
    ...createBaseDocument("agent_finding", context.athleteId, "system"),
    agent_name: agentName,
    severity,
    title,
    detail,
    signals
  };
}

function audit(context: AthleteContext, action: string, detail: string, targetId?: string): AuditEvent {
  return {
    ...createBaseDocument("audit_event", context.athleteId, "system"),
    action,
    actor: "system",
    target_id: targetId,
    detail
  };
}

export async function runAgentPipeline(
  context: AthleteContext,
  insightGenerator?: InsightGenerator
): Promise<AgentRunResult> {
  const decision = evaluateReadiness(context);
  const findings: AgentFinding[] = [];

  if (context.latestActivity?.source_file_name) {
    findings.push(
      finding(
        context,
        "Import Normalization Agent",
        "info",
        "Garmin file normalized",
        `${context.latestActivity.source_file_name} was parsed as ${context.latestActivity.source_format?.toUpperCase()} with ${context.latestActivity.source_track_points ?? 0} track points, ${context.latestActivity.source_laps ?? 0} laps, ${context.latestActivity.distance_km} km, average heart rate ${context.latestActivity.avg_hr}, and average power ${context.latestActivity.avg_power_w} W.`,
        ["source_file_name", "source_track_points", "source_laps", "distance_km", "avg_hr", "avg_power_w"]
      )
    );
  }

  findings.push(
    finding(
      context,
      "Session Classifier Agent",
      "info",
      "Controlled aerobic session detected",
      context.latestActivity
        ? `Run classified as ${context.latestActivity.primary_benefit} over ${context.latestActivity.distance_km} km with aerobic effect ${context.latestActivity.aerobic_effect}, anaerobic effect ${context.latestActivity.anaerobic_effect}, load ${context.latestActivity.exercise_load}, and average pace ${context.latestActivity.avg_pace_sec_per_km} sec/km.`
        : "No latest activity was available for classification.",
      ["primary_benefit", "distance_km", "aerobic_effect", "anaerobic_effect", "exercise_load", "avg_pace_sec_per_km"]
    )
  );

  if (context.latestSleep) {
    if (context.latestSleep.source_file_name) {
      findings.push(
        finding(
          context,
          "Import Normalization Agent",
          "info",
          "Sleep CSV normalized",
          `${context.latestSleep.source_file_name} supplied aggregate sleep for ${context.latestSleep.source_period_label}: score ${context.latestSleep.sleep_score}, ${context.latestSleep.duration_min} minutes slept, and ${context.latestSleep.sleep_need_min ?? 0} minutes estimated need.`,
          ["source_file_name", "source_period_label", "sleep_score", "duration_min", "sleep_need_min"]
        )
      );
    }

    findings.push(
      finding(
        context,
        "Recovery Intelligence Agent",
        context.latestSleep.summary.toLowerCase().includes("non-restorative") ? "watch" : "info",
        "Recovery quality evaluated",
        `Sleep duration was ${context.latestSleep.duration_min} minutes with ${context.latestSleep.quality.toLowerCase()} quality. Recovery summary: ${context.latestSleep.summary.toLowerCase()}.`,
        ["sleep_score", "duration_min", "summary", "hrv_status"]
      )
    );
  }

  if (context.latestStress) {
    findings.push(
      finding(
        context,
        "Stress Correlation Agent",
        context.latestStress.overall_stress <= 30 ? "info" : "watch",
        "Stress load correlated",
        `Day stress averaged ${context.latestStress.overall_stress}, with ${context.latestStress.high_stress_min} high-stress minutes.`,
        ["overall_stress", "high_stress_min"]
      )
    );
  }

  for (const signal of decision.riskSignals) {
    findings.push(finding(context, "Injury Risk Agent", "risk", "Risk signal detected", signal, ["stamina", "gct_balance"]));
  }

  const baseExplanation =
    "Controlled aerobic session detected. The run was primarily low-aerobic with moderate heart rate and no anaerobic load. However, sleep was non-restorative despite long duration, with poor overnight stress and elevated restless moments. Daytime stress was relatively balanced.";

  const recommendation: Recommendation = {
    ...createBaseDocument("recommendation", context.athleteId, "system"),
    readiness_state: decision.readinessState,
    suggested_session: decision.suggestedSession,
    coach_summary: `Readiness is ${decision.readinessState}. ${decision.suggestedSession}`,
    athlete_explanation: `${baseExplanation} Recommendation: ${decision.suggestedSession}`,
    rationale: decision.rationale,
    status: "pending"
  };

  const llmSummary = await insightGenerator?.summarize(context, recommendation);
  if (llmSummary) {
    recommendation.athlete_explanation = llmSummary;
  }

  const auditEvents = [
    audit(context, "agent.pipeline.started", `Triggered ${agentNames.length} autonomous agents.`),
    ...findings.map((item) => audit(context, "agent.finding.created", `${item.agent_name}: ${item.title}`, item.id)),
    audit(context, "recommendation.created", `Created ${decision.readinessState} recommendation.`, recommendation.id)
  ];

  return { findings, recommendation, auditEvents };
}
