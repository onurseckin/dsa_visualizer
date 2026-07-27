import { describe, it, expect } from "vitest";
import { exactGreedySplitSearch } from "./exactGreedySplitSearch";

describe("exactGreedySplitSearch", () => {
  it("should have valid metadata", () => {
    expect(exactGreedySplitSearch.id).toBeDefined();
    expect(exactGreedySplitSearch.title).toBeDefined();
    expect(exactGreedySplitSearch.code).toBeDefined();
    expect(exactGreedySplitSearch.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = exactGreedySplitSearch.generateSteps(exactGreedySplitSearch.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
