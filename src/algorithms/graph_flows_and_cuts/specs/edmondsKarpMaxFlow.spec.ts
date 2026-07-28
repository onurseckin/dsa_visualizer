import { describe, expect, it } from "vitest";
import {
  edmondsKarpMaxFlow,
  generateEdmondsKarpSteps,
  EDMONDS_KARP_CODE,
} from "../edmondsKarpMaxFlow";
import { requireExampleInputs } from "../../specs/assertions";

describe("edmondsKarpMaxFlow step generator and code line alignment", () => {
  const lineCount = EDMONDS_KARP_CODE.split("\n").length;

  it("should have correct code line count", () => {
    expect(lineCount).toBe(39);
  });

  it("should generate valid steps with 1-indexed codeLine within bounds for defaultInput", () => {
    const steps = generateEdmondsKarpSteps(edmondsKarpMaxFlow.defaultInput);
    expect(steps.length).toBeGreaterThan(0);

    const codeLines = new Set<number>();
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
      codeLines.add(step.codeLine);
    }

    // Dynamic movement check: should visit multiple distinct lines
    expect(codeLines.size).toBeGreaterThan(3);
  });

  it("should generate valid steps with 1-indexed codeLine within bounds for all examples", () => {
    for (const input of requireExampleInputs(
      edmondsKarpMaxFlow,
      (value): value is typeof edmondsKarpMaxFlow.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = generateEdmondsKarpSteps(input);
      expect(steps.length).toBeGreaterThan(0);

      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(lineCount);
      }
    }
  });
});
