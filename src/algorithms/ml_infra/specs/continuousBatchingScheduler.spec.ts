import { describe, expect, it } from "vitest";
import {
  CONTINUOUS_BATCHING_EXAMPLES,
  CONTINUOUS_BATCHING_SCHEDULER_CODE,
  DEFAULT_CONTINUOUS_BATCHING_INPUT,
  continuousBatchingScheduler,
  generateContinuousBatchingSteps,
} from "../continuousBatchingScheduler";
import type { MatrixVisualSnapshot } from "../../../types/dsa";

describe("continuousBatchingScheduler (Level 10 ML Infra)", () => {
  it("exports correct algorithm metadata", () => {
    expect(continuousBatchingScheduler.id).toBe("continuous-batching-scheduler");
    expect(continuousBatchingScheduler.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(continuousBatchingScheduler.topicIds).toContain("ml_llm_serving");
    expect(continuousBatchingScheduler.sources).toEqual([
      { type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" },
    ]);
  });

  it("contains Python code string and default input", () => {
    expect(CONTINUOUS_BATCHING_SCHEDULER_CODE).toContain("def continuous_batching_scheduler");
    expect(continuousBatchingScheduler.code).toBe(CONTINUOUS_BATCHING_SCHEDULER_CODE);
    expect(continuousBatchingScheduler.defaultInput).toEqual(DEFAULT_CONTINUOUS_BATCHING_INPUT);
  });

  it("generates valid steps for default input (>= 20 steps, matrix snapshot)", () => {
    const steps = generateContinuousBatchingSteps(DEFAULT_CONTINUOUS_BATCHING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    for (let i = 0; i < steps.length; i++) {
      expect(steps[i].stepIndex).toBe(i);
      expect(typeof steps[i].codeLine).toBe("number");
      expect(steps[i].explanation.what).toBeTruthy();
      expect(steps[i].explanation.why).toBeTruthy();
    }

    const firstSnap = steps[0].primarySnapshot as MatrixVisualSnapshot;
    expect(firstSnap.kind).toBe("matrix");
    expect(firstSnap.rows).toBe(4);
    expect(firstSnap.cols).toBe(5);

    const codeLines = continuousBatchingScheduler.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = continuousBatchingScheduler.code.split("\n");
    const lineExplanations = continuousBatchingScheduler.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("handles basic, complex, and negative examples cleanly", () => {
    expect(CONTINUOUS_BATCHING_EXAMPLES).toHaveLength(3);
    for (const example of CONTINUOUS_BATCHING_EXAMPLES) {
      if (typeof example.input !== "string") {
        const steps = generateContinuousBatchingSteps(example.input);
        expect(steps.length).toBeGreaterThan(0);
      }
    }
  });
});
