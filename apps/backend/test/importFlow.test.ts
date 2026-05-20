import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/db/memoryStore.js";
import { ImportService } from "../src/services/importService.js";
import activity from "../../../samples/activity.sample.json" assert { type: "json" };
import sleep from "../../../samples/sleep.sample.json" assert { type: "json" };
import stress from "../../../samples/stress.sample.json" assert { type: "json" };

describe("import to autonomous recommendation flow", () => {
  it("creates findings, recommendation, and audit events after imports", async () => {
    const store = new MemoryStore();
    const importService = new ImportService(store);

    await importService.importActivity(activity);
    await importService.importSleep(sleep);
    await importService.importStress(stress);

    const dashboard = await store.getDashboard("demo-athlete");

    expect(dashboard.latestRecommendation?.readiness_state).toBe("RECOVER");
    expect(dashboard.findings.length).toBeGreaterThan(0);
    expect(dashboard.auditEvents.length).toBeGreaterThan(0);
  });

  it("replaces date-keyed CSV records when re-imported", async () => {
    const store = new MemoryStore();
    const importService = new ImportService(store);

    await importService.importHeartCsv({
      athlete_id: "demo-athlete",
      content: `Date;Resting;High
19/May;62 bpm;112 bpm`,
      file_name: "Heart.csv"
    });
    await importService.importHeartCsv({
      athlete_id: "demo-athlete",
      content: `Date;Resting;High
19/May;64 bpm;120 bpm`,
      file_name: "Heart.csv"
    });

    const dashboard = await store.getDashboard("demo-athlete");
    expect(dashboard.latestHeartRate).toMatchObject({
      id: "demo-athlete:heart:2026-05-19",
      resting_hr_bpm: 64,
      high_hr_bpm: 120
    });
  });
});
