import { describe, it, expect } from "vitest";
import { tileIndexGridMapper } from "./tileIndexGridMapper";

describe("tileIndexGridMapper", () => {
  it("should have valid metadata", () => {
    expect(tileIndexGridMapper.id).toBeDefined();
    expect(tileIndexGridMapper.title).toBeDefined();
    expect(tileIndexGridMapper.code).toBeDefined();
    expect(tileIndexGridMapper.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = tileIndexGridMapper.generateSteps(
      tileIndexGridMapper.defaultInput,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = tileIndexGridMapper.code.trim().split("\n");
    const lineExplanations = tileIndexGridMapper.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
