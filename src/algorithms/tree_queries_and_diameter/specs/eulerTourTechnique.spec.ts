import { describe, expect, it } from "vitest";
import {
  DEFAULT_EULER_TOUR_INPUT,
  eulerTourTechnique,
  generateEulerTourTechniqueSteps,
} from "../eulerTourTechnique";

describe("eulerTourTechnique algorithm spec", () => {
  it("should have valid definition metadata", () => {
    expect(eulerTourTechnique.id).toBe("euler-tour-technique");
    expect(eulerTourTechnique.title).toBe("Euler Tour Technique (Tree Flattening)");
    expect(eulerTourTechnique.topicIds).toContain("tree_fundamentals");
    expect(eulerTourTechnique.difficulty).toBe("Medium");
    expect(eulerTourTechnique.defaultInput).toEqual(DEFAULT_EULER_TOUR_INPUT);
  });

  it("should generate steps and produces >= 20 steps for default input", () => {
    const steps = generateEulerTourTechniqueSteps(DEFAULT_EULER_TOUR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const firstStep = steps[0];
    expect(firstStep.codeLine).toBe(1);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.codeLine).toBe(25);
    expect(lastStep.variables.completed).toBe(true);
  });

  it("should handle single node tree boundary case", () => {
    const input = {
      numNodes: 1,
      edges: [] as [number, number][],
      values: [100],
    };
    const steps = generateEulerTourTechniqueSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.completed).toBe(true);
  });
});
