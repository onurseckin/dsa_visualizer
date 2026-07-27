import { describe, it, expect } from "vitest";
import { chunkedPrefillTokenBudgetScheduler, DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT, generateChunkedPrefillTokenBudgetSchedulerSteps } from "./chunkedPrefillTokenBudgetScheduler";

describe("chunked-prefill-token-budget-scheduler (Chunked Prefill Token Budget Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(chunkedPrefillTokenBudgetScheduler.id).toBe("chunked-prefill-token-budget-scheduler");
    expect(chunkedPrefillTokenBudgetScheduler.isMlInfra).toBe(true);
    expect(chunkedPrefillTokenBudgetScheduler.mlInfraLevel).toBe(12);
    expect(chunkedPrefillTokenBudgetScheduler.mlInfraCategory).toBe("ml_llm_serving");
    expect(chunkedPrefillTokenBudgetScheduler.categories).toContain("ml_llm_serving");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateChunkedPrefillTokenBudgetSchedulerSteps(DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Chunked Prefill Token Budget Scheduler");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
