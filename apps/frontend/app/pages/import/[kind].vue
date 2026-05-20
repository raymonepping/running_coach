<script setup lang="ts">
import { UploadCloud } from "@lucide/vue";
import { samplePayloads, type ImportKind } from "~/data/samplePayloads";

const route = useRoute();
const router = useRouter();
const { importActivityFile, importRecord, importSleepCsv, importStressCsv, importStressHeartCsv } = useCoachApi();
const { athleteId, loadDashboard } = useDashboardState();

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
const selectedFileName = ref<string>();
const selectedStressFile = ref<File>();
const selectedHeartFile = ref<File>();

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

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (extension !== "gpx" && extension !== "tcx") {
    error.value = "Choose a .gpx or .tcx file.";
    status.value = undefined;
    input.value = "";
    return;
  }

  try {
    selectedFileName.value = file.name;
    const content = await file.text();
    await importActivityFile({
      athlete_id: athleteId,
      content,
      file_name: file.name,
      file_type: extension
    });
    await loadDashboard();
    status.value = `${file.name} imported. Activity was normalized, stored, and analyzed by the agents.`;
    error.value = undefined;
  } catch (fileError) {
    error.value = fileError instanceof Error ? fileError.message : "File import failed.";
    status.value = undefined;
  } finally {
    input.value = "";
  }
}

async function importSleepFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    error.value = "Choose a Garmin sleep .csv file.";
    status.value = undefined;
    input.value = "";
    return;
  }

  try {
    selectedFileName.value = file.name;
    await importSleepCsv({
      athlete_id: athleteId,
      content: await file.text(),
      file_name: file.name
    });
    await loadDashboard();
    status.value = `${file.name} imported. Sleep summaries were stored and autonomous agents have run.`;
    error.value = undefined;
  } catch (fileError) {
    error.value = fileError instanceof Error ? fileError.message : "Sleep CSV import failed.";
    status.value = undefined;
  } finally {
    input.value = "";
  }
}

async function importStressFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    error.value = "Choose a Garmin stress .csv file.";
    status.value = undefined;
    input.value = "";
    return;
  }

  try {
    selectedFileName.value = file.name;
    await importStressCsv({
      athlete_id: athleteId,
      content: await file.text(),
      file_name: file.name
    });
    await loadDashboard();
    status.value = `${file.name} imported. Stress summaries were stored and autonomous agents have run.`;
    error.value = undefined;
  } catch (fileError) {
    error.value = fileError instanceof Error ? fileError.message : "Stress CSV import failed.";
    status.value = undefined;
  } finally {
    input.value = "";
  }
}

function selectStressPairFile(event: Event, target: "stress" | "heart") {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    error.value = "Choose CSV files for stress and heart rate.";
    status.value = undefined;
    input.value = "";
    return;
  }

  if (target === "stress") {
    selectedStressFile.value = file;
  } else {
    selectedHeartFile.value = file;
  }
  error.value = undefined;
}

async function importStressHeartFiles() {
  if (!selectedStressFile.value || !selectedHeartFile.value) {
    error.value = "Choose both a stress CSV and a heart-rate CSV.";
    status.value = undefined;
    return;
  }

  try {
    await importStressHeartCsv({
      athlete_id: athleteId,
      heart_content: await selectedHeartFile.value.text(),
      heart_file_name: selectedHeartFile.value.name,
      stress_content: await selectedStressFile.value.text(),
      stress_file_name: selectedStressFile.value.name
    });
    await loadDashboard();
    status.value = `${selectedStressFile.value.name} and ${selectedHeartFile.value.name} imported. Stress was enriched with heart-rate pressure and autonomous agents have run.`;
    error.value = undefined;
  } catch (fileError) {
    error.value = fileError instanceof Error ? fileError.message : "Stress and heart-rate import failed.";
    status.value = undefined;
  }
}
</script>

<template>
  <PageHeader :description="copy[kind].description" eyebrow="Signal ingestion" :title="copy[kind].title" />
  <section class="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
    <SignalPanel title="Import payload">
      <div v-if="kind === 'activity'" class="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="font-semibold text-neutral-950">Garmin activity file</div>
            <p class="mt-1 text-sm leading-6 text-neutral-700">Import a .tcx or .gpx run. TCX gives richer pace, lap, power, and heart-rate signals when available.</p>
            <p v-if="selectedFileName" class="mt-2 text-sm font-semibold text-orange-800">{{ selectedFileName }}</p>
          </div>
          <label class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
            <UploadCloud :size="18" />
            Choose file
            <input class="sr-only" type="file" accept=".gpx,.tcx,application/gpx+xml,application/vnd.garmin.tcx+xml,text/xml" @change="importFile">
          </label>
        </div>
      </div>
      <div v-if="kind === 'sleep'" class="mb-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="font-semibold text-neutral-950">Garmin sleep CSV</div>
            <p class="mt-1 text-sm leading-6 text-neutral-700">Import Garmin sleep CSV exports. 1-day, 7-day, 4-week, monthly, and yearly reports are accepted.</p>
            <p v-if="selectedFileName" class="mt-2 text-sm font-semibold text-orange-800">{{ selectedFileName }}</p>
          </div>
          <label class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
            <UploadCloud :size="18" />
            Choose CSV
            <input class="sr-only" type="file" accept=".csv,text/csv" @change="importSleepFile">
          </label>
        </div>
      </div>
      <div v-if="kind === 'stress'" class="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="font-semibold text-neutral-950">Garmin stress CSV</div>
            <p class="mt-1 text-sm leading-6 text-neutral-700">Import Garmin stress CSV exports with daily stress levels and time distribution.</p>
            <p v-if="selectedFileName" class="mt-2 text-sm font-semibold text-orange-800">{{ selectedFileName }}</p>
          </div>
          <label class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800">
            <UploadCloud :size="18" />
            Choose CSV
            <input class="sr-only" type="file" accept=".csv,text/csv" @change="importStressFile">
          </label>
        </div>
      </div>
      <div v-if="kind === 'stress'" class="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
        <div class="flex flex-col gap-4">
          <div>
            <div class="font-semibold text-neutral-950">Stress + heart-rate CSV</div>
            <p class="mt-1 text-sm leading-6 text-neutral-700">Join daily stress with resting and high heart rate by date for better recovery-pressure detection.</p>
          </div>
          <div class="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
            <label class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-neutral-950 ring-1 ring-orange-200 transition hover:bg-orange-100">
              <UploadCloud :size="18" />
              {{ selectedStressFile?.name ?? "Stress CSV" }}
              <input class="sr-only" type="file" accept=".csv,text/csv" @change="selectStressPairFile($event, 'stress')">
            </label>
            <label class="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-neutral-950 ring-1 ring-orange-200 transition hover:bg-orange-100">
              <UploadCloud :size="18" />
              {{ selectedHeartFile?.name ?? "Heart CSV" }}
              <input class="sr-only" type="file" accept=".csv,text/csv" @change="selectStressPairFile($event, 'heart')">
            </label>
            <ActionButton @click="importStressHeartFiles">Import pair</ActionButton>
          </div>
        </div>
      </div>
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
