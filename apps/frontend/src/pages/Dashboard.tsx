import { Activity, BedDouble, BrainCircuit, Check, Clock3, Flame, ShieldCheck, X } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { SignalPanel } from "../components/SignalPanel";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import type { DashboardData } from "../types/domain";

export function Dashboard({
  dashboard,
  onReview,
  onNavigate
}: {
  dashboard?: DashboardData;
  onReview: (action: "approve" | "reject") => Promise<void>;
  onNavigate: (target: "activity-import" | "sleep-import" | "stress-import") => void;
}) {
  const recommendation = dashboard?.latestRecommendation;

  return (
    <>
      <PageHeader
        action={recommendation ? <StatusBadge state={recommendation.readiness_state} /> : undefined}
        description="Signals arrive, agents run, findings are stored, and the coach gets an explainable decision surface."
        eyebrow="Autonomous adaptation intelligence"
        title="Training cockpit"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={
            dashboard?.latestActivity
              ? `${dashboard.latestActivity.primary_benefit}, load ${dashboard.latestActivity.exercise_load}, avg HR ${dashboard.latestActivity.avg_hr}.`
              : "Import a running activity to trigger session classification."
          }
          icon={<Activity size={20} className="text-orange-500" />}
          label="Latest run"
          value={dashboard?.latestActivity ? `${dashboard.latestActivity.distance_km} km` : "No data"}
        />
        <MetricCard
          detail={
            dashboard?.latestSleep
              ? `${dashboard.latestSleep.quality}, ${dashboard.latestSleep.summary}, HRV ${dashboard.latestSleep.hrv_status}.`
              : "Import sleep data to evaluate recovery quality."
          }
          icon={<BedDouble size={20} className="text-yellow-500" />}
          label="Sleep recovery"
          value={dashboard?.latestSleep ? `${dashboard.latestSleep.sleep_score}/100` : "No data"}
        />
        <MetricCard
          detail={
            dashboard?.latestStress
              ? `${dashboard.latestStress.high_stress_min} high-stress minutes, ${dashboard.latestStress.rest_min} rest minutes.`
              : "Import stress data to correlate adaptation pressure."
          }
          icon={<Flame size={20} className="text-orange-500" />}
          label="Stress load"
          value={dashboard?.latestStress ? `${dashboard.latestStress.overall_stress}` : "No data"}
        />
        <MetricCard
          detail="Safety-critical state uses deterministic thresholds before any model-written summary."
          icon={<ShieldCheck size={20} className="text-neutral-700" />}
          label="Guardrail"
          value="Explainable"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SignalPanel icon={<BrainCircuit size={22} />} title="Latest autonomous insight">
          <p className="text-lg leading-8 text-neutral-800">
            {recommendation?.athlete_explanation ?? "Import the sample activity, sleep, and stress data to generate the first insight."}
          </p>
          {recommendation ? (
            <div className="mt-6 rounded-lg bg-neutral-950 p-5 text-white">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300">
                <Clock3 size={16} />
                Next recommended session
              </div>
              <p className="leading-7">{recommendation.suggested_session}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton icon={<Check size={18} />} onClick={() => void onReview("approve")}>
                  Approve
                </ActionButton>
                <ActionButton icon={<X size={18} />} onClick={() => void onReview("reject")} tone="secondary">
                  Reject
                </ActionButton>
              </div>
            </div>
          ) : null}
        </SignalPanel>

        <SignalPanel title="Proactive import lanes">
          <div className="grid gap-3">
            <button
              className="rounded-lg bg-orange-50 p-4 text-left hover:bg-orange-100"
              onClick={() => onNavigate("activity-import")}
              type="button"
            >
              <div className="font-semibold text-neutral-950">Activity signal</div>
              <div className="mt-1 text-sm leading-6 text-neutral-600">Classifies load, benefit, stamina, and run mechanics.</div>
            </button>
            <button
              className="rounded-lg bg-yellow-50 p-4 text-left hover:bg-yellow-100"
              onClick={() => onNavigate("sleep-import")}
              type="button"
            >
              <div className="font-semibold text-neutral-950">Sleep and recovery signal</div>
              <div className="mt-1 text-sm leading-6 text-neutral-600">Checks restoration, HRV, overnight stress, and restlessness.</div>
            </button>
            <button
              className="rounded-lg bg-neutral-50 p-4 text-left hover:bg-neutral-100"
              onClick={() => onNavigate("stress-import")}
              type="button"
            >
              <div className="font-semibold text-neutral-950">Stress signal</div>
              <div className="mt-1 text-sm leading-6 text-neutral-600">Correlates daily stress pressure with recovery context.</div>
            </button>
          </div>
        </SignalPanel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <SignalPanel title="Sleep/stress correlation">
          <div className="grid gap-4">
            <div>
              <div className="text-sm font-semibold text-neutral-500">Recovery explanation</div>
              <p className="mt-1 leading-7 text-neutral-800">
                {dashboard?.latestSleep
                  ? `${dashboard.latestSleep.summary} sleep with ${dashboard.latestSleep.stress_rating.toLowerCase()} overnight stress and ${dashboard.latestSleep.restless_moments} restless moments.`
                  : "No sleep signal imported yet."}
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-500">Training load summary</div>
              <p className="mt-1 leading-7 text-neutral-800">
                {dashboard?.latestActivity
                  ? `Load ${dashboard.latestActivity.exercise_load}, aerobic effect ${dashboard.latestActivity.aerobic_effect}, anaerobic effect ${dashboard.latestActivity.anaerobic_effect}.`
                  : "No activity signal imported yet."}
              </p>
            </div>
          </div>
        </SignalPanel>

        {dashboard ? <Timeline events={dashboard.auditEvents} /> : null}
      </section>
    </>
  );
}
