import { describe, it, expect } from "vitest";
import { exactGreedySplitSearch, DEFAULT_EXACTGREEDYSPLITSEARCH_INPUT, generateExactGreedySplitSearchSteps } from "./exactGreedySplitSearch";

describe("exact-greedy-split-search (XGBoost Exact Greedy Split Finder O(n d log n))", () => {
  it("should have correct metadata", () => {
    expect(exactGreedySplitSearch.id).toBe("exact-greedy-split-search");
    expect(exactGreedySplitSearch.isMlInfra).toBe(true);
    expect(exactGreedySplitSearch.mlInfraLevel).toBe(9);
    expect(exactGreedySplitSearch.mlInfraCategory).toBe("ml_tree_ensembles");
    expect(exactGreedySplitSearch.categories).toContain("ml_tree_ensembles");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateExactGreedySplitSearchSteps(DEFAULT_EXACTGREEDYSPLITSEARCH_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("XGBoost Exact Greedy Split Finder O(n d log n)");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
