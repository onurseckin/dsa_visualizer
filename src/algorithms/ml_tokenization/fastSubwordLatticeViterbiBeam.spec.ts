import { describe, it, expect } from "vitest";
import { fastSubwordLatticeViterbiBeam } from "./fastSubwordLatticeViterbiBeam";

describe("fast-subword-lattice-viterbi-beam", () => {
  it("should be a valid AlgorithmDefinition", () => {
    expect(fastSubwordLatticeViterbiBeam.id).toBe("fast-subword-lattice-viterbi-beam");
    expect(fastSubwordLatticeViterbiBeam.topicIds).toContain("ml_tokenization");
    expect(
      fastSubwordLatticeViterbiBeam.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(fastSubwordLatticeViterbiBeam.topicIds).toContain("ml_tokenization");
  });

  it("should contain no comments in python code string", () => {
    const code = fastSubwordLatticeViterbiBeam.code;
    expect(code).not.toContain("#");
    expect(code).not.toContain('"""');
    expect(code).not.toContain("'''");
  });

  it("generateSteps should return steps with sequential indices and valid line numbers", () => {
    const steps = fastSubwordLatticeViterbiBeam.generateSteps(
      fastSubwordLatticeViterbiBeam.defaultInput,
    );
    expect(steps.length).toBeGreaterThan(0);
    const codeLines = fastSubwordLatticeViterbiBeam.code.split("\n").length;

    steps.forEach((step, idx) => {
      expect(step.stepIndex).toBe(idx);
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines);
      expect(["array", "matrix", "graph"]).toContain(step.primarySnapshot.kind);
    });
  });

  it("should execute step generation cleanly on all example inputs", () => {
    fastSubwordLatticeViterbiBeam.examples?.forEach((example) => {
      if (typeof example.input === "object" && example.input !== null) {
        const steps = fastSubwordLatticeViterbiBeam.generateSteps(
          example.input as typeof fastSubwordLatticeViterbiBeam.defaultInput,
        );
        expect(steps.length).toBeGreaterThan(0);
      }
    });
  });
});
