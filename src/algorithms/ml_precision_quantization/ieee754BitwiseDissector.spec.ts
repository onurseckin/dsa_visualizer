import { describe, it, expect } from "vitest";
import { ieee754BitwiseDissector, DEFAULT_IEEE754BITWISEDISSECTOR_INPUT, generateIeee754BitwiseDissectorSteps } from "./ieee754BitwiseDissector";

describe("ieee754-bitwise-dissector (IEEE-754 Floating Point Bit Dissector)", () => {
  it("should have correct metadata", () => {
    expect(ieee754BitwiseDissector.id).toBe("ieee754-bitwise-dissector");
    expect(ieee754BitwiseDissector.isMlInfra).toBe(true);
    expect(ieee754BitwiseDissector.mlInfraLevel).toBe(4);
    expect(ieee754BitwiseDissector.mlInfraCategory).toBe("ml_precision_quantization");
    expect(ieee754BitwiseDissector.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateIeee754BitwiseDissectorSteps(DEFAULT_IEEE754BITWISEDISSECTOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("IEEE-754 Floating Point Bit Dissector");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
