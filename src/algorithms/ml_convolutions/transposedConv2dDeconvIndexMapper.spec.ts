import { describe, it, expect } from "vitest";
import {
  transposedConv2dDeconvIndexMapper,
  DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
  generateTransposedConv2dDeconvIndexMapperSteps,
} from "./transposedConv2dDeconvIndexMapper";

describe("transposedConv2dDeconvIndexMapper", () => {
  it("should have correct metadata", () => {
    expect(transposedConv2dDeconvIndexMapper.id).toBe("transposedConv2dDeconvIndexMapper");
    expect(transposedConv2dDeconvIndexMapper.isMlInfra).toBe(true);
    expect(transposedConv2dDeconvIndexMapper.mlInfraLevel).toBe(8);
    expect(transposedConv2dDeconvIndexMapper.mlInfraCategory).toBe("ml_convolutions");
    expect(transposedConv2dDeconvIndexMapper.categories).toContain("ml_convolutions");
    expect(transposedConv2dDeconvIndexMapper.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTransposedConv2dDeconvIndexMapperSteps(
      DEFAULT_TRANSPOSEDCONV2DDECONVINDEXMAPPER_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Transposed 2D Convolution Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
