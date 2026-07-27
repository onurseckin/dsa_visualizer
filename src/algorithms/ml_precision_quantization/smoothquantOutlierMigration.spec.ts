import { describe, it, expect } from "vitest";
import { smoothquantOutlierMigration, DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT, generateSmoothquantOutlierMigrationSteps } from "./smoothquantOutlierMigration";

describe("smoothquant-outlier-migration (SmoothQuant Activation Outlier Migration Engine)", () => {
  it("should have correct metadata", () => {
    expect(smoothquantOutlierMigration.id).toBe("smoothquant-outlier-migration");
    expect(smoothquantOutlierMigration.isMlInfra).toBe(true);
    expect(smoothquantOutlierMigration.mlInfraLevel).toBe(4);
    expect(smoothquantOutlierMigration.mlInfraCategory).toBe("ml_precision_quantization");
    expect(smoothquantOutlierMigration.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateSmoothquantOutlierMigrationSteps(DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("SmoothQuant Activation Outlier Migration Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
