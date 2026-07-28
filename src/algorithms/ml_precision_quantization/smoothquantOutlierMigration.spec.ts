import { describe, it, expect } from "vitest";
import {
  smoothquantOutlierMigration,
  generateSmoothquantOutlierMigrationSteps,
  DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
} from "./smoothquantOutlierMigration";

describe("Smoothquant Outlier Migration", () => {
  it("should have correct metadata", () => {
    expect(smoothquantOutlierMigration.id).toBe("smoothquant-outlier-migration");
    expect(smoothquantOutlierMigration.title).toBe("Smoothquant Outlier Migration");
    expect(smoothquantOutlierMigration.topicIds).toContain("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateSmoothquantOutlierMigrationSteps(
      DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = smoothquantOutlierMigration.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = smoothquantOutlierMigration.code.split("\n");
    const lineExplanations = smoothquantOutlierMigration.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(smoothquantOutlierMigration.examples?.length).toBe(3);
  });
});
