import { describe, expect, it } from "vitest";
import {
  DEFAULT_SRAM_GEMM_TILING_INPUT,
  generateSramGemmTilingSteps,
  sramGemmTiling,
} from "../sramGemmTiling";

describe("sramGemmTiling algorithm definition", () => {
  it("has valid metadata and ML Infra markers", () => {
    expect(sramGemmTiling.id).toBe("sram-gemm-tiling");
    expect(sramGemmTiling.category).toBe("ml_gemm_roofline");
    expect(sramGemmTiling.isMlInfra).toBe(true);
    expect(sramGemmTiling.mlInfraLevel).toBe(1);
    expect(sramGemmTiling.sources?.[0].type).toBe("ml_infra");
  });

  it("computes basic tiling schedule correctly", () => {
    const steps = generateSramGemmTilingSteps(DEFAULT_SRAM_GEMM_TILING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total_tiles).toBe(8);
  });

  it("handles asymmetric tile shapes", () => {
    const steps = generateSramGemmTilingSteps({
      M: 128,
      N: 256,
      K: 512,
      tileM: 64,
      tileN: 64,
      tileK: 128,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total_tiles).toBe(32);
  });

  it("handles tile size larger than matrix bounds", () => {
    const steps = generateSramGemmTilingSteps({
      M: 16,
      N: 16,
      K: 16,
      tileM: 32,
      tileN: 32,
      tileK: 32,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.total_tiles).toBe(1);
  });
});
