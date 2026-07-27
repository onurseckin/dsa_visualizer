import { describe, it, expect } from "vitest";
import { greedyDecisionTreeBuilder } from "./greedyDecisionTreeBuilder";

describe("greedyDecisionTreeBuilder", () => {
  it("should have valid metadata", () => {
    expect(greedyDecisionTreeBuilder.id).toBeDefined();
    expect(greedyDecisionTreeBuilder.title).toBeDefined();
    expect(greedyDecisionTreeBuilder.code).toBeDefined();
    expect(greedyDecisionTreeBuilder.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = greedyDecisionTreeBuilder.generateSteps(greedyDecisionTreeBuilder.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
