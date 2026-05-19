import type { ReactNode } from "react";

export function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-neutral-500">
        <span className="text-sm font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-neutral-950">{value}</div>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p>
    </section>
  );
}
