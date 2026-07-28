import { describe, it, expect } from "vitest";
import { hbmVsSramBandwidthCalculator } from "./hbmVsSramBandwidthCalculator";

describe("hbm-vs-sram-bandwidth-calculator", () => {
  it("should have valid metadata", () => {
    expect(hbmVsSramBandwidthCalculator.id).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.title).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.code).toBeDefined();
    expect(hbmVsSramBandwidthCalculator.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = hbmVsSramBandwidthCalculator.generateSteps(
      hbmVsSramBandwidthCalculator.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = hbmVsSramBandwidthCalculator.code.trim().split("\n");
    const lineExplanations = hbmVsSramBandwidthCalculator.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
