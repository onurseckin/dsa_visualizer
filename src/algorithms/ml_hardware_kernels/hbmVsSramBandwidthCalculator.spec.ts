import { describe, it, expect } from "vitest";
import { hbmVsSramBandwidthCalculator, DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT, generateHbmVsSramBandwidthCalculatorSteps } from "./hbmVsSramBandwidthCalculator";

describe("hbm-vs-sram-bandwidth-calculator (HBM vs SRAM Bandwidth & Latency Calculator)", () => {
  it("should have correct metadata", () => {
    expect(hbmVsSramBandwidthCalculator.id).toBe("hbm-vs-sram-bandwidth-calculator");
    expect(hbmVsSramBandwidthCalculator.isMlInfra).toBe(true);
    expect(hbmVsSramBandwidthCalculator.mlInfraLevel).toBe(10);
    expect(hbmVsSramBandwidthCalculator.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(hbmVsSramBandwidthCalculator.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateHbmVsSramBandwidthCalculatorSteps(DEFAULT_HBMVSSRAMBANDWIDTHCALCULATOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("HBM vs SRAM Bandwidth & Latency Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
