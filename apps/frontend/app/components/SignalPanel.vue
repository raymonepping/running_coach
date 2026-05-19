<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section class="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-neutral-950">{{ title }}</h2>
      <div class="text-orange-500">
        <slot name="icon" />
      </div>
    </div>
    <slot />
  </section>
</template>
