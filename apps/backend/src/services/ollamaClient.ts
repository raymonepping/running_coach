import type { AthleteContext, Recommendation } from "../domain/types.js";
import { logger } from "./logger.js";
import { ollamaRequestDuration, ollamaRequestsTotal } from "./metrics.js";

interface OllamaGenerateResponse {
  response?: string;
}

export class OllamaInsightGenerator {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string
  ) {}

  async summarize(context: AthleteContext, recommendation: Recommendation): Promise<string | undefined> {
    const end = ollamaRequestDuration.startTimer();
    const prompt = [
      "You are a local running coach insight writer.",
      "Return only the final athlete-facing explanation in concise natural language.",
      "Do not make medical claims. Do not override readiness state or suggested session.",
      `Readiness: ${recommendation.readiness_state}`,
      `Suggested session: ${recommendation.suggested_session}`,
      `Rationale: ${recommendation.rationale.join("; ")}`,
      `Activity: ${JSON.stringify(context.latestActivity ?? {})}`,
      `Sleep: ${JSON.stringify(context.latestSleep ?? {})}`,
      `Stress: ${JSON.stringify(context.latestStress ?? {})}`
    ].join("\n");

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, "Ollama summary request failed.");
        ollamaRequestsTotal.inc({ model: this.model, result: "http_error" });
        end({ model: this.model, result: "http_error" });
        return undefined;
      }

      const data = (await response.json()) as OllamaGenerateResponse;
      ollamaRequestsTotal.inc({ model: this.model, result: "success" });
      end({ model: this.model, result: "success" });
      return data.response?.trim();
    } catch (error) {
      logger.warn({ error }, "Ollama unavailable; keeping deterministic explanation.");
      ollamaRequestsTotal.inc({ model: this.model, result: "network_error" });
      end({ model: this.model, result: "network_error" });
      return undefined;
    }
  }
}
