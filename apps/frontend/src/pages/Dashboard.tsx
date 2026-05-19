import { Activity, BedDouble, BrainCircuit, Check, Clock3, Flame, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchDashboard, reviewRecommendation } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import type { DashboardData } from "../types/domain";

const athleteId = "demo-athlete";

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [error, setError] = useState<string>();

  async function load() {
    try {
      setDashboard(await fetchDashboard(athleteId));
      setError(undefined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const recommendation = dashboard?.latestRecommendation;

  async function review(action: "approve" | "reject") {
    if (!recommendation) return;
    await reviewRecommendation(recommendation.id, action);
    await load();
  }

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-neutral-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-neutral-600 shadow-sm">
              <BrainCircuit size={16} className="text-orange-500" />
              Autonomous adaptation intelligence
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-neutral-950 md:text-6xl">Running Coach</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
              Event-driven training adaptation from runs, sleep, stress, and recovery signals.
            </p>
          </div>
          {recommendation ? <StatusBadge state={recommendation.readiness_state} /> : null}
        </header>

        {error ? <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900">{error}</div> : null}

        <section className="grid gap-4 py-6 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Latest run"
            value={dashboard?.latestActivity ? `${dashboard.latestActivity.distance_km} km` : "No data"}
            detail={
              dashboard?.latestActivity
                ? `${dashboard.latestActivity.primary_benefit}, load ${dashboard.latestActivity.exercise_load}, avg HR ${dashboard.latestActivity.avg_hr}.`
                : "Import a running activity to trigger session classification."
            }
            icon={<Activity size={20} className="text-orange-500" />}
          />
          <MetricCard
            label="Sleep recovery"
            value={dashboard?.latestSleep ? `${dashboard.latestSleep.sleep_score}/100` : "No data"}
            detail={
              dashboard?.latestSleep
                ? `${dashboard.latestSleep.quality}, ${dashboard.latestSleep.summary}, HRV ${dashboard.latestSleep.hrv_status}.`
                : "Import sleep data to evaluate recovery quality."
            }
            icon={<BedDouble size={20} className="text-yellow-500" />}
          />
          <MetricCard
            label="Stress load"
            value={dashboard?.latestStress ? `${dashboard.latestStress.overall_stress}` : "No data"}
            detail={
              dashboard?.latestStress
                ? `${dashboard.latestStress.high_stress_min} high-stress minutes, ${dashboard.latestStress.rest_min} rest minutes.`
                : "Import stress data to correlate adaptation pressure."
            }
            icon={<Flame size={20} className="text-orange-500" />}
          />
          <MetricCard
            label="Guardrail"
            value="Explainable"
            detail="Safety-critical state uses deterministic thresholds before any model-written summary."
            icon={<ShieldCheck size={20} className="text-neutral-700" />}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Latest autonomous insight</h2>
                <p className="mt-1 text-sm text-neutral-500">Generated after import without a prompt or chat request.</p>
              </div>
              {recommendation ? <StatusBadge state={recommendation.readiness_state} /> : null}
            </div>
            <p className="mt-5 text-lg leading-8 text-neutral-800">
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
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                    onClick={() => void review("approve")}
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 font-semibold text-white hover:bg-white/10"
                    onClick={() => void review("reject")}
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Agent signals</h2>
            <div className="mt-5 space-y-4">
              {dashboard?.findings.slice(0, 5).map((finding) => (
                <article className="rounded-lg bg-neutral-50 p-4" key={finding.id}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-neutral-950">{finding.title}</h3>
                    <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-semibold text-neutral-950">
                      {finding.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{finding.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="py-6">{dashboard ? <Timeline events={dashboard.auditEvents} /> : null}</div>
      </div>
    </main>
  );
}
