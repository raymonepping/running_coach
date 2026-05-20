<script setup lang="ts">
defineProps<{
  detail: string;
  label: string;
  value: string;
}>();
</script>

<template>
  <section
    class="relative overflow-hidden rounded-lg border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_rgba(20,20,20,0.07)] backdrop-blur-xl ring-1 ring-neutral-950/[0.03]"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-yellow-300 to-transparent" />
    <div class="mb-4 flex items-center justify-between text-neutral-500">
      <span class="text-sm font-medium">{{ label }}</span>
      <slot name="icon" />
    </div>
    <div class="text-2xl font-semibold text-neutral-950">{{ value }}</div>
    <p class="mt-2 text-sm leading-6 text-neutral-600">{{ detail }}</p>
  </section>
</template>
