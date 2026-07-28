import { describe, it, expect } from "vitest";
import { regularizedOptimalLeafWeight } from "./regularizedOptimalLeafWeight";

describe("regularized-optimal-leaf-weight", () => {
  it("should have valid metadata", () => {
    expect(regularizedOptimalLeafWeight.id).toBeDefined();
    expect(regularizedOptimalLeafWeight.title).toBeDefined();
    expect(regularizedOptimalLeafWeight.code).toBeDefined();
    expect(regularizedOptimalLeafWeight.examples?.length).toBeGreaterThan(0);
    expect(regularizedOptimalLeafWeight.description.length).toBeGreaterThan(200);
    expect(regularizedOptimalLeafWeight.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = regularizedOptimalLeafWeight.generateSteps(
      regularizedOptimalLeafWeight.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = regularizedOptimalLeafWeight.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = regularizedOptimalLeafWeight.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
