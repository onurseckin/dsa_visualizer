import { describe, it, expect } from "vitest";
import {
  ieee754BitwiseDissector,
  generateIeee754BitwiseDissectorSteps,
  DEFAULT_IEEE754BITWISEDISSECTOR_INPUT,
} from "./ieee754BitwiseDissector";

describe("Ieee754 Bitwise Dissector", () => {
  it("should have correct metadata", () => {
    expect(ieee754BitwiseDissector.id).toBeDefined();
    expect(ieee754BitwiseDissector.title).toBe("Ieee754 Bitwise Dissector");
    expect(ieee754BitwiseDissector.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateIeee754BitwiseDissectorSteps(DEFAULT_IEEE754BITWISEDISSECTOR_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(ieee754BitwiseDissector.examples?.length).toBe(3);
  });
});
