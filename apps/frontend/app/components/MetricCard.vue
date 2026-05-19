<script setup lang="ts">
defineProps<{
  detail: string;
  label: string;
  value: string;
}>();
</script>

<template>
  <section class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
    <div class="mb-4 flex items-center justify-between text-neutral-500">
      <span class="text-sm font-medium">{{ label }}</span>
      <slot name="icon" />
    </div>
    <div class="text-2xl font-semibold text-neutral-950">{{ value }}</div>
    <p class="mt-2 text-sm leading-6 text-neutral-600">{{ detail }}</p>
  </section>
</template>
