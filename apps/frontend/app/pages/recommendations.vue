<script setup lang="ts">
import { Check, X } from "@lucide/vue";

const { dashboard, loadDashboard } = useDashboardState();
const { reviewRecommendation } = useCoachApi();
const reviewingId = ref<string>();

async function review(id: string, action: "approve" | "reject") {
  const recommendation = dashboard.value?.recommendations.find((item) => item.id === id);
  if (!recommendation || recommendation.status !== "pending" || reviewingId.value) return;
  reviewingId.value = id;
  try {
    recommendation.status = action === "approve" ? "approved" : "rejected";
    await reviewRecommendation(id, action);
    await loadDashboard();
  } finally {
    reviewingId.value = undefined;
  }
}
</script>

<template>
  <PageHeader
    description="Recommendations remain pending until a coach explicitly approves or rejects them."
    eyebrow="Human review"
    title="Recommendations"
  />
  <section class="grid gap-4">
    <SignalPanel v-for="recommendation in dashboard?.recommendations ?? []" :key="recommendation.id" :title="recommendation.coach_summary">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge :state="recommendation.readiness_state" />
        <span class="rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
          {{ recommendation.status }}
        </span>
      </div>
      <p class="text-sm leading-6 text-neutral-700">{{ recommendation.athlete_explanation }}</p>
      <ul class="mt-4 grid gap-2 text-sm text-neutral-600">
        <li v-for="item in recommendation.rationale" :key="item" class="rounded-lg bg-neutral-50 px-3 py-2">
          {{ item }}
        </li>
      </ul>
      <div v-if="recommendation.status === 'pending'" class="mt-4 flex flex-wrap gap-3">
        <ActionButton :disabled="reviewingId === recommendation.id" @click="review(recommendation.id, 'approve')">
          <template #icon><Check :size="18" /></template>
          Approve
        </ActionButton>
        <ActionButton :disabled="reviewingId === recommendation.id" tone="secondary" @click="review(recommendation.id, 'reject')">
          <template #icon><X :size="18" /></template>
          Reject
        </ActionButton>
      </div>
    </SignalPanel>
  </section>
</template>
