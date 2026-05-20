import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import type { DataStore } from "../db/dataStore.js";
import {
  activityFileImportSchema,
  activityImportSchema,
  heartCsvImportSchema,
  heartImportSchema,
  recoveryImportSchema,
  sleepImportSchema,
  sleepCsvImportSchema,
  stressHeartCsvImportSchema,
  stressImportSchema,
  stressCsvImportSchema
} from "../domain/schemas.js";
import { createBaseDocument } from "../domain/documents.js";
import type { AuditEvent } from "../domain/types.js";
import { ImportService } from "../services/importService.js";
import { logger } from "../services/logger.js";

export interface AppDependencies {
  store: DataStore;
  importService: ImportService;
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

function createCorsMiddleware(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.header("origin");
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

export function createApp({ store, importService }: AppDependencies) {
  const app = express();
  const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(createCorsMiddleware(allowedOrigins));
  app.use(helmet());
  app.use(express.json({ limit: "8mb" }));
  app.use(pinoHttp({ logger }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "running-coach-backend" });
  });

  app.post(
    "/api/import/activity",
    asyncRoute(async (req, res) => {
      const input = activityImportSchema.parse(req.body);
      const result = await importService.importActivity(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/activity-file",
    asyncRoute(async (req, res) => {
      const input = activityFileImportSchema.parse(req.body);
      const result = await importService.importActivityFile(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/sleep",
    asyncRoute(async (req, res) => {
      const input = sleepImportSchema.parse(req.body);
      const result = await importService.importSleep(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/sleep-csv",
    asyncRoute(async (req, res) => {
      const input = sleepCsvImportSchema.parse(req.body);
      const result = await importService.importSleepCsv(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/stress",
    asyncRoute(async (req, res) => {
      const input = stressImportSchema.parse(req.body);
      const result = await importService.importStress(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/stress-csv",
    asyncRoute(async (req, res) => {
      const input = stressCsvImportSchema.parse(req.body);
      const result = await importService.importStressCsv(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/stress-heart-csv",
    asyncRoute(async (req, res) => {
      const input = stressHeartCsvImportSchema.parse(req.body);
      const result = await importService.importStressHeartCsv(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/heart",
    asyncRoute(async (req, res) => {
      const input = heartImportSchema.parse(req.body);
      const result = await importService.importHeart(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/heart-csv",
    asyncRoute(async (req, res) => {
      const input = heartCsvImportSchema.parse(req.body);
      const result = await importService.importHeartCsv(input);
      res.status(201).json(result);
    })
  );

  app.post(
    "/api/import/recovery",
    asyncRoute(async (req, res) => {
      const input = recoveryImportSchema.parse(req.body);
      const result = await importService.importRecovery(input);
      res.status(201).json(result);
    })
  );

  app.get(
    "/api/athletes/:id/dashboard",
    asyncRoute(async (req, res) => {
      res.json(await store.getDashboard(req.params.id));
    })
  );

  app.get(
    "/api/athletes/:id/findings",
    asyncRoute(async (req, res) => {
      res.json(await store.listFindings(req.params.id));
    })
  );

  app.get(
    "/api/athletes/:id/recommendations",
    asyncRoute(async (req, res) => {
      res.json(await store.listRecommendations(req.params.id));
    })
  );

  app.post(
    "/api/recommendations/:id/approve",
    asyncRoute(async (req, res) => {
      const recommendation = await store.updateRecommendationStatus(req.params.id, "approved");
      await writeReviewAudit(store, recommendation.athlete_id, recommendation.id, "recommendation.approved");
      res.json(recommendation);
    })
  );

  app.post(
    "/api/recommendations/:id/reject",
    asyncRoute(async (req, res) => {
      const recommendation = await store.updateRecommendationStatus(req.params.id, "rejected");
      await writeReviewAudit(store, recommendation.athlete_id, recommendation.id, "recommendation.rejected");
      res.json(recommendation);
    })
  );

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request body.", issues: error.issues });
      return;
    }
    const message = error instanceof Error ? error.message : "Unexpected error.";
    const status = message.includes("not found") ? 404 : 500;
    res.status(status).json({ error: message });
  });

  return app;
}

async function writeReviewAudit(store: DataStore, athleteId: string, targetId: string, action: string) {
  const audit: AuditEvent = {
    ...createBaseDocument("audit_event", athleteId, "system"),
    action,
    actor: "coach",
    target_id: targetId,
    detail: `Coach marked recommendation as ${action.split(".")[1]}.`
  };
  await store.save("audit_events", audit);
}
