import { describe, expect, it } from "vitest";
import {
  DEFAULT_HAMILTONIAN_PATH_INPUT,
  generateHamiltonianPathDpSteps,
  hamiltonianPathDp,
} from "../hamiltonianPathDp";

describe("hamiltonianPathDp logic spec", () => {
  it("should have valid metadata", () => {
    expect(hamiltonianPathDp.id).toBe("hamiltonian-path-dp");
    expect(hamiltonianPathDp.category).toBe("backtracking");
    expect(hamiltonianPathDp.difficulty).toBe("Hard");
  });

  it("should generate >= 20 steps for default input (4 nodes, 5 edges)", () => {
    const steps = generateHamiltonianPathDpSteps(DEFAULT_HAMILTONIAN_PATH_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);

    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.pathFound).toBe(true);
  });

  it("should map every line of python code in trivia lineExplanations", () => {
    const codeLines = hamiltonianPathDp.code.split("\n").length;
    expect(codeLines).toBe(23);
    for (let line = 1; line <= codeLines; line++) {
      expect(hamiltonianPathDp.trivia?.lineExplanations[line]).toBeDefined();
    }
  });
});
