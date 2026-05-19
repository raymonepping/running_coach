<script setup lang="ts">
defineProps<{
  description: string;
  eyebrow: string;
  title: string;
}>();
</script>

<template>
  <header class="mb-5 flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-end md:justify-between">
    <div>
      <div class="mb-2 text-sm font-semibold uppercase tracking-normal text-orange-500">{{ eyebrow }}</div>
      <h1 class="text-3xl font-semibold tracking-normal text-neutral-950 md:text-5xl">{{ title }}</h1>
      <p class="mt-3 max-w-3xl text-base leading-7 text-neutral-600">{{ description }}</p>
    </div>
    <slot name="action" />
  </header>
</template>
