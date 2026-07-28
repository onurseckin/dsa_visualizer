import { describe, it, expect } from "vitest";
import { gaussianL2LocalitySensitiveHash } from "./gaussianL2LocalitySensitiveHash";
import { requireExampleInputs } from "../specs/assertions";

describe("gaussian-l2-locality-sensitive-hash", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(gaussianL2LocalitySensitiveHash).toBeDefined();
    expect(gaussianL2LocalitySensitiveHash.id).toBe("gaussian-l2-locality-sensitive-hash");
    expect(
      gaussianL2LocalitySensitiveHash.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(gaussianL2LocalitySensitiveHash.topicIds).toContain("ml_vector_search");
  });

  it("should contain no comments in the Python code string", () => {
    const code = gaussianL2LocalitySensitiveHash.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully with vector visual snapshot kind", () => {
    const steps = gaussianL2LocalitySensitiveHash.generateSteps(
      gaussianL2LocalitySensitiveHash.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    for (const step of steps) {
      expect(step.primarySnapshot.kind).toBe("vector");
      expect(step.explanation.what).toBeTruthy();
      expect(step.explanation.why).toBeTruthy();
      expect(step.codeLine).toBeGreaterThan(0);
    }
  });

  it("should run generateSteps for all examples without runtime errors", () => {
    for (const input of requireExampleInputs(
      gaussianL2LocalitySensitiveHash,
      (value): value is typeof gaussianL2LocalitySensitiveHash.defaultInput =>
        typeof value === "object" && value !== null,
    )) {
      const steps = gaussianL2LocalitySensitiveHash.generateSteps(input);
      expect(steps.length).toBeGreaterThan(0);
    }
  });
});
