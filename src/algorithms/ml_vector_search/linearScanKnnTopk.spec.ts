import { describe, it, expect } from "vitest";
import { linearScanKnnTopk } from "./linearScanKnnTopk";

describe("linear-scan-knn-topk", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(linearScanKnnTopk).toBeDefined();
    expect(linearScanKnnTopk.id).toBe("linear-scan-knn-topk");
    expect(linearScanKnnTopk.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(linearScanKnnTopk.topicIds).toContain("ml_vector_search");
  });

  it("should have clean code property with no Python comments", () => {
    const code = linearScanKnnTopk.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("should generate steps successfully and have valid line numbers", () => {
    const steps = linearScanKnnTopk.generateSteps(linearScanKnnTopk.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);

    const codeLines = linearScanKnnTopk.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
      expect(step.explanation.what.length).toBeGreaterThan(0);
      expect(step.explanation.why.length).toBeGreaterThan(0);
      expect(["array", "vector"]).toContain(step.primarySnapshot.kind);
    });
  });

  it("should handle custom inputs and edge cases without runtime errors", () => {
    const inputWithExactMatch = {
      query: [1.0, 0.8],
      database: [
        [0.1, 0.2],
        [0.9, 1.1],
        [1.0, 0.8],
      ],
      k: 1,
    };
    const steps1 = linearScanKnnTopk.generateSteps(inputWithExactMatch);
    expect(steps1.length).toBeGreaterThan(0);

    const inputKGreaterThanN = {
      query: [0.0, 0.0],
      database: [
        [1.0, 1.0],
        [2.0, 2.0],
      ],
      k: 10,
    };
    const steps2 = linearScanKnnTopk.generateSteps(inputKGreaterThanN);
    expect(steps2.length).toBeGreaterThan(0);
  });
});
