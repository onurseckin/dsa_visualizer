import { describe, expect, it } from "vitest";
import { DEFAULT_DAG_DP_INPUT, generateDagDpSteps } from "../dagDpLongestPath";

describe("generateDagDpSteps unit tests", () => {
  it("generates steps without errors and returns non-empty steps", () => {
    const steps = generateDagDpSteps(DEFAULT_DAG_DP_INPUT);
    expect(steps.length).toBeGreaterThan(0);

    for (const step of steps) {
      expect(step.stepIndex).toBeGreaterThanOrEqual(0);
      expect(step.codeLine).toBeGreaterThan(0);
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.primarySnapshot.kind).toBe("graph");
    }
  });

  it("computes the correct longest path for default input", () => {
    const steps = generateDagDpSteps(DEFAULT_DAG_DP_INPUT);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.explanation.what).toContain("Longest Path in DAG");
    expect(lastStep.auxiliaryState?.customState?.["Max Length"]).toBe(10);
    expect(lastStep.auxiliaryState?.customState?.["Longest Path"]).toBe("A -> C -> E -> F");
  });
});
