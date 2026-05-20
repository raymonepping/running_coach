<script setup lang="ts">
import {
  Activity,
  BedDouble,
  BrainCircuit,
  ClipboardCheck,
  Gauge,
  HeartPulse,
  History,
  Import,
  Settings,
  UserRound,
  Zap
} from "@lucide/vue";
import type { Component } from "vue";
import type { DashboardData } from "~/types/domain";

defineProps<{
  dashboard?: DashboardData;
}>();

const navigation: Array<{ label: string; path: string; icon: Component }> = [
  { label: "Dashboard", path: "/", icon: Gauge },
  { label: "Athlete", path: "/profile", icon: UserRound },
  { label: "Activity", path: "/import/activity", icon: Activity },
  { label: "Sleep", path: "/import/sleep", icon: BedDouble },
  { label: "Stress", path: "/import/stress", icon: Zap },
  { label: "Heart Rate", path: "/import/heart", icon: HeartPulse },
  { label: "Insights", path: "/insights", icon: BrainCircuit },
  { label: "Recommendations", path: "/recommendations", icon: ClipboardCheck },
  { label: "Audit", path: "/audit", icon: History },
  { label: "Settings", path: "/settings", icon: Settings }
];
</script>

<template>
  <aside class="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-72">
    <div class="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div class="flex items-center gap-3 border-b border-neutral-100 pb-4">
        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-950 text-yellow-300">
          <Import :size="22" />
        </div>
        <div>
          <div class="text-sm font-semibold uppercase tracking-normal text-orange-500">Running Coach</div>
          <div class="text-xs text-neutral-500">Proactive cockpit</div>
        </div>
      </div>

      <nav class="mt-4 grid gap-1">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          class="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-neutral-600 transition hover:bg-orange-50 hover:text-neutral-950"
          active-class="bg-orange-500 text-white hover:bg-orange-500 hover:text-white"
          :to="item.path"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto rounded-lg bg-neutral-950 p-4 text-white">
        <div class="mb-3 text-xs font-semibold uppercase tracking-normal text-yellow-300">Latest readiness</div>
        <div v-if="dashboard?.latestRecommendation" class="space-y-3">
          <StatusBadge :state="dashboard.latestRecommendation.readiness_state" />
          <p class="text-sm leading-6 text-neutral-200">{{ dashboard.latestRecommendation.suggested_session }}</p>
        </div>
        <p v-else class="text-sm leading-6 text-neutral-300">Import signals to activate the autonomous pipeline.</p>
      </div>
    </div>
  </aside>
</template>
