import type { ActivityRecord, AthleteContext, ReadinessState } from "../domain/types.js";

export interface ReadinessDecision {
  readinessState: ReadinessState;
  rationale: string[];
  riskSignals: string[];
  suggestedSession: string;
}

function isNonRestorative(summary?: string): boolean {
  return summary?.toLowerCase().includes("non-restorative") ?? false;
}

function isPoor(value?: string): boolean {
  return value?.toLowerCase() === "poor";
}

function isGood(value?: string): boolean {
  return ["good", "excellent"].includes(value?.toLowerCase() ?? "");
}

function isModerateLoad(activity?: ActivityRecord): boolean {
  return activity ? activity.exercise_load >= 60 && activity.exercise_load <= 120 : false;
}

function hasInjuryRisk(activity?: ActivityRecord): boolean {
  if (!activity) return false;
  const balanceDelta = Math.abs(activity.avg_gc_time_balance_left_pct - activity.avg_gc_time_balance_right_pct);
  return activity.avg_ground_contact_time_ms > 340 || balanceDelta >= 4 || activity.ending_stamina_pct < 50;
}

export function evaluateReadiness(context: AthleteContext): ReadinessDecision {
  const { latestActivity, latestSleep, latestStress } = context;
  const rationale: string[] = [];
  const riskSignals: string[] = [];

  const poorSleep = isPoor(latestSleep?.quality) || isNonRestorative(latestSleep?.summary);
  const highOvernightStress = isPoor(latestSleep?.stress_rating) || (latestSleep?.stress_avg ?? 0) >= 45;
  const highDayStress = (latestStress?.overall_stress ?? 0) >= 45 || (latestStress?.high_stress_min ?? 0) >= 60;
  const lowDayStress = (latestStress?.overall_stress ?? 100) <= 30 && (latestStress?.high_stress_min ?? 100) <= 20;
  const balancedHrv = latestSleep?.hrv_status.toLowerCase() === "balanced";
  const goodSleep = isGood(latestSleep?.quality) && !isNonRestorative(latestSleep?.summary);
  const injuryRisk = hasInjuryRisk(latestActivity);

  if (latestActivity?.primary_benefit.toLowerCase().includes("base")) {
    rationale.push("Previous run was primarily low-aerobic.");
  }
  if (isModerateLoad(latestActivity)) {
    rationale.push(`Exercise load ${latestActivity?.exercise_load} is in the moderate range.`);
  }
  if (poorSleep) {
    rationale.push("Sleep quality or restoration signal is not strong.");
  }
  if (highOvernightStress) {
    rationale.push("Overnight stress is elevated relative to recovery needs.");
  }
  if (lowDayStress) {
    rationale.push("Daytime stress is controlled.");
  }
  if (balancedHrv) {
    rationale.push("HRV status is balanced.");
  }
  if (injuryRisk) {
    riskSignals.push("Biomechanics or stamina signals suggest recovery bias.");
  }

  if (injuryRisk) {
    return {
      readinessState: "RECOVER",
      rationale,
      riskSignals,
      suggestedSession: "Recovery run, mobility, or full rest. Avoid intensity until risk signals clear."
    };
  }

  if (poorSleep && (highOvernightStress || highDayStress)) {
    return {
      readinessState: highDayStress ? "REST" : "RECOVER",
      rationale,
      riskSignals,
      suggestedSession: "Easy aerobic movement or mobility only. Avoid intervals and long runs today."
    };
  }

  if (balancedHrv && lowDayStress && goodSleep && isModerateLoad(latestActivity)) {
    return {
      readinessState: "BUILD",
      rationale,
      riskSignals,
      suggestedSession: "Progressive aerobic run or controlled quality session if subjective readiness is high."
    };
  }

  return {
    readinessState: "MAINTAIN",
    rationale,
    riskSignals,
    suggestedSession: "Maintain with easy aerobic running, strides only if legs feel fresh, or mobility."
  };
}
