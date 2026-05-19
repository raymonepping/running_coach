<script setup lang="ts">
import type { ReadinessState } from "~/types/domain";

defineProps<{
  state: ReadinessState;
}>();

const styles: Record<ReadinessState, string> = {
  BUILD: "bg-orange-500 text-white",
  MAINTAIN: "bg-yellow-300 text-neutral-950",
  RECOVER: "bg-neutral-800 text-white",
  REST: "bg-neutral-200 text-neutral-950"
};
</script>

<template>
  <span :class="['rounded-full px-3 py-1 text-sm font-semibold', styles[state]]">{{ state }}</span>
</template>
