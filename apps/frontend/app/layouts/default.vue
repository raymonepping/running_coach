<script setup lang="ts">
const { dashboard, dashboardError, loadDashboard } = useDashboardState();

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <main class="min-h-screen bg-[#f6f5f2] text-neutral-950">
    <div class="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
      <AppNavigation :dashboard="dashboard" />
      <section class="min-w-0 flex-1">
        <div v-if="dashboardError" class="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900">
          {{ dashboardError }}
        </div>
        <slot />
      </section>
    </div>
  </main>
</template>
