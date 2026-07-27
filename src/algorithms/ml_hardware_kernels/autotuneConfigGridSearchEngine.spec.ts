import { describe, it, expect } from "vitest";
import { autotuneConfigGridSearchEngine, DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT, generateAutotuneConfigGridSearchEngineSteps } from "./autotuneConfigGridSearchEngine";

describe("autotune-config-grid-search-engine (Triton `@triton.autotune` Configuration Search Engine)", () => {
  it("should have correct metadata", () => {
    expect(autotuneConfigGridSearchEngine.id).toBe("autotune-config-grid-search-engine");
    expect(autotuneConfigGridSearchEngine.isMlInfra).toBe(true);
    expect(autotuneConfigGridSearchEngine.mlInfraLevel).toBe(10);
    expect(autotuneConfigGridSearchEngine.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(autotuneConfigGridSearchEngine.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAutotuneConfigGridSearchEngineSteps(DEFAULT_AUTOTUNECONFIGGRIDSEARCHENGINE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton `@triton.autotune` Configuration Search Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
