import type { ReadinessState } from "../types/domain";

const styles: Record<ReadinessState, string> = {
  BUILD: "bg-orange-500 text-white",
  MAINTAIN: "bg-yellow-300 text-neutral-950",
  RECOVER: "bg-neutral-800 text-white",
  REST: "bg-neutral-200 text-neutral-950"
};

export function StatusBadge({ state }: { state: ReadinessState }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[state]}`}>{state}</span>;
}
