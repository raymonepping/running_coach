<script setup lang="ts">
const { dashboard } = useDashboardState();
</script>

<template>
  <PageHeader
    description="Agent findings are generated from imported signals and stored as coach-reviewable evidence."
    eyebrow="Agent intelligence"
    title="Autonomous insights"
  />
  <section class="grid gap-4 lg:grid-cols-2">
    <SignalPanel v-for="finding in dashboard?.findings ?? []" :key="finding.id" :title="finding.title">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-900">
          {{ finding.agent_name }}
        </span>
        <span class="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
          {{ finding.severity }}
        </span>
      </div>
      <p class="text-sm leading-6 text-neutral-700">{{ finding.detail }}</p>
    </SignalPanel>
  </section>
</template>
