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
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Deep Copy Graph Cloner");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = deepCopyLinkedListRandom.code.trim().split("\n").length;
    expect(deepCopyLinkedListRandom.trivia).toBeDefined();
    expect(deepCopyLinkedListRandom.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = deepCopyLinkedListRandom.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = deepCopyLinkedListRandom.code.trim().split("\n").length;
    const steps = generateDeepCopyLinkedListRandomSteps(DEFAULT_DEEPCOPYLINKEDLISTRANDOM_INPUT);
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
