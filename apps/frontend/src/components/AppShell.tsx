import {
  Activity,
  BedDouble,
  BrainCircuit,
  ClipboardCheck,
  Gauge,
  History,
  Import,
  Settings,
  UserRound,
  Zap
} from "lucide-react";
import type { ReactNode } from "react";
import type { PageKey } from "../pages/pageTypes";
import type { DashboardData } from "../types/domain";
import { StatusBadge } from "./StatusBadge";

const navigation: Array<{ key: PageKey; label: string; icon: ReactNode }> = [
  { key: "dashboard", label: "Dashboard", icon: <Gauge size={18} /> },
  { key: "profile", label: "Athlete", icon: <UserRound size={18} /> },
  { key: "activity-import", label: "Activity", icon: <Activity size={18} /> },
  { key: "sleep-import", label: "Sleep", icon: <BedDouble size={18} /> },
  { key: "stress-import", label: "Stress", icon: <Zap size={18} /> },
  { key: "insights", label: "Insights", icon: <BrainCircuit size={18} /> },
  { key: "recommendations", label: "Recommendations", icon: <ClipboardCheck size={18} /> },
  { key: "audit", label: "Audit", icon: <History size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> }
];

export function AppShell({
  children,
  currentPage,
  dashboard,
  onNavigate
}: {
  children: ReactNode;
  currentPage: PageKey;
  dashboard?: DashboardData;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <main className="min-h-screen bg-[#f6f5f2] text-neutral-950">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-72">
          <div className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-950 text-yellow-300">
                <Import size={22} />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-normal text-orange-500">Running Coach</div>
                <div className="text-xs text-neutral-500">Proactive cockpit</div>
              </div>
            </div>

            <nav className="mt-4 grid gap-1">
              {navigation.map((item) => {
                const active = currentPage === item.key;
                return (
                  <button
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                      active ? "bg-orange-500 text-white" : "text-neutral-600 hover:bg-orange-50 hover:text-neutral-950"
                    }`}
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    type="button"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-lg bg-neutral-950 p-4 text-white">
              <div className="mb-3 text-xs font-semibold uppercase tracking-normal text-yellow-300">Latest readiness</div>
              {dashboard?.latestRecommendation ? (
                <div className="space-y-3">
                  <StatusBadge state={dashboard.latestRecommendation.readiness_state} />
                  <p className="text-sm leading-6 text-neutral-200">{dashboard.latestRecommendation.suggested_session}</p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-neutral-300">Import signals to activate the autonomous pipeline.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
