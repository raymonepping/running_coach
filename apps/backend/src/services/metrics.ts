import type { NextFunction, Request, Response } from "express";
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({
  prefix: "running_coach_",
  register: metricsRegistry
});

export const httpRequestDuration = new Histogram({
  name: "running_coach_http_request_duration_seconds",
  help: "HTTP request duration by method, route, and status.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [metricsRegistry]
});

export const importRowsTotal = new Counter({
  name: "running_coach_import_rows_total",
  help: "Imported signal rows by import type.",
  labelNames: ["import_type"],
  registers: [metricsRegistry]
});

export const importRunsTotal = new Counter({
  name: "running_coach_import_runs_total",
  help: "Import operations by import type and result.",
  labelNames: ["import_type", "result"],
  registers: [metricsRegistry]
});

export const agentRunsTotal = new Counter({
  name: "running_coach_agent_runs_total",
  help: "Autonomous agent pipeline runs by result.",
  labelNames: ["result"],
  registers: [metricsRegistry]
});

export const agentRunDuration = new Histogram({
  name: "running_coach_agent_run_duration_seconds",
  help: "Autonomous agent pipeline duration.",
  labelNames: ["result"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [metricsRegistry]
});

export const agentFindingsTotal = new Counter({
  name: "running_coach_agent_findings_total",
  help: "Agent findings created by agent and severity.",
  labelNames: ["agent_name", "severity"],
  registers: [metricsRegistry]
});

export const recommendationsTotal = new Counter({
  name: "running_coach_recommendations_total",
  help: "Recommendations created by readiness state.",
  labelNames: ["readiness_state"],
  registers: [metricsRegistry]
});

export const recommendationReviewsTotal = new Counter({
  name: "running_coach_recommendation_reviews_total",
  help: "Human recommendation review decisions.",
  labelNames: ["status"],
  registers: [metricsRegistry]
});

export const ollamaRequestsTotal = new Counter({
  name: "running_coach_ollama_requests_total",
  help: "Ollama generation requests by model and result.",
  labelNames: ["model", "result"],
  registers: [metricsRegistry]
});

export const ollamaRequestDuration = new Histogram({
  name: "running_coach_ollama_request_duration_seconds",
  help: "Ollama generation request duration by model and result.",
  labelNames: ["model", "result"],
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry]
});

export const vaultRequestsTotal = new Counter({
  name: "running_coach_vault_requests_total",
  help: "Vault client operations by operation and result.",
  labelNames: ["operation", "result"],
  registers: [metricsRegistry]
});

export const vaultConfigured = new Gauge({
  name: "running_coach_vault_configured",
  help: "Whether Vault AppRole startup configuration was present.",
  registers: [metricsRegistry]
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: routeLabel(req),
      status_code: String(res.statusCode)
    });
  });
  next();
}

function routeLabel(req: Request): string {
  const routePath = typeof req.route?.path === "string" ? req.route.path : undefined;
  if (routePath) {
    return `${req.baseUrl}${routePath}`;
  }
  return req.path.replace(/\/[a-zA-Z0-9:_-]{12,}/g, "/:id");
}
