<script setup lang="ts">
import type { AuditEvent } from "~/types/domain";

defineProps<{
  events: AuditEvent[];
}>();
</script>

<template>
  <section class="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
    <h2 class="text-lg font-semibold text-neutral-950">Autonomous timeline</h2>
    <div class="mt-5 space-y-4">
      <div v-for="event in events.slice(0, 12)" :key="event.id" class="grid grid-cols-[10px_1fr] gap-3">
        <div class="mt-2 h-2.5 w-2.5 rounded-full bg-orange-500" />
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-semibold text-neutral-900">{{ event.action }}</span>
            <span class="text-xs text-neutral-500">{{ new Date(event.created_at).toLocaleString() }}</span>
          </div>
          <p class="mt-1 text-sm leading-6 text-neutral-600">{{ event.detail }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
