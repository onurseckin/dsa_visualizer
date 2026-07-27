import { describe, it, expect } from "vitest";
import {
  chunkedPrefillTokenBudgetScheduler,
  DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT,
  generateChunkedPrefillTokenBudgetSchedulerSteps,
} from "./chunkedPrefillTokenBudgetScheduler";
import type { MatrixVisualSnapshot } from "../../types/dsa";

describe("chunked-prefill-token-budget-scheduler (Chunked Prefill Token Budget Scheduler)", () => {
  it("should have correct metadata and full trivia lineExplanations", () => {
    expect(chunkedPrefillTokenBudgetScheduler.id).toBe("chunked-prefill-token-budget-scheduler");
    expect(chunkedPrefillTokenBudgetScheduler.isMlInfra).toBe(true);
    expect(chunkedPrefillTokenBudgetScheduler.mlInfraLevel).toBe(12);
    expect(chunkedPrefillTokenBudgetScheduler.mlInfraCategory).toBe("ml_llm_serving");
    expect(chunkedPrefillTokenBudgetScheduler.categories).toContain("ml_llm_serving");

    const codeLines = chunkedPrefillTokenBudgetScheduler.code.trim().split("\n").length;
    const explanationKeys = Object.keys(chunkedPrefillTokenBudgetScheduler.trivia?.lineExplanations || {}).map(Number);
    expect(explanationKeys.length).toBe(codeLines);
    for (let i = 1; i <= codeLines; i++) {
      expect(chunkedPrefillTokenBudgetScheduler.trivia?.lineExplanations?.[i]).toBeDefined();
    }
  });

  it("should generate >= 20 algorithm steps with matrix snapshots", () => {
    const steps = generateChunkedPrefillTokenBudgetSchedulerSteps(
      DEFAULT_CHUNKEDPREFILLTOKENBUDGETSCHEDULER_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Chunked Prefill Token Budget Scheduler");
    expect(steps[steps.length - 1].explanation.what).toContain("Execution Complete");

    const snap = steps[0].primarySnapshot as MatrixVisualSnapshot;
    expect(snap.kind).toBe("matrix");
  });
});

