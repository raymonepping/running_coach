import type { DashboardData } from "~/types/domain";

const athleteId = "demo-athlete";

export function useDashboardState() {
  const dashboard = useState<DashboardData | undefined>("dashboard", () => undefined);
  const dashboardError = useState<string | undefined>("dashboard-error", () => undefined);
  const { fetchDashboard } = useCoachApi();

  async function loadDashboard() {
    try {
      dashboard.value = await fetchDashboard(athleteId);
      dashboardError.value = undefined;
    } catch (error) {
      dashboardError.value = error instanceof Error ? error.message : "Unable to load dashboard.";
    }
  }

  return {
    athleteId,
    dashboard,
    dashboardError,
    loadDashboard
  };
}
