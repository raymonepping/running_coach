import type { ReactNode } from "react";

export function SignalPanel({
  title,
  children,
  icon
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
        {icon ? <div className="text-orange-500">{icon}</div> : null}
      </div>
      {children}
    </section>
  );
}
