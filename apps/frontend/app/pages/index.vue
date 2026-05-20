<script setup lang="ts">
import { Activity, BedDouble, BrainCircuit, Check, Clock3, Flame, ShieldCheck, X } from "@lucide/vue";

const { dashboard, loadDashboard } = useDashboardState();
const { reviewRecommendation } = useCoachApi();
const isReviewing = ref(false);
const latestRecommendation = computed(() => dashboard.value?.latestRecommendation);
const isLatestRecommendationPending = computed(() => latestRecommendation.value?.status === "pending");

async function reviewLatest(action: "approve" | "reject") {
  const recommendation = latestRecommendation.value;
  if (!recommendation || recommendation.status !== "pending" || isReviewing.value) return;
  isReviewing.value = true;
  try {
    recommendation.status = action === "approve" ? "approved" : "rejected";
    await reviewRecommendation(recommendation.id, action);
    await loadDashboard();
  } finally {
    isReviewing.value = false;
  }
}
</script>

<template>
  <PageHeader
    description="Signals arrive, agents run, findings are stored, and the coach gets an explainable decision surface."
    eyebrow="Autonomous adaptation intelligence"
    title="Training cockpit"
  >
    <template v-if="dashboard?.latestRecommendation" #action>
      <StatusBadge :state="dashboard.latestRecommendation.readiness_state" />
    </template>
  </PageHeader>

  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <MetricCard
      :detail="
        dashboard?.latestActivity
          ? `${dashboard.latestActivity.primary_benefit}, load ${dashboard.latestActivity.exercise_load}, avg HR ${dashboard.latestActivity.avg_hr}.`
          : 'Import a running activity to trigger session classification.'
      "
      label="Latest run"
      :value="dashboard?.latestActivity ? `${dashboard.latestActivity.distance_km} km` : 'No data'"
    >
      <template #icon><Activity :size="20" class="text-orange-500" /></template>
    </MetricCard>
    <MetricCard
      :detail="
        dashboard?.latestSleep
          ? `${dashboard.latestSleep.quality}, ${dashboard.latestSleep.summary}, HRV ${dashboard.latestSleep.hrv_status}.`
          : 'Import sleep data to evaluate recovery quality.'
      "
      label="Sleep recovery"
      :value="dashboard?.latestSleep ? `${dashboard.latestSleep.sleep_score}/100` : 'No data'"
    >
      <template #icon><BedDouble :size="20" class="text-yellow-500" /></template>
    </MetricCard>
    <MetricCard
      :detail="
        dashboard?.latestStress
          ? `${dashboard.latestStress.stress_load_min ?? dashboard.latestStress.high_stress_min} medium/high minutes, ${dashboard.latestStress.rest_min} rest minutes${dashboard.latestStress.resting_hr_bpm ? `, resting HR ${dashboard.latestStress.resting_hr_bpm}.` : '.'}`
          : dashboard?.latestHeartRate
            ? `Resting HR ${dashboard.latestHeartRate.resting_hr_bpm}, high ${dashboard.latestHeartRate.high_hr_bpm}, pressure ${dashboard.latestHeartRate.heart_rate_pressure}.`
            : 'Import stress data to correlate adaptation pressure.'
      "
      label="Stress load"
      :value="dashboard?.latestStress ? `${dashboard.latestStress.overall_stress}` : dashboard?.latestHeartRate ? `${dashboard.latestHeartRate.resting_hr_bpm} bpm` : 'No data'"
    >
      <template #icon><Flame :size="20" class="text-orange-500" /></template>
    </MetricCard>
    <MetricCard
      detail="Safety-critical state uses deterministic thresholds before any model-written summary."
      label="Guardrail"
      value="Explainable"
    >
      <template #icon><ShieldCheck :size="20" class="text-neutral-700" /></template>
    </MetricCard>
  </section>

  <section class="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
    <SignalPanel title="Latest autonomous insight">
      <template #icon><BrainCircuit :size="22" /></template>
      <p class="text-lg leading-8 text-neutral-800">
        {{
          dashboard?.latestRecommendation?.athlete_explanation ??
            "Import the sample activity, sleep, and stress data to generate the first insight."
        }}
      </p>
      <div
        v-if="latestRecommendation"
        class="mt-6 rounded-lg border border-white/10 bg-neutral-950/95 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.18)]"
      >
        <div class="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300">
          <Clock3 :size="16" />
          Next recommended session
        </div>
        <p class="leading-7">{{ latestRecommendation.suggested_session }}</p>
        <div v-if="isLatestRecommendationPending" class="mt-5 flex flex-wrap gap-3">
          <ActionButton :disabled="isReviewing" @click="reviewLatest('approve')">
            <template #icon><Check :size="18" /></template>
            Approve
          </ActionButton>
          <ActionButton :disabled="isReviewing" tone="secondary" @click="reviewLatest('reject')">
            <template #icon><X :size="18" /></template>
            Reject
          </ActionButton>
        </div>
        <div v-else class="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize text-yellow-200">
          {{ latestRecommendation.status }} by coach
        </div>
      </div>
    </SignalPanel>

    <SignalPanel title="Proactive import lanes">
      <div class="grid gap-3">
        <NuxtLink
          class="rounded-lg border border-white/70 bg-orange-50/75 p-4 text-left shadow-sm backdrop-blur transition hover:bg-orange-100/80"
          to="/import/activity"
        >
          <div class="font-semibold text-neutral-950">Activity signal</div>
          <div class="mt-1 text-sm leading-6 text-neutral-600">Classifies load, benefit, stamina, and run mechanics.</div>
        </NuxtLink>
        <NuxtLink
          class="rounded-lg border border-white/70 bg-yellow-50/75 p-4 text-left shadow-sm backdrop-blur transition hover:bg-yellow-100/80"
          to="/import/sleep"
        >
          <div class="font-semibold text-neutral-950">Sleep and recovery signal</div>
          <div class="mt-1 text-sm leading-6 text-neutral-600">Checks restoration, HRV, overnight stress, and restlessness.</div>
        </NuxtLink>
        <NuxtLink
          class="rounded-lg border border-white/70 bg-neutral-50/80 p-4 text-left shadow-sm backdrop-blur transition hover:bg-neutral-100/90"
          to="/import/stress"
        >
          <div class="font-semibold text-neutral-950">Stress signal</div>
          <div class="mt-1 text-sm leading-6 text-neutral-600">Correlates daily stress pressure with recovery context.</div>
        </NuxtLink>
      </div>
    </SignalPanel>
  </section>

  <section class="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
    <SignalPanel title="Sleep/stress correlation">
      <div class="grid gap-4">
        <div>
          <div class="text-sm font-semibold text-neutral-500">Recovery explanation</div>
          <p class="mt-1 leading-7 text-neutral-800">
            {{
              dashboard?.latestSleep
                ? `${dashboard.latestSleep.summary} sleep with ${dashboard.latestSleep.stress_rating.toLowerCase()} overnight stress and ${dashboard.latestSleep.restless_moments} restless moments.`
                : "No sleep signal imported yet."
            }}
          </p>
        </div>
        <div>
          <div class="text-sm font-semibold text-neutral-500">Training load summary</div>
          <p class="mt-1 leading-7 text-neutral-800">
            {{
              dashboard?.latestActivity
                ? `Load ${dashboard.latestActivity.exercise_load}, aerobic effect ${dashboard.latestActivity.aerobic_effect}, anaerobic effect ${dashboard.latestActivity.anaerobic_effect}.`
                : "No activity signal imported yet."
            }}
          </p>
        </div>
      </div>
    </SignalPanel>

    <AuditTimeline v-if="dashboard" :events="dashboard.auditEvents" />
  </section>
</template>
