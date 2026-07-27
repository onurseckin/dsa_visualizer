import { describe, it, expect } from "vitest";
import { linearScanKnnTopk } from "./linearScanKnnTopk";

describe("linearScanKnnTopk", () => {
  it("should be defined and have correctly populated fields", () => {
    expect(linearScanKnnTopk).toBeDefined();
    expect(linearScanKnnTopk.id).toBe("linearScanKnnTopk");
    expect(linearScanKnnTopk.isMlInfra).toBe(true);
    expect(linearScanKnnTopk.mlInfraLevel).toBe(5);
    expect(linearScanKnnTopk.categories).toContain("ml_vector_search");
  });

  it("should generate steps successfully", () => {
    const steps = linearScanKnnTopk.generateSteps(linearScanKnnTopk.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
