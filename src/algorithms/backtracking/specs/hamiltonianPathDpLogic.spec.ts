import { describe, expect, it } from "vitest";
import {
  DEFAULT_HAMILTONIAN_PATH_INPUT,
  generateHamiltonianPathDpSteps,
  hamiltonianPathDp,
} from "../hamiltonianPathDp";
import { requireExampleInputs, requireLineExplanations } from "../../specs/assertions";

describe("hamiltonianPathDp logic spec", () => {
  it("should have valid metadata", () => {
    expect(hamiltonianPathDp.id).toBe("hamiltonian-path-dp");
    expect(hamiltonianPathDp.topicIds).toContain("backtracking");
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
    const explanations = requireLineExplanations(hamiltonianPathDp);
    expect(codeLines).toBe(23);
    for (let line = 1; line <= codeLines; line++) {
      expect(explanations[line]).toBeDefined();
    }
  });

  it("should have codeLine in valid range (1..N) for defaultInput and all examples", () => {
    const totalLines = hamiltonianPathDp.code.split("\n").length;
    const inputsToTest = [
      hamiltonianPathDp.defaultInput,
      ...requireExampleInputs(
        hamiltonianPathDp,
        (input): input is typeof hamiltonianPathDp.defaultInput =>
          typeof input === "object" && input !== null,
      ),
    ];

    for (const input of inputsToTest) {
      const steps = generateHamiltonianPathDpSteps(input);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.codeLine).toBeGreaterThanOrEqual(1);
        expect(step.codeLine).toBeLessThanOrEqual(totalLines);
      }
    }
  });
});
