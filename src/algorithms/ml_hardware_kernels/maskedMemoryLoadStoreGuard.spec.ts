import { describe, it, expect } from "vitest";
import { maskedMemoryLoadStoreGuard } from "./maskedMemoryLoadStoreGuard";

describe("masked-memory-load-store-guard", () => {
  it("should have valid metadata", () => {
    expect(maskedMemoryLoadStoreGuard.id).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.title).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.code).toBeDefined();
    expect(maskedMemoryLoadStoreGuard.examples?.length).toBeGreaterThan(0);
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = maskedMemoryLoadStoreGuard.generateSteps(maskedMemoryLoadStoreGuard.defaultInput);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].primarySnapshot.kind).toBe("matrix");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = maskedMemoryLoadStoreGuard.code.trim().split("\n");
    const lineExplanations = maskedMemoryLoadStoreGuard.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });
});
