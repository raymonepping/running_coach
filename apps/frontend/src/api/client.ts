import type { DashboardData, Recommendation } from "../types/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function fetchDashboard(athleteId: string): Promise<DashboardData> {
  const response = await fetch(`${apiBaseUrl}/api/athletes/${athleteId}/dashboard`);
  if (!response.ok) throw new Error("Unable to load dashboard.");
  return response.json() as Promise<DashboardData>;
}

export async function reviewRecommendation(id: string, action: "approve" | "reject"): Promise<Recommendation> {
  const response = await fetch(`${apiBaseUrl}/api/recommendations/${id}/${action}`, { method: "POST" });
  if (!response.ok) throw new Error("Unable to update recommendation.");
  return response.json() as Promise<Recommendation>;
}
