<script setup lang="ts">
const { dashboard } = useDashboardState();
</script>

<template>
  <PageHeader
    description="The MVP uses one local demo athlete while the architecture keeps all records scoped by athlete ID."
    eyebrow="Athlete profile"
    title="Demo athlete"
  />
  <section class="grid gap-5 lg:grid-cols-3">
    <SignalPanel title="Identity">
      <dl class="space-y-4 text-sm">
        <div>
          <dt class="font-semibold text-neutral-500">Athlete ID</dt>
          <dd class="mt-1 text-neutral-950">{{ dashboard?.athleteId ?? "demo-athlete" }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-neutral-500">Mode</dt>
          <dd class="mt-1 text-neutral-950">Local-first coaching support</dd>
        </div>
      </dl>
    </SignalPanel>
    <SignalPanel title="Current adaptation state">
      <StatusBadge v-if="dashboard?.latestRecommendation" :state="dashboard.latestRecommendation.readiness_state" />
      <p class="mt-4 text-sm leading-6 text-neutral-700">
        {{ dashboard?.latestRecommendation?.coach_summary ?? "No recommendation generated yet." }}
      </p>
    </SignalPanel>
    <SignalPanel title="Latest session">
      <p class="text-sm leading-6 text-neutral-700">
        {{
          dashboard?.latestActivity
            ? `${dashboard.latestActivity.distance_km} km, ${dashboard.latestActivity.primary_benefit}, load ${dashboard.latestActivity.exercise_load}.`
            : "No activity imported yet."
        }}
      </p>
    </SignalPanel>
  </section>
</template>
