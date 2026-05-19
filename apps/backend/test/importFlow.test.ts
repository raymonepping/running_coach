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
});
