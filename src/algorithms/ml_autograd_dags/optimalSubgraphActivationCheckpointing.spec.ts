import { describe, it, expect } from "vitest";
import {
  optimalSubgraphActivationCheckpointing,
  DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
  generateOptimalSubgraphActivationCheckpointingSteps,
} from "./optimalSubgraphActivationCheckpointing";

describe("optimal-subgraph-activation-checkpointing (Optimal Subgraph Activation Checkpointing Scheduler)", () => {
  it("should have correct metadata", () => {
    expect(optimalSubgraphActivationCheckpointing.id).toBe(
      "optimal-subgraph-activation-checkpointing",
    );
    expect(optimalSubgraphActivationCheckpointing.isMlInfra).toBe(true);
    expect(optimalSubgraphActivationCheckpointing.mlInfraLevel).toBe(3);
    expect(optimalSubgraphActivationCheckpointing.mlInfraCategory).toBe("ml_autograd_dags");
    expect(optimalSubgraphActivationCheckpointing.categories).toContain("ml_autograd_dags");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateOptimalSubgraphActivationCheckpointingSteps(
      DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Optimal Subgraph Activation Checkpointing Scheduler",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should have complete lineExplanations for every code line", () => {
    const totalLines = optimalSubgraphActivationCheckpointing.code.trim().split("\n").length;
    expect(optimalSubgraphActivationCheckpointing.trivia).toBeDefined();
    expect(optimalSubgraphActivationCheckpointing.trivia?.lineExplanations).toBeDefined();
    const lineExplanations = optimalSubgraphActivationCheckpointing.trivia!.lineExplanations!;
    for (let line = 1; line <= totalLines; line++) {
      expect(lineExplanations[line]).toBeDefined();
      expect(lineExplanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should have step codeLines pointing to valid lines in Python code", () => {
    const totalLines = optimalSubgraphActivationCheckpointing.code.trim().split("\n").length;
    const steps = generateOptimalSubgraphActivationCheckpointingSteps(
      DEFAULT_OPTIMALSUBGRAPHACTIVATIONCHECKPOINTING_INPUT,
    );
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    });
  });
});
