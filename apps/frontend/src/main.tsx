import React from "react";
import ReactDOM from "react-dom/client";
import { useEffect, useState } from "react";
import { fetchDashboard, reviewRecommendation } from "./api/client";
import { AppShell } from "./components/AppShell";
import {
  AuditPage,
  InsightsPage,
  ProfilePage,
  RecommendationsPage,
  SettingsPage
} from "./pages/DetailPages";
import { Dashboard } from "./pages/Dashboard";
import { ImportPage } from "./pages/Imports";
import type { PageKey } from "./pages/pageTypes";
import "./styles/global.css";
import type { DashboardData } from "./types/domain";

const athleteId = "demo-athlete";

function App() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [error, setError] = useState<string>();

  async function load() {
    try {
      setDashboard(await fetchDashboard(athleteId));
      setError(undefined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    }
  }

  async function reviewLatest(action: "approve" | "reject") {
    if (!dashboard?.latestRecommendation) return;
    await reviewRecommendation(dashboard.latestRecommendation.id, action);
    await load();
  }

  async function reviewById(id: string, action: "approve" | "reject") {
    await reviewRecommendation(id, action);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  function renderPage() {
    switch (page) {
      case "profile":
        return <ProfilePage dashboard={dashboard} />;
      case "activity-import":
        return <ImportPage kind="activity" onImported={load} />;
      case "sleep-import":
        return <ImportPage kind="sleep" onImported={load} />;
      case "stress-import":
        return <ImportPage kind="stress" onImported={load} />;
      case "insights":
        return <InsightsPage dashboard={dashboard} />;
      case "recommendations":
        return <RecommendationsPage dashboard={dashboard} onReview={reviewById} />;
      case "audit":
        return <AuditPage dashboard={dashboard} />;
      case "settings":
        return <SettingsPage />;
      case "dashboard":
      default:
        return <Dashboard dashboard={dashboard} onNavigate={setPage} onReview={reviewLatest} />;
    }
  }

  return (
    <AppShell currentPage={page} dashboard={dashboard} onNavigate={setPage}>
      {error ? <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-900">{error}</div> : null}
      {renderPage()}
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
