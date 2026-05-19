import type { AuditEvent } from "../types/domain";

export function Timeline({ events }: { events: AuditEvent[] }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-950">Autonomous timeline</h2>
      <div className="mt-5 space-y-4">
        {events.slice(0, 8).map((event) => (
          <div className="grid grid-cols-[10px_1fr] gap-3" key={event.id}>
            <div className="mt-2 h-2.5 w-2.5 rounded-full bg-orange-500" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">{event.action}</span>
                <span className="text-xs text-neutral-500">{new Date(event.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
