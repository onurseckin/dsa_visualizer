import { describe, it, expect } from "vitest";
import { fastSubwordLatticeViterbiBeam } from "./fastSubwordLatticeViterbiBeam";

describe("fastSubwordLatticeViterbiBeam", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(fastSubwordLatticeViterbiBeam.id).toBe("fastSubwordLatticeViterbiBeam");
    expect(fastSubwordLatticeViterbiBeam.category).toBe("ml_tokenization");
    expect(fastSubwordLatticeViterbiBeam.isMlInfra).toBe(true);
    expect(fastSubwordLatticeViterbiBeam.mlInfraCategory).toBe("ml_tokenization");
  });

  it("generateSteps should return at least one step for defaultInput", () => {
    const steps = fastSubwordLatticeViterbiBeam.generateSteps(fastSubwordLatticeViterbiBeam.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].stepIndex).toBe(0);
  });
});
