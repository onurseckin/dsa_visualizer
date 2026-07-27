import { describe, it, expect } from "vitest";
import { circularDependencyDetection, DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT, generateCircularDependencyDetectionSteps } from "./circularDependencyDetection";

describe("circular-dependency-detection (Circular Dependency Detection in Graph)", () => {
  it("should have correct metadata", () => {
    expect(circularDependencyDetection.id).toBe("circular-dependency-detection");
    expect(circularDependencyDetection.isMlInfra).toBe(true);
    expect(circularDependencyDetection.mlInfraLevel).toBe(3);
    expect(circularDependencyDetection.mlInfraCategory).toBe("ml_autograd_dags");
    expect(circularDependencyDetection.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateCircularDependencyDetectionSteps(DEFAULT_CIRCULARDEPENDENCYDETECTION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Circular Dependency Detection in Graph");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
