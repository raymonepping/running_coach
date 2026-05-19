<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: "primary" | "secondary" | "dark";
    type?: "button" | "submit";
  }>(),
  {
    tone: "primary",
    type: "button"
  }
);

const toneClasses = {
  primary: "bg-orange-500 text-white hover:bg-orange-600",
  secondary: "border border-neutral-200 bg-white text-neutral-900 hover:border-orange-200 hover:bg-orange-50",
  dark: "bg-neutral-950 text-white hover:bg-neutral-800"
};
</script>

<template>
  <button
    :class="[
      'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
      toneClasses[tone]
    ]"
    :type="type"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>
