import { describe, it, expect } from "vitest";
import { tritonProgramId1dTo2dMap } from "./tritonProgramId1dTo2dMap";

describe("tritonProgramId1dTo2dMap", () => {
  it("should have valid metadata", () => {
    expect(tritonProgramId1dTo2dMap.id).toBeDefined();
    expect(tritonProgramId1dTo2dMap.title).toBeDefined();
    expect(tritonProgramId1dTo2dMap.code).toBeDefined();
    expect(tritonProgramId1dTo2dMap.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tritonProgramId1dTo2dMap.generateSteps(
      tritonProgramId1dTo2dMap.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tritonProgramId1dTo2dMap.code.trim().split("\n");
    const lineExplanations = tritonProgramId1dTo2dMap.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
