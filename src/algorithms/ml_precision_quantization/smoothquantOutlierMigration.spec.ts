import { describe, it, expect } from "vitest";
import {
  smoothquantOutlierMigration,
  generateSmoothquantOutlierMigrationSteps,
  DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
} from "./smoothquantOutlierMigration";

describe("Smoothquant Outlier Migration", () => {
  it("should have correct metadata", () => {
    expect(smoothquantOutlierMigration.id).toBeDefined();
    expect(smoothquantOutlierMigration.title).toBe("Smoothquant Outlier Migration");
    expect(smoothquantOutlierMigration.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateSmoothquantOutlierMigrationSteps(
      DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(smoothquantOutlierMigration.examples?.length).toBe(3);
  });
});
