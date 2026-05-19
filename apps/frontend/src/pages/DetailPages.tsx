import { Check, X } from "lucide-react";
import { ActionButton } from "../components/ActionButton";
import { PageHeader } from "../components/PageHeader";
import { SignalPanel } from "../components/SignalPanel";
import { StatusBadge } from "../components/StatusBadge";
import { Timeline } from "../components/Timeline";
import type { DashboardData } from "../types/domain";

export function ProfilePage({ dashboard }: { dashboard?: DashboardData }) {
  return (
    <>
      <PageHeader
        description="The MVP uses one local demo athlete while the architecture keeps all records scoped by athlete ID."
        eyebrow="Athlete profile"
        title="Demo athlete"
      />
      <section className="grid gap-5 lg:grid-cols-3">
        <SignalPanel title="Identity">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-neutral-500">Athlete ID</dt>
              <dd className="mt-1 text-neutral-950">{dashboard?.athleteId ?? "demo-athlete"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-500">Mode</dt>
              <dd className="mt-1 text-neutral-950">Local-first coaching support</dd>
            </div>
          </dl>
        </SignalPanel>
        <SignalPanel title="Current adaptation state">
          {dashboard?.latestRecommendation ? <StatusBadge state={dashboard.latestRecommendation.readiness_state} /> : null}
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            {dashboard?.latestRecommendation?.coach_summary ?? "No recommendation generated yet."}
          </p>
        </SignalPanel>
        <SignalPanel title="Latest session">
          <p className="text-sm leading-6 text-neutral-700">
            {dashboard?.latestActivity
              ? `${dashboard.latestActivity.distance_km} km, ${dashboard.latestActivity.primary_benefit}, load ${dashboard.latestActivity.exercise_load}.`
              : "No activity imported yet."}
          </p>
        </SignalPanel>
      </section>
    </>
  );
}

export function InsightsPage({ dashboard }: { dashboard?: DashboardData }) {
  return (
    <>
      <PageHeader
        description="Agent findings are generated from imported signals and stored as coach-reviewable evidence."
        eyebrow="Agent intelligence"
        title="Autonomous insights"
      />
      <section className="grid gap-4 lg:grid-cols-2">
        {dashboard?.findings.map((finding) => (
          <SignalPanel key={finding.id} title={finding.title}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-900">
                {finding.agent_name}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                {finding.severity}
              </span>
            </div>
            <p className="text-sm leading-6 text-neutral-700">{finding.detail}</p>
          </SignalPanel>
        ))}
      </section>
    </>
  );
}

export function RecommendationsPage({
  dashboard,
  onReview
}: {
  dashboard?: DashboardData;
  onReview: (id: string, action: "approve" | "reject") => Promise<void>;
}) {
  return (
    <>
      <PageHeader
        description="Recommendations remain pending until a coach explicitly approves or rejects them."
        eyebrow="Human review"
        title="Recommendations"
      />
      <section className="grid gap-4">
        {dashboard?.recommendations.map((recommendation) => (
          <SignalPanel key={recommendation.id} title={recommendation.coach_summary}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge state={recommendation.readiness_state} />
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
                {recommendation.status}
              </span>
            </div>
            <p className="text-sm leading-6 text-neutral-700">{recommendation.athlete_explanation}</p>
            <ul className="mt-4 grid gap-2 text-sm text-neutral-600">
              {recommendation.rationale.map((item) => (
                <li className="rounded-lg bg-neutral-50 px-3 py-2" key={item}>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <ActionButton icon={<Check size={18} />} onClick={() => void onReview(recommendation.id, "approve")}>
                Approve
              </ActionButton>
              <ActionButton icon={<X size={18} />} onClick={() => void onReview(recommendation.id, "reject")} tone="secondary">
                Reject
              </ActionButton>
            </div>
          </SignalPanel>
        ))}
      </section>
    </>
  );
}

export function AuditPage({ dashboard }: { dashboard?: DashboardData }) {
  return (
    <>
      <PageHeader
        description="Every autonomous action writes an audit event, including generated findings and recommendation decisions."
        eyebrow="Traceability"
        title="Audit timeline"
      />
      {dashboard ? <Timeline events={dashboard.auditEvents} /> : null}
    </>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Local services are composed explicitly so security, model behavior, and storage boundaries stay visible."
        eyebrow="Local stack"
        title="Settings"
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <SignalPanel title="Runtime services">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-neutral-500">Backend</dt>
              <dd>http://localhost:8080</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-neutral-500">Ollama</dt>
              <dd>llama3.1:8b</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-neutral-500">Vault</dt>
              <dd>AppRole + KV + transit</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-neutral-500">Couchbase</dt>
              <dd>running_coach.coach</dd>
            </div>
          </dl>
        </SignalPanel>
        <SignalPanel title="Safety posture">
          <p className="text-sm leading-6 text-neutral-700">
            Readiness and risk logic are deterministic. Model output is limited to explanation writing and cannot approve recommendations.
          </p>
        </SignalPanel>
      </section>
    </>
  );
}
