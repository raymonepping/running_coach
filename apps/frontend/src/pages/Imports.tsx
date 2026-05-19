import { UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import activitySample from "../../../../samples/activity.sample.json";
import recoverySample from "../../../../samples/recovery.sample.json";
import sleepSample from "../../../../samples/sleep.sample.json";
import stressSample from "../../../../samples/stress.sample.json";
import { importRecord } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { PageHeader } from "../components/PageHeader";
import { SignalPanel } from "../components/SignalPanel";

type ImportKind = "activity" | "sleep" | "stress" | "recovery";

const samples: Record<ImportKind, unknown> = {
  activity: activitySample,
  sleep: sleepSample,
  stress: stressSample,
  recovery: recoverySample
};

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

export function ImportPage({ kind, onImported }: { kind: ImportKind; onImported: () => Promise<void> }) {
  const [rawJson, setRawJson] = useState(() => JSON.stringify(samples[kind], null, 2));
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const page = copy[kind];

  useEffect(() => {
    setRawJson(JSON.stringify(samples[kind], null, 2));
    setStatus(undefined);
    setError(undefined);
  }, [kind]);

  async function submit() {
    try {
      const payload = JSON.parse(rawJson) as unknown;
      await importRecord(kind, payload);
      await onImported();
      setStatus(`${page.title} accepted. Autonomous agents have run.`);
      setError(undefined);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Import failed.");
      setStatus(undefined);
    }
  }

  return (
    <>
      <PageHeader description={page.description} eyebrow="Signal ingestion" title={page.title} />
      <section className="grid gap-5 xl:grid-cols-[1fr_0.7fr]">
        <SignalPanel title="Import payload">
          <textarea
            className="min-h-[520px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-100 outline-none focus:border-orange-400"
            onChange={(event) => setRawJson(event.target.value)}
            spellCheck={false}
            value={rawJson}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton icon={<UploadCloud size={18} />} onClick={() => void submit()}>
              Import and run agents
            </ActionButton>
            <ActionButton onClick={() => setRawJson(JSON.stringify(samples[kind], null, 2))} tone="secondary">
              Reset sample
            </ActionButton>
          </div>
          {status ? <div className="mt-4 rounded-lg bg-yellow-100 p-3 text-sm font-semibold text-neutral-950">{status}</div> : null}
          {error ? <div className="mt-4 rounded-lg bg-orange-100 p-3 text-sm font-semibold text-orange-900">{error}</div> : null}
        </SignalPanel>

        <SignalPanel title="Autonomous trigger contract">
          <div className="space-y-4 text-sm leading-6 text-neutral-700">
            <p>Each accepted import is stored first, then the agent runner loads the latest athlete context and writes findings.</p>
            <p>The readiness state is deterministic. Ollama only writes the human-readable explanation after the rules have decided.</p>
            <p>Every generated finding and recommendation produces an audit event for coach review.</p>
          </div>
        </SignalPanel>
      </section>
    </>
  );
}
