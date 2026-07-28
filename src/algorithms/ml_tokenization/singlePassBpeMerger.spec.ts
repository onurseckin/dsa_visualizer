import { describe, it, expect } from "vitest";
import { singlePassBpeMerger } from "./singlePassBpeMerger";
import { requireExampleInputs } from "../specs/assertions";

describe("single-pass-bpe-merger", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(singlePassBpeMerger.id).toBe("single-pass-bpe-merger");
    expect(singlePassBpeMerger.topicIds).toContain("ml_tokenization");
    expect(singlePassBpeMerger.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(singlePassBpeMerger.topicIds).toContain("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = singlePassBpeMerger.generateSteps(singlePassBpeMerger.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });

  it("generateSteps should handle all examples without errors", () => {
    for (const input of requireExampleInputs(
      singlePassBpeMerger,
      (value): value is typeof singlePassBpeMerger.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = singlePassBpeMerger.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);

      // Verify codeLines are valid numbers within python code length
      const codeLines = singlePassBpeMerger.code.split("\n").length;
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThan(0);
        expect(step.codeLine).toBeLessThanOrEqual(codeLines);
        expect(step.primarySnapshot.kind).toBe("array");
      }
    }
  });
});
