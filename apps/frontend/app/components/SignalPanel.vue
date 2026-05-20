<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <section
    class="rounded-lg border border-white/70 bg-white/70 p-5 shadow-[0_18px_60px_rgba(20,20,20,0.08)] backdrop-blur-xl ring-1 ring-neutral-950/[0.03]"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-neutral-950">{{ title }}</h2>
      <div class="text-orange-500">
        <slot name="icon" />
      </div>
    </div>
    <slot />
  </section>
</template>
