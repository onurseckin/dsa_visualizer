import { describe, it, expect } from "vitest";
import { onlineMaxLogsumexpTracker } from "./onlineMaxLogsumexpTracker";

describe("online-max-logsumexp-tracker", () => {
  it("should have valid metadata", () => {
    expect(onlineMaxLogsumexpTracker.id).toBeDefined();
    expect(onlineMaxLogsumexpTracker.title).toBeDefined();
    expect(onlineMaxLogsumexpTracker.code).toBeDefined();
    expect(onlineMaxLogsumexpTracker.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = onlineMaxLogsumexpTracker.generateSteps(onlineMaxLogsumexpTracker.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = onlineMaxLogsumexpTracker.code.trim().split("\n");
    const lineExplanations = onlineMaxLogsumexpTracker.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
