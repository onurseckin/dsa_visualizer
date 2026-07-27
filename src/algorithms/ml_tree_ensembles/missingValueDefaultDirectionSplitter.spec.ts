import { describe, it, expect } from "vitest";
import { missingValueDefaultDirectionSplitter } from "./missingValueDefaultDirectionSplitter";

describe("missingValueDefaultDirectionSplitter", () => {
  it("should have valid metadata", () => {
    expect(missingValueDefaultDirectionSplitter.id).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.title).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.code).toBeDefined();
    expect(missingValueDefaultDirectionSplitter.examples?.length).toBeGreaterThan(0);
    expect(missingValueDefaultDirectionSplitter.description.length).toBeGreaterThan(200);
    expect(missingValueDefaultDirectionSplitter.topicGuide.sections.length).toBeGreaterThanOrEqual(4);
  });

  it("should generate at least 20 steps", () => {
    const steps = missingValueDefaultDirectionSplitter.generateSteps(
      missingValueDefaultDirectionSplitter.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });

  it("should map every line of code in trivia.lineExplanations", () => {
    const lineExplanations = missingValueDefaultDirectionSplitter.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();
    const codeLines = missingValueDefaultDirectionSplitter.code.trim().split("\n");
    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations?.[i]).toBeDefined();
      expect(lineExplanations?.[i]?.length).toBeGreaterThan(0);
    }
  });
});
