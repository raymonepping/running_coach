import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 text-sm font-semibold uppercase tracking-normal text-orange-500">{eyebrow}</div>
        <h1 className="text-3xl font-semibold tracking-normal text-neutral-950 md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">{description}</p>
      </div>
      {action}
    </header>
  );
}
