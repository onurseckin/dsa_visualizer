import { describe, it, expect } from "vitest";
import {
  deepCopyLinkedListRandom,
  DEFAULT_DEEPCOPYLINKEDLISTRANDOM_INPUT,
  generateDeepCopyLinkedListRandomSteps,
} from "./deepCopyLinkedListRandom";

describe("deep-copy-linked-list-random (Deep Copy Graph with Random Pointers)", () => {
  it("should have correct metadata", () => {
    expect(deepCopyLinkedListRandom.id).toBe("deep-copy-linked-list-random");
    expect(deepCopyLinkedListRandom.isMlInfra).toBe(true);
    expect(deepCopyLinkedListRandom.mlInfraLevel).toBe(3);
    expect(deepCopyLinkedListRandom.mlInfraCategory).toBe("ml_autograd_dags");
    expect(deepCopyLinkedListRandom.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateDeepCopyLinkedListRandomSteps(DEFAULT_DEEPCOPYLINKEDLISTRANDOM_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Deep Copy Graph with Random Pointers");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
