<script setup lang="ts">
import { UploadCloud } from "@lucide/vue";
import { samplePayloads, type ImportKind } from "~/data/samplePayloads";

const route = useRoute();
const router = useRouter();
const { importRecord } = useCoachApi();
const { loadDashboard } = useDashboardState();

const validKinds: ImportKind[] = ["activity", "sleep", "stress", "recovery"];
const kind = computed<ImportKind>(() => {
  const value = route.params.kind;
  return validKinds.includes(value as ImportKind) ? (value as ImportKind) : "activity";
});

const copy: Record<ImportKind, { title: string; description: string }> = {
  activity: {
    title: "Activity import",
    description: "Import a Garmin-style run to trigger load classification, mechanics checks, and planning adaptation."
  },
  sleep: {
    title: "Sleep and recovery import",
    description: "Import recovery context so the agents can compare sleep quality, HRV, overnight stress, and restoration."
  },
  stress: {
    title: "Stress import",
    description: "Import daily stress pressure to correlate adaptation load with recovery capacity."
  },
  recovery: {
    title: "Recovery snapshot import",
    description: "Import subjective readiness notes as an additional coach-facing recovery signal."
  }
};

const rawJson = ref("");
const status = ref<string>();
const error = ref<string>();

function resetSample() {
  rawJson.value = JSON.stringify(samplePayloads[kind.value], null, 2);
  status.value = undefined;
  error.value = undefined;
}

watch(kind, resetSample, { immediate: true });

onMounted(() => {
  if (!validKinds.includes(route.params.kind as ImportKind)) {
    void router.replace("/import/activity");
  }
});

async function submit() {
  try {
    const payload = JSON.parse(rawJson.value) as unknown;
    await importRecord(kind.value, payload);
    await loadDashboard();
    status.value = `${copy[kind.value].title} accepted. Autonomous agents have run.`;
    error.value = undefined;
  } catch (submitError) {
    error.value = submitError instanceof Error ? submitError.message : "Import failed.";
    status.value = undefined;
  }
}
</script>

<template>
  <PageHeader :description="copy[kind].description" eyebrow="Signal ingestion" :title="copy[kind].title" />
  <section class="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
    <SignalPanel title="Import payload">
      <textarea
        v-model="rawJson"
        class="min-h-[520px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-100 outline-none focus:border-orange-400"
        spellcheck="false"
      />
      <div class="mt-4 flex flex-wrap gap-3">
        <ActionButton @click="submit">
          <template #icon><UploadCloud :size="18" /></template>
          Import and run agents
        </ActionButton>
        <ActionButton tone="secondary" @click="resetSample">Reset sample</ActionButton>
      </div>
      <div v-if="status" class="mt-4 rounded-lg bg-yellow-100 p-3 text-sm font-semibold text-neutral-950">{{ status }}</div>
      <div v-if="error" class="mt-4 rounded-lg bg-orange-100 p-3 text-sm font-semibold text-orange-900">{{ error }}</div>
    </SignalPanel>

    <SignalPanel title="Autonomous trigger contract">
      <div class="space-y-4 text-sm leading-6 text-neutral-700">
        <p>Each accepted import is stored first, then the agent runner loads the latest athlete context and writes findings.</p>
        <p>The readiness state is deterministic. Ollama only writes the human-readable explanation after the rules have decided.</p>
        <p>Every generated finding and recommendation produces an audit event for coach review.</p>
      </div>
    </SignalPanel>
  </section>
</template>
