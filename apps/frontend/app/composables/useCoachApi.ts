import type { DashboardData, Recommendation } from "~/types/domain";

export function useCoachApi() {
  const config = useRuntimeConfig();
  const apiBaseUrl = import.meta.server ? config.apiInternalBaseUrl : config.public.apiBaseUrl;

  async function fetchDashboard(athleteId: string): Promise<DashboardData> {
    return await $fetch<DashboardData>(`/api/athletes/${athleteId}/dashboard`, {
      baseURL: apiBaseUrl
    });
  }

  async function reviewRecommendation(id: string, action: "approve" | "reject"): Promise<Recommendation> {
    return await $fetch<Recommendation>(`/api/recommendations/${id}/${action}`, {
      baseURL: apiBaseUrl,
      method: "POST"
    });
  }

  async function importRecord(kind: "activity" | "sleep" | "stress" | "recovery", payload: unknown): Promise<void> {
    await $fetch(`/api/import/${kind}`, {
      baseURL: apiBaseUrl,
      body: payload,
      method: "POST"
    });
  }

  async function importActivityFile(payload: {
    athlete_id: string;
    file_name: string;
    file_type: "gpx" | "tcx";
    content: string;
  }): Promise<void> {
    await $fetch("/api/import/activity-file", {
      baseURL: apiBaseUrl,
      body: payload,
      method: "POST"
    });
  }

  async function importSleepCsv(payload: { athlete_id: string; file_name: string; content: string }): Promise<void> {
    await $fetch("/api/import/sleep-csv", {
      baseURL: apiBaseUrl,
      body: payload,
      method: "POST"
    });
  }

  return {
    fetchDashboard,
    importActivityFile,
    importRecord,
    importSleepCsv,
    reviewRecommendation
  };
}
