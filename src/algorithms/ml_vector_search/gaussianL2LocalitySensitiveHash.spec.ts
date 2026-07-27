import { describe, it, expect } from "vitest";
import { gaussianL2LocalitySensitiveHash } from "./gaussianL2LocalitySensitiveHash";

describe("gaussianL2LocalitySensitiveHash", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(gaussianL2LocalitySensitiveHash).toBeDefined();
    expect(gaussianL2LocalitySensitiveHash.id).toBe("gaussianL2LocalitySensitiveHash");
    expect(gaussianL2LocalitySensitiveHash.isMlInfra).toBe(true);
    expect(gaussianL2LocalitySensitiveHash.mlInfraLevel).toBe(5);
    expect(gaussianL2LocalitySensitiveHash.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = gaussianL2LocalitySensitiveHash.generateSteps(gaussianL2LocalitySensitiveHash.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
